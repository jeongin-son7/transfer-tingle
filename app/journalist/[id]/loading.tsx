// Next.js App Router가 이 라우트의 페이지가 데이터를 불러오는 동안 자동으로
// 보여주는 로딩 화면이다(Suspense 경계). page.tsx의 fetchLiveData()가 끝날
// 때까지 깜빡이는 빈 화면 대신 이 문구가 보인다.
export default function Loading() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <p className="text-sm text-zinc-400">불러오는 중...</p>
    </div>
  );
}
