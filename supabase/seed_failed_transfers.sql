-- 실제로 "무산"된 이적설 3건(기사 각 3개, 총 9개) 추가. 지금까지 넣은 실제
-- 이적 6건이 전부 성사라서 적중률 계산에 "빗나감" 사례가 하나도 없었다 — 이
-- 파일로 그 공백을 메운다.
--
-- supabase/migration_rumor_outcome.sql을 먼저 실행해서 rumors 테이블에
-- status/actual_team/resolved_at 컬럼이 있어야 이 파일의 마지막 upsert가
-- 통과한다. RLS는 이 파일에서 건드리지 않는다(select/insert만 사용, 기존
-- 정책 그대로 적용됨 — articles/players는 로그인한 사용자 누구나 쓰기 가능,
-- rumors도 로그인 사용자 쓰기 가능 정책 그대로).
--
-- 처음 후보로 얘기했던 "2021년 케인 맨시티행"·"2022년 음바페 레알행"은
-- 뺐다 — 둘 다 이미 다른(성사) 이적설과 선수 이름이 겹쳐서, 지금 구조
-- (선수 1명 = 이적설 1개 = 결과 1개)로는 같은 선수의 서로 다른 시기 이적설을
-- 구분할 수 없다. 대신 완전히 다른 선수 3명으로 골랐다:
--
-- 1) 빅터 오시멘: 나폴리 → 첼시 (2024년 여름 마감일 무산, 대신 갈라타사라이 임대)
-- 2) 제이든 산초: 보루시아 도르트문트 → 맨체스터 유나이티드 (2020년 마감일
--    무산, 도르트문트 잔류 — 실제로는 2021년에 성사됐지만 그 이후 이적은
--    이번에 다루지 않음, 같은 이유로 이름 중복 방지)
-- 3) 로멜루 루카쿠: 첼시 → 인터 밀란 (2023년 여름 완전 영입 무산, 대신
--    AS 로마 임대)
--
-- 참고: 세 건 모두 실제로 "Here We Go"/확정 수준까지는 간 적이 없어서(그래서
-- 무산됐다) 확실성은 진전/관심까지만 썼다 — 확정 단계 기사가 빗나간 사례는
-- 이번 데이터엔 없다.

insert into players (name, current_team) values
  ('빅터 오시멘', '갈라타사라이'),
  ('제이든 산초', '자유계약(2026년 9월 맨체스터 유나이티드 계약 만료)'),
  ('로멜루 루카쿠', '페네르바체')
on conflict (name) do nothing;

insert into articles
  (url, journalist_id, player_name, from_team, to_team, certainty, summary, published_at, score)
values
  -- 1) 빅터 오시멘: 나폴리 → 첼시 (2024, 무산 — 대신 갈라타사라이 임대)
  (
    'https://twitter.com/DuncanCastles',
    (select id from journalists where name = '던컨 카슬스'),
    '빅터 오시멘', '나폴리', '첼시', '관심',
    '첼시가 여름 영입 후보로 오시멘을 검토하고 있다는 초기 보도.',
    '2024-08-20', 12
  ),
  (
    'https://twitter.com/FabrizioRomano',
    (select id from journalists where name = '파브리지오 로마노'),
    '빅터 오시멘', '나폴리', '첼시', '진전',
    '첼시가 마감일을 앞두고 유력 후보로 떠올랐으나 개인 조건·이적료 조율 중.',
    '2024-08-28', 63
  ),
  (
    'https://theathletic.com',
    (select id from journalists where name = '데이비드 오른스타인'),
    '빅터 오시멘', '나폴리', '첼시', '진전',
    '첼시 쪽에서 합의가 임박했다는 분위기지만 아직 공식 발표는 없음.',
    '2024-08-29', 56
  ),

  -- 2) 제이든 산초: 보루시아 도르트문트 → 맨체스터 유나이티드 (2020, 무산 — 도르트문트 잔류)
  (
    'https://twitter.com/DuncanCastles',
    (select id from journalists where name = '던컨 카슬스'),
    '제이든 산초', '보루시아 도르트문트', '맨체스터 유나이티드', '관심',
    '맨유가 여름 최대 영입 후보로 산초를 검토 중이라는 초기 보도.',
    '2020-07-20', 12
  ),
  (
    'https://www.skysport.de',
    (select id from journalists where name = '플로리안 플레텐베르크'),
    '제이든 산초', '보루시아 도르트문트', '맨체스터 유나이티드', '진전',
    '도르트문트가 8월 10일을 협상 마감 시한으로 제시, 이적료 차이는 여전.',
    '2020-08-05', 64
  ),
  (
    'https://twitter.com/FabrizioRomano',
    (select id from journalists where name = '파브리지오 로마노'),
    '제이든 산초', '보루시아 도르트문트', '맨체스터 유나이티드', '진전',
    '맨유가 마감 시한 전 합의를 시도하고 있으나 입장차가 여전히 크다고 전함.',
    '2020-08-09', 63
  ),

  -- 3) 로멜루 루카쿠: 첼시 → 인터 밀란 (2023, 완전 영입 무산 — AS 로마 임대로 대체)
  (
    'https://twitter.com/DuncanCastles',
    (select id from journalists where name = '던컨 카슬스'),
    '로멜루 루카쿠', '첼시', '인터 밀란', '관심',
    '인터가 루카쿠의 완전 영입을 다시 추진할 수 있다는 초기 관측.',
    '2023-07-05', 12
  ),
  (
    'https://twitter.com/FabrizioRomano',
    (select id from journalists where name = '파브리지오 로마노'),
    '로멜루 루카쿠', '첼시', '인터 밀란', '진전',
    '인터와 첼시, 이적료 구두 합의(약 3000만 유로+보너스)에 도달.',
    '2023-07-11', 67
  ),
  (
    'https://theathletic.com',
    (select id from journalists where name = '데이비드 오른스타인'),
    '로멜루 루카쿠', '첼시', '인터 밀란', '진전',
    '세부 조건 조율이 마지막 단계라는 영국 매체 쪽 보도.',
    '2023-07-13', 68
  );

insert into rumors (player_name, status, actual_team, resolved_at)
values
  ('빅터 오시멘', '무산', '갈라타사라이(임대, 2025년 완전 영입)', '2024-08-30'),
  ('제이든 산초', '무산', '보루시아 도르트문트(잔류)', '2020-08-10'),
  ('로멜루 루카쿠', '무산', 'AS 로마(임대)', '2023-07-15')
on conflict (player_name) do update set
  status = excluded.status,
  actual_team = excluded.actual_team,
  resolved_at = excluded.resolved_at;
