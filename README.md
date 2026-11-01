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
   파일 자체는 커밋되지 않음). **Vercel에 배포된 버전을 쓰려면 Vercel 프로젝트 →
   Settings → Environment Variables에도 똑같이 추가하고 Redeploy 해야 함.**
2. Supabase 대시보드 → SQL Editor에서 순서대로 실행:
   1. [`supabase/schema.sql`](./supabase/schema.sql) — `journalists` / `articles` /
      `rumors` / `players` / `clubs` / `profiles` / `favorites` / `comments` /
      `article_votes` / `rumor_views` 테이블과 RLS 정책을 전부 생성 (재실행해도
      안전, idempotent — 기존 테이블이 있으면 새 컬럼만 추가함)
   2. [`supabase/seed.sql`](./supabase/seed.sql) — 기자 5명, 선수 55명(공식 10명 +
      실제 유명 선수 45명), 클럽 96개(유럽 5대 리그 전체) 초기 데이터
   3. [`supabase/seed_real_articles.sql`](./supabase/seed_real_articles.sql) — 실제
      있었던 이적 사례 6건 × 각 3개 기사(총 18개). 선수/구단/결과는 전부 사실이고,
      원문 링크는 각 기자의 실제 공개 프로필/매체 홈페이지로 연결해둠(특정 기사
      URL은 검증 불가능해서 지어내지 않음)
   4. [`supabase/backfill_club_logos.sql`](./supabase/backfill_club_logos.sql) —
      메인 화면에 이미 떠 있던 로고 주소를 `clubs.logo_url`로 옮겨 채움(1회성)
