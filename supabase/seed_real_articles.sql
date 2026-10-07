-- 실제로 있었던(완료된) 이적 사례 6건 × 각 3개 기사 = 18개 기사. 선수/구단/결과는
-- 실제 사실이고, "같은 이적설도 기자에 따라 확실성·신뢰도가 다르게 보도된다"는
-- 걸 보여주려고 한 건당 여러 기자를 섞었다.
--
-- 원문 링크는 특정 기사 URL을 지어내는 대신(이 세션은 네트워크 제한으로
-- 실제 기사 URL이 맞는지 확인할 방법이 없음), 각 기자의 실제 공개 프로필/매체
-- 홈페이지로 연결해뒀다. 정확한 기사 링크를 찾으면 나중에 Table Editor에서
-- url 컬럼만 바꾸면 된다.
--
-- journalist_id는 실행 환경마다 랜덤 생성된 값이라, 이름으로 조회하는
-- 서브쿼리를 썼다. supabase/seed.sql의 기자 5명이 먼저 들어가 있어야 한다.

insert into articles
  (url, journalist_id, player_name, from_team, to_team, certainty, summary, published_at, score)
values
  -- 1) 주드 벨링엄: 도르트문트 → 레알 마드리드 (2023)
  (
    'https://twitter.com/FabrizioRomano',
    (select id from journalists where name = '파브리지오 로마노'),
    '주드 벨링엄', '보루시아 도르트문트', '레알 마드리드', '확정',
    '메디컬까지 마무리, 공식 발표만 남은 단계 — Here We Go.',
    '2023-06-14', 90
  ),
  (
    'https://www.skysport.de',
    (select id from journalists where name = '플로리안 플레텐베르크'),
    '주드 벨링엄', '보루시아 도르트문트', '레알 마드리드', '진전',
    '도르트문트 내부적으로 레알 마드리드행에 공감대, 이적료 세부 조율 단계.',
    '2023-06-01', 64
  ),
  (
    'https://twitter.com/DuncanCastles',
    (select id from journalists where name = '던컨 카슬스'),
    '주드 벨링엄', '보루시아 도르트문트', '레알 마드리드', '관심',
    '레알 마드리드가 관심을 보이고 있다는 초기 단계의 추측성 보도.',
    '2023-05-15', 12
  ),

  -- 2) 데클란 라이스: 웨스트햄 → 아스널 (2023)
  (
    'https://theathletic.com',
    (select id from journalists where name = '데이비드 오른스타인'),
    '데클란 라이스', '웨스트햄 유나이티드', '아스널', '확정',
    '아스널, 라이스 영입 완전 타결 — The Athletic 단독 보도.',
    '2023-07-15', 97
  ),
  (
    'https://twitter.com/FabrizioRomano',
    (select id from journalists where name = '파브리지오 로마노'),
    '데클란 라이스', '웨스트햄 유나이티드', '아스널', '확정',
    '메디컬 일정까지 확정 — Here We Go.',
    '2023-07-15', 95
  ),
  (
    'https://twitter.com/DuncanCastles',
    (select id from journalists where name = '던컨 카슬스'),
    '데클란 라이스', '웨스트햄 유나이티드', '아스널', '진전',
    '협상에 상당한 진전이 있다는 분위기라고 전함.',
    '2023-07-08', 21
  ),

  -- 3) 엔소 페르난데스: 벤피카 → 첼시 (2023년 1월, 겨울이적시장 마감일)
  (
    'https://twitter.com/FabrizioRomano',
    (select id from journalists where name = '파브리지오 로마노'),
    '엔소 페르난데스', '벤피카', '첼시', '확정',
    '첼시, 벤피카와 바이아웃 조건 전액 지불에 합의 — Here We Go.',
    '2023-01-31', 90
  ),
  (
    'https://www.gianlucadimarzio.com',
    (select id from journalists where name = '잔루카 디 마르치오'),
    '엔소 페르난데스', '벤피카', '첼시', '관심',
    '이탈리아 매체에서도 첼시의 공격적인 영입 행보를 주목하는 보도.',
    '2023-01-20', 22
  ),
  (
    'https://twitter.com/DuncanCastles',
    (select id from journalists where name = '던컨 카슬스'),
    '엔소 페르난데스', '벤피카', '첼시', '진전',
    '협상에 진전이 있다고 전했으나 세부 조건은 불확실하다고 언급.',
    '2023-01-29', 21
  ),

  -- 4) 킬리안 음바페: 파리 생제르맹 → 레알 마드리드 (2024, 자유 이적)
  (
    'https://twitter.com/FabrizioRomano',
    (select id from journalists where name = '파브리지오 로마노'),
    '킬리안 음바페', '파리 생제르맹', '레알 마드리드', '확정',
    'PSG와 계약 종료 후 자유 이적으로 레알 마드리드 합류 공식 확정.',
    '2024-06-03', 90
  ),
  (
    'https://theathletic.com',
    (select id from journalists where name = '데이비드 오른스타인'),
    '킬리안 음바페', '파리 생제르맹', '레알 마드리드', '진전',
    '레알 마드리드 이적이 임박했다는 영국 매체발 보도.',
    '2024-05-20', 56
  ),
  (
    'https://twitter.com/DuncanCastles',
    (select id from journalists where name = '던컨 카슬스'),
    '킬리안 음바페', '파리 생제르맹', '레알 마드리드', '관심',
    '수년째 반복된 루머의 연장선이라 이번에도 지켜봐야 한다는 신중한 의견.',
    '2024-04-01', 12
  ),

  -- 5) 플로리안 비르츠: 바이어 레버쿠젠 → 리버풀 (2025)
  (
    'https://www.skysport.de',
    (select id from journalists where name = '플로리안 플레텐베르크'),
    '플로리안 비르츠', '바이어 레버쿠젠', '리버풀', '확정',
    '레버쿠젠과 리버풀, 이적료 전액 합의 — 독일 현지 소식통 확인.',
    '2025-05-28', 92
  ),
  (
    'https://twitter.com/FabrizioRomano',
    (select id from journalists where name = '파브리지오 로마노'),
    '플로리안 비르츠', '바이어 레버쿠젠', '리버풀', '확정',
    '메디컬 일정 조율 중 — Here We Go 단계.',
    '2025-05-29', 90
  ),
  (
    'https://theathletic.com',
    (select id from journalists where name = '데이비드 오른스타인'),
    '플로리안 비르츠', '바이어 레버쿠젠', '리버풀', '진전',
    '리버풀 이사진 최종 승인 단계에 들어섰다는 보도.',
    '2025-05-20', 56
  ),

  -- 6) 콜 파머: 맨체스터 시티 → 첼시 (2023)
  (
    'https://twitter.com/FabrizioRomano',
    (select id from journalists where name = '파브리지오 로마노'),
    '콜 파머', '맨체스터 시티', '첼시', '확정',
    '첼시, 파머 영입 완료 — Here We Go.',
    '2023-08-31', 95
  ),
  (
    'https://theathletic.com',
    (select id from journalists where name = '데이비드 오른스타인'),
    '콜 파머', '맨체스터 시티', '첼시', '진전',
    '첼시가 맨체스터 시티와 합의에 근접했다는 보도.',
    '2023-08-29', 68
  ),
  (
    'https://twitter.com/DuncanCastles',
    (select id from journalists where name = '던컨 카슬스'),
    '콜 파머', '맨체스터 시티', '첼시', '관심',
    '젊은 유망주 영입설 수준으로, 아직 확정은 아니라고 전함.',
    '2023-08-20', 12
  );
