import Link from "next/link";
import { notFound } from "next/navigation";
import TeamBadge from "@/components/TeamBadge";
import { fetchLiveData } from "@/lib/supabaseData";
import { formatRelativeDate } from "@/lib/relativeDate";

// 메인 화면과 마찬가지로 항상 최신 DB 데이터를 봐야 하므로 빌드 시점에 미리
// 생성해두지 않는다 (예전엔 더미 데이터라 generateStaticParams로 미리 만들어
// 뒀지만, 실제 id는 빌드 시점에 알 수 없어서 더 이상 쓸 수 없음).
export const dynamic = "force-dynamic";

export default async function RumorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const playerName = decodeURIComponent(id);

  let loadError: string | null = null;
  let timeline: Awaited<ReturnType<typeof fetchLiveData>>["articles"] = [];
  let rumor: Awaited<ReturnType<typeof fetchLiveData>>["rumors"][number] | undefined;
  let journalists: Awaited<ReturnType<typeof fetchLiveData>>["journalists"] = [];

  try {
    const data = await fetchLiveData();
    journalists = data.journalists;
    rumor = data.rumors.find((r) => r.playerName === playerName);
    timeline = data.articles
      .filter((article) => article.playerName === playerName)
      .sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
  } catch (err) {
    loadError = (err as Error).message;
  }

  if (loadError) {
    return (
      <div className="flex min-h-full flex-1 flex-col bg-zinc-50">
        <header className="border-b border-zinc-200 bg-white px-6 py-4">
          <Link href="/" className="text-sm text-zinc-500 hover:text-emerald-600">
            ← 메인으로
          </Link>
        </header>
        <main className="mx-auto w-full max-w-2xl px-6 py-8">
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            DB에서 이적설을 불러오지 못했습니다: {loadError}
          </p>
        </main>
      </div>
    );
  }

  if (!rumor) {
    notFound();
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-emerald-600"
        >
          ← 메인으로
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-8">
        <section>
          <h1 className="text-2xl font-bold text-zinc-900">{rumor.playerName}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-zinc-600">
            <TeamBadge team={rumor.fromTeam} />
            <span>{rumor.fromTeam}</span>
            <span className="text-zinc-400">→</span>
            <TeamBadge team={rumor.toTeam} />
            <span>{rumor.toTeam}</span>
          </div>
          <p className="mt-3 inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
            종합 신뢰 점수 {rumor.score}점
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold tracking-wide text-zinc-400">
            관련 기사 타임라인 ({timeline.length}건)
          </h2>

          <ol className="flex flex-col gap-3">
            {timeline.map((article) => {
              const journalist = journalists.find((j) => j.id === article.journalistId);
              if (!journalist) return null;

              return (
                <li key={article.id} className="rounded-lg border border-zinc-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{journalist.name}</p>
                      <p className="text-xs text-zinc-400">{journalist.outlet}</p>
                    </div>
                    {/* 저장 시점에 서버(app/api/articles/route.ts)가 계산해 둔 개별 신뢰 점수 */}
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-bold text-emerald-700">
                      {article.score}점
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="rounded-full border border-zinc-300 px-2 py-0.5 font-medium text-zinc-600">
                      {article.certainty}
                    </span>
                    <span className="text-zinc-400">
                      {formatRelativeDate(article.publishedAt)} · {article.publishedAt}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-zinc-700">{article.summary}</p>

                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-emerald-600 hover:underline"
                  >
                    원문 보기 ↗
                  </a>
                </li>
              );
            })}
          </ol>
        </section>
      </main>
    </div>
  );
}