3. `npm run dev` 실행 후 [`/api/supabase-test`](http://localhost:3000/api/supabase-test)
   접속 — `{ "ok": true, ... }` 가 나오면 연결 성공. `{ "ok": false, "error": ... }` 면
   에러 메시지를 보고 원인 확인 (환경변수 비어있음 / 아직 schema.sql 안 돌림 등).
4. [`/admin`](http://localhost:3000/admin) 에서 기사 등록 테스트 — 저장하면 Supabase
   대시보드 Table Editor의 `articles` 테이블에서 바로 확인 가능.
5. **관리자 계정 만들기**: [`/signup`](http://localhost:3000/signup)에서 본인
   이메일로 직접 가입하거나, Supabase 대시보드 → Authentication → Users →
   **Add user**로 계정을 만든다("Auto Confirm User" 체크하면 이메일 인증
   단계 생략). 가입하면 트리거가 `profiles` 테이블에 행을 자동으로 만들지만
   `is_admin`은 기본 `false`다 — 본인을 관리자로 만들려면 SQL Editor에서
   한 번 직접 실행:
   ```sql
   update profiles set is_admin = true where email = '본인 이메일';
   ```

## 로그인·권한

- **기사 등록**(`/admin`)은 **로그인한 사용자 누구나** 쓸 수 있다 — 관리자가
  아니어도 가입만 하면 된다.
- **클럽 설정**(`/admin/settings`, 팀 엠블럼 등)은 **관리자만** 쓸 수 있다.
  로그인했지만 관리자가 아니면 "관리자 전용 페이지입니다" 화면이 뜬다.
- 누가 관리자인지는 `profiles.is_admin` 컬럼으로 구분한다. 가입 시
  Supabase가 `auth.users`에 사용자를 만들면, DB 트리거(`handle_new_user`,
  `supabase/schema.sql`)가 `profiles`에 `is_admin = false`로 행을 복사해둔다.
  관리자로 승격하려면 위 "관리자 계정 만들기"의 SQL을 직접 실행해야 한다
  (앱 화면에서 승격하는 기능은 없음 — 의도적으로 SQL Editor를 거치게 해서
  아무나 자기 자신을 관리자로 만들 수 없게 함).
- 진짜 보안은 **RLS**(`supabase/schema.sql`)가 담당한다 — `articles`는 "읽기는
  누구나, 쓰기는 로그인한 사용자 누구나" 정책, `clubs`는 "읽기는 누구나,
  쓰기는 `profiles.is_admin = true`인 사용자만" 정책으로 되어 있어서, 로그인
  화면을 우회해서 anon key로 직접 API를 호출해도 이 규칙은 그대로 지켜진다.
- 기사 등록(`lib/articleMutations.ts`)과 클럽 설정(`app/admin/settings/page.tsx`)
  모두 로그인된 브라우저가 Supabase에 **직접** 쓴다 (서버 API 라우트를 거치지
  않음 — RLS가 "로그인했는지/관리자인지"로 막아주기 때문에 안전함).
- **마이페이지**(`/mypage`)에서는 **본인이 등록한 기사만** 수정·삭제할 수
  있다 — RLS가 `articles.created_by = auth.uid()`(또는 관리자)인 경우만
  update/delete를 허용한다.

## 부가 기능

- **기자 신뢰도 랭킹** (`/journalists`) — 기자별 평균 신뢰 점수·기사 수 집계
- **마이페이지** (`/mypage`) — 내가 등록한 기사 목록, 수정/삭제
- **즐겨찾기** — 하트 버튼으로 관심 이적설 저장(로그인 필요), 메인 화면 정렬에 반영
- **조회수** — 상세 페이지 방문마다 자동 집계
- **정렬** — 메인 화면에서 최신순/즐겨찾기순/조회수순 전환
- **댓글** — 이적설 상세 페이지 하단에 댓글 작성(로그인 필요)/삭제(본인·관리자)
- **기사 신뢰도 투표** — 각 기사에 동의/반대 투표(로그인 필요)
- **공유 기능** — OG 메타태그(카카오톡/트위터 미리보기) + 공유/링크 복사 버튼
- **최근 등록 하이라이트** — 24시간 이내 등록된 이적설에 "NEW" 배지
- **다크 모드** — 헤더의 토글 버튼으로 전환, 선택값은 브라우저에 저장

## 현재 진행 상태

- [x] 1차시: 저장소 생성, 선수·팀 목록/기자 후보 정리 (`docs/PLAN.md`)
- [x] 2차시: 검색창·필터 버튼 UI (클릭 가능, 기능 없음)
- [x] 3차시: 더미 데이터 카드 목록 + 팀별/기자별/선수별/검색 필터
- [x] 4차시: 카드 클릭 → 상세 페이지(기사 타임라인)
- [x] 5차시: 신뢰도 계산 함수 화면 반영 + Vercel 배포
- [x] 6차시: Supabase 클라이언트 연동, 3개 테이블 스키마 작성, 연결 테스트 라우트
      (실제 Supabase 프로젝트 값 입력 + 대시보드에서 schema.sql 실행은 직접 진행)
- [x] 7차시: 관리자 등록 폼(`/admin`) → `articles` 테이블 저장 기능, 저장 시점에
      개별 신뢰 점수 계산 (기자 시드 데이터는 `supabase/seed.sql`로 직접 실행 필요)
- [x] 8차시: 메인·상세 화면이 더미 데이터 대신 Supabase 실제 데이터로 동작
- [x] 8차시 이후: 클럽/선수 데이터 현실화(5대 리그 96개 구단, 실제 선수 45명,
      실제 이적 사례 18개 기사), 관리자 로그인(Supabase Auth) + RLS로 쓰기 보호,
      `/admin/settings`에서 클럽 로고 등 직접 수정
- [x] 8차시 이후: 회원가입(`/signup`) 추가, 기사 등록은 로그인한 사용자 누구나
      가능하도록 개방, 클럽 설정만 `profiles.is_admin`으로 관리자 전용 유지
- [x] 8차시 이후: 부가 기능 일괄 추가 — 기자 랭킹, 마이페이지(내 기사 수정/삭제),
      즐겨찾기·조회수·정렬, 댓글, 기사 신뢰도 투표, 공유(OG 메타), 최근 등록
      하이라이트, 다크 모드
