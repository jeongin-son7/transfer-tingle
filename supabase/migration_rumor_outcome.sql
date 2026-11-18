-- 이적설 결과(진행 중/성사/무산) 추가.
--
-- rumors 테이블은 원래 안 쓰고 있었다(supabase/schema.sql 3번 섹션 주석 참고 —
-- 이적설은 articles를 선수 기준으로 그때그때 묶어서 계산, 별도 PK 없음). 이제
-- 부터는 "결과만" 이 테이블에 저장해서 player_name으로 조회해 화면에 합쳐
-- 보여준다(lib/supabaseData.ts). 행이 없는 선수는 기본값대로 "진행중"/결과
-- 없음으로 취급하므로, 모든 이적설에 행을 만들 필요는 없다 — 결과가 나온
-- 것만 upsert하면 된다.
--
-- RLS 안전성: 이 마이그레이션은 ALTER TABLE ADD COLUMN + CREATE INDEX + INSERT
-- 뿐이고, RLS를 enable/disable하거나 기존 정책을 지우는 문장이 전혀 없다.
-- rumors는 이미 supabase/schema.sql에서 RLS가 켜져 있고 "select_all"(전체 공개
-- 조회) + "write_authenticated"(로그인한 사용자 쓰기) 정책이 걸려 있다 — 이
-- 마이그레이션 실행 전후로 그 상태는 그대로다. (예전에 Table Editor에서 RLS를
-- 실수로 켜서 전체가 안 보였던 사고는 Supabase 대시보드 UI에서 토글을 직접
-- 누른 것이었고, 이 SQL과는 무관한 별개의 경로다.)

alter table rumors add column if not exists status text not null default '진행중'
  check (status in ('진행중', '성사', '무산'));
alter table rumors add column if not exists actual_team text;
alter table rumors add column if not exists resolved_at date;

-- player_name 하나당 결과 행 하나만 있도록(아래 upsert가 이 제약을 이용함).
create unique index if not exists rumors_player_name_key on rumors (player_name);

-- 실제로 있었던 이적 6건의 결과. 전부 성사됐다(이적 자체가 실제 역사 — 더미가
-- 아님). 날짜는 기사 등록 시 넣은 published_at(그 기자가 보도한 날)이 아니라,
-- 구단이 공식 발표한 날을 웹 검색으로 다시 확인해서 넣었다(아주 가끔 하루 이틀
-- 차이가 남 — 예: 비르츠는 기사에서는 5월 말로 추정했지만 실제 공식 발표는
-- 6월 20일).
insert into rumors (player_name, status, actual_team, resolved_at)
values
  ('주드 벨링엄', '성사', '레알 마드리드', '2023-06-14'),
  ('데클란 라이스', '성사', '아스널', '2023-07-15'),
  ('엔소 페르난데스', '성사', '첼시', '2023-02-01'),
  ('킬리안 음바페', '성사', '레알 마드리드', '2024-06-03'),
  ('플로리안 비르츠', '성사', '리버풀', '2025-06-20'),
  ('콜 파머', '성사', '첼시', '2023-09-01')
on conflict (player_name) do update set
  status = excluded.status,
  actual_team = excluded.actual_team,
  resolved_at = excluded.resolved_at;
