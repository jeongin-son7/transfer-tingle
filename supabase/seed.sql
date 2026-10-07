-- 7차시: journalists 초기 데이터 (docs/PLAN.md 8번, lib/dummyData.ts와 동일한 값).
-- articles.journalist_id가 journalists(id)를 참조하기 때문에, 관리자 기사 등록
-- 폼을 쓰려면 이 시드가 먼저 들어가 있어야 한다 (등록 폼의 기자 선택 드롭다운도
-- 이 테이블에서 조회함).
--
-- Supabase 대시보드 SQL Editor에서 supabase/schema.sql 실행 → 이 파일 실행 순서로
-- 진행. 여러 번 실행해도 중복 생성되지 않도록(idempotent) name에 unique 인덱스를
-- 걸고 ON CONFLICT로 건너뛴다.

create unique index if not exists journalists_name_key on journalists (name);

insert into journalists (name, outlet, league_tiers, base_tier) values
  ('파브리지오 로마노', 'Here We Go (프리랜서)', '[{"league": "프리미어리그", "score": 95}]'::jsonb, 90),
  ('데이비드 오른스타인', 'The Athletic', '[{"league": "프리미어리그", "score": 97}]'::jsonb, 80),
  ('잔루카 디 마르치오', 'Sky Sport Italia', '[{"league": "세리에 A", "score": 93}]'::jsonb, 55),
  ('플로리안 플레텐베르크', 'Sky Sport DE', '[{"league": "분데스리가", "score": 92}]'::jsonb, 50),
  ('던컨 카슬스', '프리랜서 (팟캐스트)', '[]'::jsonb, 30)
on conflict (name) do nothing;

-- 선수 마스터 테이블(players) 초기 데이터. docs/PLAN.md 7번 공식 10명 기준,
-- current_team은 lib/dummyData.ts 더미 기사들의 fromTeam과 동일하게 맞췄다.
-- 관리자 등록 폼에서 선수를 검색·선택하면 이 값으로 "이적 전 팀"이 자동 채워진다.
insert into players (name, current_team) values
  ('오마르 마르무시', '맨체스터 시티'),
  ('사비뉴', '맨체스터 시티'),
  ('미하일로 무드릭', '첼시'),
  ('루카 부슈코비치', '브라이튼'),
  ('코디 가크포', '리버풀'),
  ('곤살로 라모스', '파리 생제르맹'),
  ('니코 슐로터베크', '보루시아 도르트문트'),
  ('라파엘 레앙', 'AC 밀란'),
  ('브루누 페르난데스', '맨체스터 유나이티드'),
  ('콜 파머', '첼시')
on conflict (name) do nothing;
