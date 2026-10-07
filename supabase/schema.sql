-- docs/PLAN.md 3번 "데이터 모델" 기준 스키마 (6차시).
-- Supabase 대시보드 → SQL Editor에 붙여넣고 실행. lib/dummyData.ts의 TypeScript
-- 타입(lib/types.ts)과 필드가 1:1로 대응된다.
--
-- 보안 참고: 이 프로젝트는 로그인 기능이 없어서(관리자 등록 폼도 인증 없이 씀),
-- 지금은 Row Level Security를 켜지 않았다 — 꺼져 있으면 anon 키로 자유롭게
-- select/insert 할 수 있어서 지금 단계(7차시 데이터 저장 기능)에 맞다. 나중에
-- 로그인을 추가하게 되면 RLS를 켜고 정책을 추가해야 한다.

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

-- RLS가 어쩌다 켜져 있었던 적이 있어서(Table Editor에서 실수로 토글되는 등),
-- 재실행해도 확실히 꺼지도록 명시적으로 선언해둔다. 로그인 기능이 생기기 전까진
-- 이 상태를 유지한다.
alter table journalists disable row level security;
alter table articles disable row level security;
alter table rumors disable row level security;
alter table players disable row level security;
alter table clubs disable row level security;
