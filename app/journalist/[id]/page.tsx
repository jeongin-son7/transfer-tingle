import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchLiveData } from "@/lib/supabaseData";
import { formatRelativeDate } from "@/lib/relativeDate";

export const dynamic = "force-dynamic";

const JUDGMENT_STYLE: Record<string, string> = {
  적중: "bg-emerald-600 text-white",
  빗나감: "bg-red-500 text-white",
  진행중: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  "관심(판정 제외)": "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500",
};

export default async function JournalistProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let loadError: string | null = null;
  let data: Awaited<ReturnType<typeof fetchLiveData>> | null = null;

  try {
    data = await fetchLiveData();
  } catch (err) {
    loadError = (err as Error).message;
  }

  if (loadError) {
    return (
      <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
        <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <Link href="/journalists" className="text-sm text-zinc-500 hover:text-emerald-600">
            ← 기자 랭킹으로
          </Link>
        </header>
        <main className="mx-auto w-full max-w-2xl px-6 py-8">
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            DB에서 기자 정보를 불러오지 못했습니다: {loadError}
          </p>
        </main>
      </div>
    );
  }

  const journalist = data!.journalists.find((j) => j.id === id);
  if (!journalist) {
    notFound();
  }

  const stat = data!.journalistStats.find((s) => s.journalistId === id);
  const rumorByPlayerName = new Map(data!.rumors.map((r) => [r.playerName, r]));
  const ownArticles = data!.articles
    .filter((a) => a.journalistId === id)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const initialPercent = stat ? Math.round(stat.initialRatio * 100) : 0;
  const calibratedPercent = stat ? Math.round(stat.calibratedRatio * 100) : initialPercent;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <Link href="/journalists" className="text-sm text-zinc-500 hover:text-emerald-600">
          ← 기자 랭킹으로
        </Link>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{journalist.name}</h1>
        <p className="text-sm text-zinc-500">{journalist.outlet}</p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs text-zinc-400">초기 기본 티어</p>
            <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {journalist.baseTier}점
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs text-zinc-400">보정된 신뢰도</p>
            <p className="mt-1 text-lg font-bold text-emerald-700 dark:text-emerald-400">
              {calibratedPercent}%
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs text-zinc-400">판정된 기사</p>
            <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {stat?.judgedCount ?? 0}건
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs text-zinc-400">적중</p>
            <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {stat?.hits ?? 0}건
            </p>
          </div>
        </div>

        {journalist.leagueTiers.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
            {journalist.leagueTiers.map((tier) => (
              <span
                key={tier.league}
                className="rounded-full border border-zinc-300 px-2 py-0.5 dark:border-zinc-700"
              >
                {tier.league} {tier.score}점
              </span>
            ))}
          </div>
        )}

        <p className="mt-3 text-xs text-zinc-400">
          {stat && stat.judgedCount > 0
            ? `결과가 확정된 이적설의 확정/진전 기사 ${stat.judgedCount}건 중 ${stat.hits}건이 실제 결과와 일치했습니다. 초기 기본 티어(${initialPercent}%)에서 보정된 신뢰도(${calibratedPercent}%)로 ${
                calibratedPercent > initialPercent ? "상향" : calibratedPercent < initialPercent ? "하향" : "유지"
              } 조정됐습니다.`
            : "아직 결과가 확정된 이적설 중 이 기자가 확정/진전으로 보도한 기사가 없어서, 초기 기본 티어가 그대로 적용됩니다."}
        </p>

        <h2 className="mt-8 text-xs font-semibold tracking-wide text-zinc-400">
          쓴 기사 ({ownArticles.length}건)
        </h2>

        <ol className="mt-3 flex flex-col gap-3">
          {ownArticles.map((article) => {
            const rumor = rumorByPlayerName.get(article.playerName);
            const judgmentLabel =
              article.judgment ??
              (article.certainty === "관심" ? "관심(판정 제외)" : (rumor?.status ?? "진행중"));

            return (
              <li
                key={article.id}
                className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/rumor/${encodeURIComponent(article.playerName)}`}
                    className="text-sm font-semibold text-zinc-900 hover:text-emerald-600 dark:text-zinc-50"
                  >
                    {article.playerName}
                  </Link>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      JUDGMENT_STYLE[judgmentLabel] ?? JUDGMENT_STYLE["진행중"]
                    }`}
                  >
                    {judgmentLabel}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {article.fromTeam} → {article.toTeam} · {article.certainty} ·{" "}
                  {formatRelativeDate(article.publishedAt)}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  원점수 {article.score}점 → 보정 후 {article.calibratedScore}점
                </p>
              </li>
            );
          })}
        </ol>

        {ownArticles.length === 0 && (
          <p className="mt-10 text-center text-sm text-zinc-400">아직 등록한 기사가 없습니다.</p>
        )}
      </main>
    </div>
  );
}
