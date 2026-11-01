-- docs/PLAN.md 3번 "데이터 모델" 기준 스키마 (6차시).
-- Supabase 대시보드 → SQL Editor에 붙여넣고 실행. lib/dummyData.ts의 TypeScript
-- 타입(lib/types.ts)과 필드가 1:1로 대응된다.
--
-- 보안 참고: Supabase Auth로 관리자 로그인을 붙인 뒤로는 RLS를 실제로 켜서
-- 쓴다 — 읽기(select)는 누구나 가능(공개 서비스니까), 쓰기(insert/update/
-- delete)는 로그인한 사용자만 가능하도록 아래쪽 정책에서 강제한다. 로그인
-- 화면만 막아두는 건 진짜 보안이 아니다(anon key로 API를 직접 호출하면
-- 그냥 뚫림) — RLS가 실제로 데이터베이스 단에서 막아주는 부분이다.

create extension if not exists pgcrypto;

-- 1) 기자 테이블
create table if not exists journalists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  outlet text not null,
  -- 리그별 신뢰도 티어: [{ "league": "프리미어리그", "score": 95 }, ...]
  league_tiers jsonb not null default '[]'::jsonb,
  -- 담당 리그 기록이 없을 때 대신 쓰는 기본 티어 점수
  base_tier integer not null
);

-- 2) 기사 테이블
create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  journalist_id uuid not null references journalists (id),
  player_name text not null,
  from_team text not null,
  to_team text not null,
  -- 확실성 문구 카테고리
  certainty text not null check (certainty in ('확정', '진전', '관심')),
  summary text,
  published_at date not null,
  -- 계산된 개별 신뢰 점수 (lib/trustScore.ts calculateArticleScore와 동일한 값)
  score integer,
  -- 누가 등록했는지(마이페이지 "내가 등록한 기사", 본인 글만 수정/삭제 가능하게
  -- 하는 용도). 회원가입 이전에 만들어진 기사는 null(작성자 없음 = 관리자만 수정 가능).
  created_by uuid references auth.users (id) on delete set null,
  -- 실제 DB에 등록된 시각("최근 등록" 하이라이트용). published_at은 사용자가
  -- 직접 입력하는 "기사 작성일"이라 실제 등록 시각과 다를 수 있어서 따로 둔다.
  created_at timestamptz not null default now()
);

alter table articles add column if not exists created_by uuid references auth.users (id) on delete set null;
alter table articles add column if not exists created_at timestamptz not null default now();

create index if not exists articles_journalist_id_idx on articles (journalist_id);
create index if not exists articles_player_name_idx on articles (player_name);
create index if not exists articles_created_by_idx on articles (created_by);

-- 3) 이적설 테이블
create table if not exists rumors (
  id uuid primary key default gen_random_uuid(),
  player_name text not null,
  -- 관련 기사 id 목록 (articles.id 참조값의 배열 — 배열 원소 단위 FK 제약은 걸 수 없음)
  article_ids uuid[] not null default '{}'::uuid[],
  -- 계산된 종합 신뢰 점수 (lib/trustScore.ts calculateAggregateScore와 동일한 값)
  aggregate_score integer,
  updated_at date
);

create index if not exists rumors_player_name_idx on rumors (player_name);

-- 4) 선수 마스터 테이블 (계획서 원안엔 없던 테이블, 7차시 진행 중 추가).
-- articles.player_name은 여전히 그냥 텍스트 컬럼이고(바꾸지 않음), 이 테이블은
-- 관리자 등록 폼에서 "선수를 검색해서 선택"하고 고르면 현재 소속팀을 자동으로
-- 채워주는 용도로만 쓴다. 나중에 실제 배포할 선수 전체 명단도 여기에 추가하면 됨.
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  current_team text not null
);

create unique index if not exists players_name_key on players (name);

-- 5) 클럽 마스터 테이블. 유럽 5대 리그(프리미어리그/라리가/세리에A/분데스리가/
-- 리그1) 전체 구단을 담아둔다. 지금은 참고 데이터로만 쓰지만, 나중에 선수
-- current_team이나 관리자 폼의 팀 선택을 여기서 끌어오게 확장할 수 있다.
-- logo_url은 외부(Wikipedia) 이미지 주소를 그대로 참조만 한다 — 저작권이 있는
-- 구단 엠블럼이라 우리가 직접 호스팅하지 않고, 식별 목적의 링크만 둔다.
create table if not exists clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_code text not null,
  league text not null,
  logo_url text
);

create unique index if not exists clubs_name_key on clubs (name);
create index if not exists clubs_league_idx on clubs (league);

