-- 기사 승인 시스템: articles에 승인 상태(대기/승인/반려) 컬럼 추가.
--
-- 기본값은 "대기" — 새로 등록되는 기사는 바로 공개되지 않고 관리자 승인을
-- 기다린다. 기존에 이미 등록돼 있던 기사는 전부 이미 공개돼 있던 거라
-- 한꺼번에 "승인"으로 채운다(아래 update문).
--
-- RLS 안전성: 이 마이그레이션은 ALTER TABLE ADD COLUMN + UPDATE뿐이고, RLS를
-- enable/disable하거나 기존 정책을 지우는 문장이 전혀 없다. articles는
-- 이미 supabase/schema.sql에서 RLS가 켜져 있고 정책도 그대로 유지된다.
--
-- 참고: 메인/상세/기자 프로필 화면과 점수·적중률 계산은 lib/supabaseData.ts의
-- fetchLiveData()가 "승인"된 기사만 걸러서 보여준다(이 마이그레이션 자체는
-- 화면 쪽 코드가 아니라 DB 컬럼만 추가함). 승인/반려 버튼이 있는 관리자
-- 화면은 별도로 안내한다.

-- "컬럼을 방금 처음 추가했을 때만" 백필하도록 조건을 건다 — 그냥
-- `update ... where approval_status = '대기'`로 하면, 이 마이그레이션을
-- 나중에 다시 실행했을 때 그 사이에 새로 등록된 "진짜 대기 중" 기사까지
-- 전부 승인으로 밀어버리게 된다(재실행해도 안전해야 한다는 원칙 위반).
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'articles' and column_name = 'approval_status'
  ) then
    alter table articles add column approval_status text not null default '대기'
      check (approval_status in ('대기', '승인', '반려'));
    update articles set approval_status = '승인';
  end if;
end $$;
