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
