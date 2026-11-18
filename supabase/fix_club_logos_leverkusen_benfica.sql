-- 친구 피드백: 레버쿠젠·벤피카 엠블럼이 잘못 나온다는 문제 수정.
--
-- 원인 조사 결과:
-- - 바이어 레버쿠젠: clubs 테이블에는 있었지만(supabase/seed.sql), logo_url이
--   한 번도 채워진 적이 없었다 — supabase/backfill_club_logos.sql이 커버한
--   17개 팀 중에 레버쿠젠은 없었다(당시 lib/teams.ts에도 레버쿠젠 항목 자체가
--   없었음). 그래서 실제 엠블럼 대신 이름 첫 글자("바") 회색 원 배지로 보였다.
--   거기다 short_code가 라리가의 레반테(레반테도 'LEV')와 겹쳐서, 둘 중 하나라도
--   로고가 깨지면 이니셜까지 똑같이 보이는 문제도 같이 발견했다. 실제 축구계에서
--   흔히 쓰는 약칭인 'B04'(창단 1904년)로 바꿔서 겹침을 없앴다.
-- - 벤피카: 애초에 5대 리그(프리미어리그/라리가/세리에A/분데스리가/리그1) 96개
--   클럽 목록에 없었다(포르투갈 리그는 범위 밖) — clubs 테이블에 행 자체가
--   없어서 관리자 설정 화면에서도 안 보이고 로고를 넣을 방법이 없었다. 이번에
--   clubs에 새로 추가한다(벤피카도 실제 이적 사례-엔소 페르난데스 건-의 출발팀
--   이라 화면에 꼭 나와야 함).
--
-- 참고: 이 세션은 네트워크 제한으로 Wikipedia 이미지가 실제로 뜨는지 직접
-- 확인은 못 했다(기존 17개 팀도 같은 방식으로 들어간 "best effort" 링크).
-- 혹시 깨져도 TeamBadge가 자동으로 이니셜 배지로 되돌아가니 "깨진 이미지"
-- 자체가 보이진 않지만, 실제로 로고가 제대로 뜨는지는 배포 후 직접 확인 필요.

update clubs set short_code = 'B04'
where name = '바이어 레버쿠젠';

update clubs set logo_url = 'https://en.wikipedia.org/wiki/Special:FilePath/Bayer_04_Leverkusen_logo.svg'
where name = '바이어 레버쿠젠';

insert into clubs (name, short_code, league, logo_url)
values (
  '벤피카', 'SLB', '프리메이라 리가',
  'https://en.wikipedia.org/wiki/Special:FilePath/SL_Benfica_logo.svg'
)
on conflict (name) do update set
  short_code = excluded.short_code,
  league = excluded.league,
  logo_url = excluded.logo_url;
