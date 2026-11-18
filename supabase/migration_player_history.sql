-- 선수별 이적 이력 타임라인. "이 선수가 언제 어떤 팀 소속이었는가"를 보여주는
-- 용도라, articles/rumors(=우리 사이트가 다루는 "이적설")와는 별개의 사실
-- 기록 테이블이다. 기존 players와 마찬가지로 select는 전체 공개, 쓰기는
-- 로그인한 사용자 누구나(동일한 RLS 패턴).
--
-- 재실행해도 안전: 테이블 생성은 if not exists, 시드 데이터는
-- (player_name, team, start_date) 유니크 인덱스 + on conflict do nothing으로
-- 중복 삽입을 막는다.

create table if not exists player_history (
  id uuid primary key default gen_random_uuid(),
  player_name text not null,
  team text not null,
  start_date date not null,
  -- null이면 지금도 그 팀 소속이라는 뜻(진행 중인 가장 마지막 구간).
  end_date date,
  created_at timestamptz not null default now()
);

create index if not exists player_history_player_name_idx on player_history (player_name);
create unique index if not exists player_history_player_team_start_key
  on player_history (player_name, team, start_date);

alter table player_history enable row level security;

drop policy if exists "select_all" on player_history;
create policy "select_all" on player_history for select using (true);
drop policy if exists "write_authenticated" on player_history;
create policy "write_authenticated" on player_history for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 대표 선수 4명의 실제 이적 이력. 날짜는 Soccerway/구단 공식 발표 등으로 웹
-- 검색해서 확인한 값만 썼다 — 출처마다 며칠씩 다른 경우는 가장 널리 인용되는
-- 날짜를 썼고, 데뷔 시점이 불확실한 초기 유스 시절(예: 손흥민 함부르크 유스,
-- 오시멘 볼프스부르크/샤를루아 임대 등)은 통째로 빼고 "정확한 날짜가 확인되는
-- 구간"부터만 넣었다. 확인이 안 되는 선수(예: 해리 케인 — 유스 시절부터
-- 토트넘 1군 정착까지 임대를 여러 번 거쳐서 "소속 시작일"을 하나로 특정하기
-- 어려움)는 이번에 넣지 않았다(이력 없음 = 데이터가 없다는 뜻이지, 그 선수가
-- 이적을 안 했다는 뜻이 아니다).
insert into player_history (player_name, team, start_date, end_date) values
  -- 손흥민: 함부르크(1군 합류 2010.06) → 레버쿠젠 → 토트넘 → LAFC
  ('손흥민', '함부르크 SV', '2010-06-01', '2013-06-30'),
  ('손흥민', '바이어 레버쿠젠', '2013-07-01', '2015-08-27'),
  ('손흥민', '토트넘 홋스퍼', '2015-08-28', '2025-08-06'),
  ('손흥민', 'LAFC', '2025-08-07', null),

  -- 킬리안 음바페: 모나코(1군 데뷔 2015.12.02) → PSG(임대+완전이적 통합) → 레알 마드리드
  ('킬리안 음바페', 'AS 모나코', '2015-12-02', '2017-08-30'),
  ('킬리안 음바페', '파리 생제르맹', '2017-08-31', '2024-06-30'),
  ('킬리안 음바페', '레알 마드리드', '2024-07-01', null),

  -- 로베르트 레반도프스키: 도르트문트 → 바이에른 뮌헨 → 바르셀로나
  ('로베르트 레반도프스키', '보루시아 도르트문트', '2010-07-01', '2014-06-30'),
  ('로베르트 레반도프스키', '바이에른 뮌헨', '2014-07-01', '2022-07-16'),
  ('로베르트 레반도프스키', 'FC 바르셀로나', '2022-07-19', null),

  -- 빅터 오시멘: 릴 → 나폴리 → 갈라타사라이(임대+완전이적 통합)
  ('빅터 오시멘', '릴', '2019-08-01', '2020-07-30'),
  ('빅터 오시멘', '나폴리', '2020-07-31', '2024-09-03'),
  ('빅터 오시멘', '갈라타사라이', '2024-09-04', null)
on conflict (player_name, team, start_date) do nothing;
