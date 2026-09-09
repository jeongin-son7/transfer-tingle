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
- Supabase (6차시부터 연동 예정)
- Vercel 배포 (5차시부터)

## 현재 진행 상태

- [x] 1차시: 저장소 생성, 선수·팀 목록/기자 후보 정리 (`docs/PLAN.md`)
- [x] 2차시: 검색창·필터 버튼 UI (클릭 가능, 기능 없음)
- [x] 3차시: 더미 데이터 카드 목록 + 정렬 기능
- [ ] 4차시: 상세 페이지(타임라인)
- [ ] 5차시: 신뢰도 계산 함수 + Vercel 배포
- [ ] 6~8차시: Supabase 연동
