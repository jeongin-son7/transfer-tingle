import Link from "next/link";
import { fetchLiveData } from "@/lib/supabaseData";

export const dynamic = "force-dynamic";

export default async function JournalistsPage() {
  let loadError: string | null = null;
  let rows: {
    id: string;
    name: string;
    outlet: string;
    articleCount: number;
    averageScore: number;
  }[] = [];

  try {
    const { journalists, articles } = await fetchLiveData();

    rows = journalists
      .map((journalist) => {
        const own = articles.filter((a) => a.journalistId === journalist.id);
        const averageScore =
          own.length === 0
            ? 0
            : Math.round(own.reduce((sum, a) => sum + a.score, 0) / own.length);

        return {
          id: journalist.id,
          name: journalist.name,
          outlet: journalist.outlet,
          articleCount: own.length,
          averageScore,
        };
      })
      .sort((a, b) => b.averageScore - a.averageScore || b.articleCount - a.articleCount);
  } catch (err) {
    loadError = (err as Error).message;
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <Link href="/" className="text-sm text-zinc-500 hover:text-emerald-600">
          ← 메인으로
        </Link>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">기자 신뢰도 랭킹</h1>
        <p className="mt-1 text-xs text-zinc-400">
          이 기자가 쓴 기사들의 개별 신뢰 점수 평균순으로 정렬했습니다.
        </p>

        {loadError && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            DB에서 기자 목록을 불러오지 못했습니다: {loadError}
          </p>
        )}

        <ol className="mt-6 flex flex-col gap-3">
          {rows.map((row, index) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 shrink-0 text-center text-sm font-bold text-zinc-300 dark:text-zinc-600">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{row.name}</p>
                  <p className="text-xs text-zinc-400">
                    {row.outlet} · 기사 {row.articleCount}건
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                평균 {row.averageScore}점
              </span>
            </li>
          ))}
        </ol>

        {!loadError && rows.length === 0 && (
          <p className="mt-10 text-center text-sm text-zinc-400">기자 데이터가 없습니다.</p>
        )}
      </main>
    </div>
  );
}
