# 이적팅글 (transfer-tingle)

축구 이적설 기사를 선수·팀별로 모아 보여주고, 기사를 쓴 기자·매체의 신뢰도를 함께
표시해 주는 서비스. 정보과학 프로젝트 과제로 진행 중.

전체 기획(아키텍처, 데이터 모델, 신뢰도 계산 방식, 차시별 계획, 더미 데이터 목록)은
[`docs/PLAN.md`](./docs/PLAN.md) 참고.

## 개발 환경 실행

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인.

## 스택

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Supabase (연동 중 — 아래 참고)
- Vercel 배포 완료

## Supabase 연동

1. `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 값을
   Supabase 대시보드 → Settings → API 에서 복사해 채워 넣기 (`.env.example` 참고, 이
   파일 자체는 커밋되지 않음).
2. Supabase 대시보드 → SQL Editor에서 [`supabase/schema.sql`](./supabase/schema.sql)
   내용을 실행해 `journalists` / `articles` / `rumors` 3개 테이블 생성.
3. `npm run dev` 실행 후 [`/api/supabase-test`](http://localhost:3000/api/supabase-test)
   접속 — `{ "ok": true, ... }` 가 나오면 연결 성공. `{ "ok": false, "error": ... }` 면
   에러 메시지를 보고 원인 확인 (환경변수 비어있음 / 아직 schema.sql 안 돌림 등).

## 현재 진행 상태

- [x] 1차시: 저장소 생성, 선수·팀 목록/기자 후보 정리 (`docs/PLAN.md`)
- [x] 2차시: 검색창·필터 버튼 UI (클릭 가능, 기능 없음)
- [x] 3차시: 더미 데이터 카드 목록 + 팀별/기자별/선수별/검색 필터
- [x] 4차시: 카드 클릭 → 상세 페이지(기사 타임라인)
- [x] 5차시: 신뢰도 계산 함수 화면 반영 + Vercel 배포
- [x] 6차시: Supabase 클라이언트 연동, 3개 테이블 스키마 작성, 연결 테스트 라우트
      (실제 Supabase 프로젝트 값 입력 + 대시보드에서 schema.sql 실행은 직접 진행)
- [ ] 7차시: 관리자 등록 폼 → articles 테이블 저장 기능
- [ ] 8차시: 실제 DB 데이터로 메인·상세 화면 완성
