-- supabase/seed_real_articles.sql과 같은 방식으로 추가한 실제 이적 사례 3건
-- × 각 3개 기사(총 9개). 기존 6건(벨링엄/라이스/엔소/음바페/비르츠/파머)과
-- 겹치지 않는 선수로 골랐다. 점수는 lib/trustScore.ts 공식(기자의 해당 리그
-- 티어 또는 base_tier × 확실성 가중치)대로 손으로 미리 계산해서 넣어뒀다
-- (supabase/seed.sql의 기자 5명 tier 기준). journalist_id는 실행 환경마다
-- 랜덤 생성된 값이라 이름으로 조회하는 서브쿼리를 썼다.
--
-- 해리 케인·엘링 홀란드는 이미 supabase/seed.sql의 players에 들어있고(현재
-- 소속팀도 이적 후 팀과 일치), 모이세스 카이세도만 빠져 있어서 같이 추가한다.

insert into players (name, current_team) values
  ('모이세스 카이세도', '첼시')
on conflict (name) do nothing;

insert into articles
  (url, journalist_id, player_name, from_team, to_team, certainty, summary, published_at, score)
values
  -- 1) 해리 케인: 토트넘 홋스퍼 → 바이에른 뮌헨 (2023)
  (
    'https://twitter.com/FabrizioRomano',
    (select id from journalists where name = '파브리지오 로마노'),
    '해리 케인', '토트넘 홋스퍼', '바이에른 뮌헨', '확정',
    '토트넘과 바이에른 뮌헨, 이적료 합의 완료 — Here We Go.',
    '2023-08-12', 95
  ),
  (
    'https://theathletic.com',
    (select id from journalists where name = '데이비드 오른스타인'),
    '해리 케인', '토트넘 홋스퍼', '바이에른 뮌헨', '확정',
    '메디컬까지 마무리, 공식 발표만 남았다고 The Athletic 단독 확인.',
    '2023-08-11', 97
  ),
  (
    'https://www.skysport.de',
    (select id from journalists where name = '플로리안 플레텐베르크'),
    '해리 케인', '토트넘 홋스퍼', '바이에른 뮌헨', '진전',
    '바이에른 내부적으로 막판 협상이 급물살을 타고 있다는 독일 현지 보도.',
    '2023-08-07', 35
  ),

  -- 2) 엘링 홀란드: 보루시아 도르트문트 → 맨체스터 시티 (2022)
  (
    'https://www.skysport.de',
    (select id from journalists where name = '플로리안 플레텐베르크'),
    '엘링 홀란드', '보루시아 도르트문트', '맨체스터 시티', '확정',
    '도르트문트, 바이아웃 조항 발동 확인 — 맨체스터 시티행 공식화.',
    '2022-05-02', 92
  ),
  (
    'https://twitter.com/FabrizioRomano',
    (select id from journalists where name = '파브리지오 로마노'),
    '엘링 홀란드', '보루시아 도르트문트', '맨체스터 시티', '확정',
    '맨체스터 시티와 개인 합의 완료, 메디컬 일정까지 — Here We Go.',
    '2022-05-03', 90
  ),
  (
    'https://twitter.com/DuncanCastles',
    (select id from journalists where name = '던컨 카슬스'),
    '엘링 홀란드', '보루시아 도르트문트', '맨체스터 시티', '진전',
    '맨체스터 시티가 유력 후보로 떠올랐다는 초기 단계 보도.',
    '2022-04-20', 21
  ),

  -- 3) 모이세스 카이세도: 브라이튼 → 첼시 (2023, 겨울 아닌 여름 마감일 드라마)
  (
    'https://theathletic.com',
    (select id from journalists where name = '데이비드 오른스타인'),
    '모이세스 카이세도', '브라이튼', '첼시', '확정',
    '첼시, 영국 역대 최고 이적료로 카이세도 영입 완료 — The Athletic 확인.',
    '2023-08-14', 97
  ),
  (
    'https://twitter.com/FabrizioRomano',
    (select id from journalists where name = '파브리지오 로마노'),
    '모이세스 카이세도', '브라이튼', '첼시', '확정',
    '마감일 드라마 끝에 첼시행 공식 확정 — Here We Go.',
    '2023-08-14', 95
  ),
  (
    'https://www.gianlucadimarzio.com',
    (select id from journalists where name = '잔루카 디 마르치오'),
    '모이세스 카이세도', '브라이튼', '첼시', '관심',
    '유럽 빅클럽들의 초기 관심 단계로 소개한 7월 초 보도.',
    '2023-07-20', 22
  );