-- 6) 회원 프로필 테이블. 기사 등록은 로그인한 사용자 누구나 가능하지만, 클럽
-- 설정(엠블럼 등) 수정은 관리자만 가능해야 해서 "이 사람이 관리자인가"를
-- 구분할 플래그가 필요하다. auth.users는 우리가 직접 열 수 없으니(Supabase
-- 내부 테이블), 가입할 때마다 트리거로 이 테이블에 행을 하나씩 복사해둔다.
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  is_admin boolean not null default false
);

-- 가입(auth.users insert) 시 자동으로 profiles 행 생성.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 이 스키마를 처음 실행하기 전에 이미 만들어둔 계정(Supabase 대시보드에서
-- 수동으로 만든 관리자 계정 등)은 트리거가 못 잡았으니 한 번 따라잡아준다.
insert into profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- 관리자로 만들고 싶은 계정은 이 스키마 실행 후 아래 SQL을 직접 한 번
-- 실행해서 승격한다 (이메일 주소를 본인 관리자 계정으로 바꿔서):
--   update profiles set is_admin = true where email = 'your-admin@example.com';

-- 7) 즐겨찾기. 이적설(player_name 기준 — rumors 테이블을 안 쓰는 것과 동일한
-- 이유로 player_name을 그대로 키로 씀)마다 사용자별로 하나씩만 존재.
-- 즐겨찾기 "순" 정렬이 전체 사용자 기준 인기도를 보여줘야 해서, 누가
-- 몇 명한테 즐겨찾기됐는지는 공개로 집계 가능하게 select는 전체 공개로 둔다
-- (민감한 정보는 아님 — "이 선수를 몇 명이 즐겨찾기했는지"뿐).
create table if not exists favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  player_name text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, player_name)
);

create index if not exists favorites_player_name_idx on favorites (player_name);

-- 8) 댓글. 이적설(player_name) 하나에 여러 댓글.
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  player_name text not null,
  user_id uuid references auth.users (id) on delete set null,
  email text,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_player_name_idx on comments (player_name);

-- 9) 기사별 신뢰도 투표(동의/반대). 기자·매체가 매긴 점수와는 별개로, 실제
-- 방문자들이 "이 기사 말이 되는 것 같다"를 직접 투표하는 기능. 유저당 기사당
-- 투표 1개(의견 바꾸면 upsert로 덮어씀).
create table if not exists article_votes (
  article_id uuid not null references articles (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  vote text not null check (vote in ('agree', 'disagree')),
  created_at timestamptz not null default now(),
  primary key (article_id, user_id)
);

create index if not exists article_votes_article_id_idx on article_votes (article_id);

-- 10) 조회수. player_name 하나당 숫자 하나. 직접 update 정책을 열어두면 아무나
-- REST API로 숫자를 마음대로 조작할 수 있어서, 증가는 아래 보안 definer 함수
-- (increment_rumor_view)로만 가능하게 막는다(테이블 자체엔 쓰기 정책 없음).
create table if not exists rumor_views (
  player_name text primary key,
  view_count integer not null default 0
);

create or replace function public.increment_rumor_view(target_player_name text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  insert into rumor_views (player_name, view_count)
  values (target_player_name, 1)
  on conflict (player_name) do update set view_count = rumor_views.view_count + 1;
end;
$$;

grant execute on function public.increment_rumor_view(text) to anon, authenticated;

-- 11) RLS 활성화 + 정책. 테이블마다 기본은 정책 2개씩:
--    "select_all"         — 누구나(비로그인 포함) 조회 가능
--    "write_authenticated" — 로그인한 사용자만 등록/수정/삭제 가능
-- (for all은 select도 포함하지만, select_all이 이미 모두에게 허용하고 있어서
-- 겹쳐도 문제없다 — 두 정책 중 하나라도 허용하면 통과하는 방식(permissive).)
-- clubs(클럽 설정)만 예외 — 관리자(profiles.is_admin = true)만 쓰기 가능.
-- 재실행해도 안전하도록 먼저 drop policy if exists로 지우고 다시 만든다.

alter table journalists enable row level security;
alter table articles enable row level security;
alter table rumors enable row level security;
alter table players enable row level security;
alter table clubs enable row level security;
alter table profiles enable row level security;
alter table favorites enable row level security;
alter table comments enable row level security;
alter table article_votes enable row level security;
alter table rumor_views enable row level security;

