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
  score integer
);

create index if not exists articles_journalist_id_idx on articles (journalist_id);
create index if not exists articles_player_name_idx on articles (player_name);

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

-- 6) RLS 활성화 + 정책. 테이블마다 정책 2개씩:
--    "select_all"         — 누구나(비로그인 포함) 조회 가능
--    "write_authenticated" — 로그인한 사용자만 등록/수정/삭제 가능
-- (for all은 select도 포함하지만, select_all이 이미 모두에게 허용하고 있어서
-- 겹쳐도 문제없다 — 두 정책 중 하나라도 허용하면 통과하는 방식(permissive).)
-- 재실행해도 안전하도록 먼저 drop policy if exists로 지우고 다시 만든다.

alter table journalists enable row level security;
alter table articles enable row level security;
alter table rumors enable row level security;
alter table players enable row level security;
alter table clubs enable row level security;

drop policy if exists "select_all" on journalists;
create policy "select_all" on journalists for select using (true);
drop policy if exists "write_authenticated" on journalists;
create policy "write_authenticated" on journalists for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "select_all" on articles;
create policy "select_all" on articles for select using (true);
drop policy if exists "write_authenticated" on articles;
create policy "write_authenticated" on articles for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

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
drop policy if exists "write_authenticated" on clubs;
create policy "write_authenticated" on clubs for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