drop policy if exists "select_all" on journalists;
create policy "select_all" on journalists for select using (true);
drop policy if exists "write_authenticated" on journalists;
create policy "write_authenticated" on journalists for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "select_all" on articles;
create policy "select_all" on articles for select using (true);
-- 등록(insert)은 로그인한 사용자 누구나. 수정/삭제는 본인이 쓴 기사이거나
-- 관리자만(마이페이지 "내 기사만 수정/삭제" 기능의 실제 방어선).
drop policy if exists "write_authenticated" on articles;
drop policy if exists "insert_authenticated" on articles;
create policy "insert_authenticated" on articles for insert
  with check (auth.role() = 'authenticated');
drop policy if exists "update_own_or_admin" on articles;
create policy "update_own_or_admin" on articles for update
  using (
    created_by = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  )
  with check (
    created_by = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );
drop policy if exists "delete_own_or_admin" on articles;
create policy "delete_own_or_admin" on articles for delete
  using (
    created_by = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "select_all" on rumors;
create policy "select_all" on rumors for select using (true);
drop policy if exists "write_authenticated" on rumors;
create policy "write_authenticated" on rumors for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "select_all" on players;
create policy "select_all" on players for select using (true);
drop policy if exists "write_authenticated" on players;
create policy "write_authenticated" on players for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "select_all" on clubs;
create policy "select_all" on clubs for select using (true);
-- clubs는 두 단계로 나눈다: 새 클럽 "추가"(insert)는 로그인한 사용자 누구나
-- 가능 — 기사 등록 폼에서 처음 보는 팀 이름을 입력하면 자동으로 clubs에
-- 기본값(로고 없음)으로 등록해주기 위해서다(lib/articleMutations.ts의
-- ensureClubExists 참고). 반면 이미 있는 클럽의 이름·약자·로고를 "수정"하거나
-- "삭제"하는 건 관리자만 — 아무나 기존 club의 브랜딩을 망가뜨리지 못하게.
drop policy if exists "write_authenticated" on clubs;
drop policy if exists "write_admin_only" on clubs;
drop policy if exists "insert_authenticated" on clubs;
create policy "insert_authenticated" on clubs for insert
  with check (auth.role() = 'authenticated');
drop policy if exists "update_admin_only" on clubs;
create policy "update_admin_only" on clubs for update
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true))
  with check (exists (select 1 from profiles where id = auth.uid() and is_admin = true));
drop policy if exists "delete_admin_only" on clubs;
create policy "delete_admin_only" on clubs for delete
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

drop policy if exists "select_all" on profiles;
create policy "select_all" on profiles for select using (true);
-- profiles는 트리거(security definer)만 쓰고 앱에서 직접 insert/update 안 함 →
-- 쓰기 정책 없음(기본값으로 막힘). 관리자 승격은 SQL Editor에서 수동으로.

-- favorites: 전체 공개 조회(즐겨찾기 수를 집계해서 인기순 정렬에 씀), 본인
-- 즐겨찾기만 추가/삭제 가능.
drop policy if exists "select_all" on favorites;
create policy "select_all" on favorites for select using (true);
drop policy if exists "insert_own" on favorites;
create policy "insert_own" on favorites for insert with check (user_id = auth.uid());
drop policy if exists "delete_own" on favorites;
create policy "delete_own" on favorites for delete using (user_id = auth.uid());

-- comments: 전체 공개 조회, 로그인한 사용자만 작성, 본인 댓글이거나 관리자만
-- 삭제. 수정 기능은 없음(간단하게 삭제 후 재작성).
drop policy if exists "select_all" on comments;
create policy "select_all" on comments for select using (true);
drop policy if exists "insert_authenticated" on comments;
create policy "insert_authenticated" on comments for insert
  with check (auth.role() = 'authenticated' and user_id = auth.uid());
drop policy if exists "delete_own_or_admin" on comments;
create policy "delete_own_or_admin" on comments for delete
  using (
    user_id = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- article_votes: 전체 공개 조회(찬반 집계 표시용), 본인 투표만 추가/수정(의견
-- 변경)/삭제(투표 취소) 가능.
drop policy if exists "select_all" on article_votes;
create policy "select_all" on article_votes for select using (true);
drop policy if exists "insert_own" on article_votes;
create policy "insert_own" on article_votes for insert with check (user_id = auth.uid());
drop policy if exists "update_own" on article_votes;
create policy "update_own" on article_votes for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "delete_own" on article_votes;
create policy "delete_own" on article_votes for delete using (user_id = auth.uid());

-- rumor_views: 조회수는 전체 공개로 보여주되(인기순 정렬용), 직접 insert/update
-- 정책은 안 둔다 — 증가는 반드시 increment_rumor_view() 함수(security definer)를
-- 통해서만 가능하게 막아서, 누가 REST API로 숫자를 마음대로 못 올리게 한다.
drop policy if exists "select_all" on rumor_views;
create policy "select_all" on rumor_views for select using (true);
