import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import TeamBadge from "@/components/TeamBadge";
import RumorFavoriteToggle from "@/components/RumorFavoriteToggle";
import ShareButton from "@/components/ShareButton";
import CommentsSection from "@/components/CommentsSection";
import ArticleVotes from "@/components/ArticleVotes";
import { buildClubMap, fetchLiveData } from "@/lib/supabaseData";
import { getSupabaseClient } from "@/lib/supabase";
import { formatRelativeDate } from "@/lib/relativeDate";

// 메인 화면과 마찬가지로 항상 최신 DB 데이터를 봐야 하므로 빌드 시점에 미리
// 생성해두지 않는다 (예전엔 더미 데이터라 generateStaticParams로 미리 만들어
// 뒀지만, 실제 id는 빌드 시점에 알 수 없어서 더 이상 쓸 수 없음).
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const playerName = decodeURIComponent(id);

  try {
    const data = await fetchLiveData();
    const rumor = data.rumors.find((r) => r.playerName === playerName);
    if (!rumor) {
      return { title: `${playerName} - 이적팅글` };
    }

    const description = `${rumor.fromTeam} → ${rumor.toTeam} 이적설, 종합 신뢰 점수 ${rumor.score}점`;
    return {
      title: `${playerName} 이적설 - 이적팅글`,
      description,
      openGraph: {
        title: `${playerName} 이적설 (신뢰 점수 ${rumor.score}점)`,
        description,
        type: "article",
      },
    };
  } catch {
    return { title: `${playerName} - 이적팅글` };
  }
}

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
  let clubs: Awaited<ReturnType<typeof fetchLiveData>>["clubs"] = [];

  try {
    const data = await fetchLiveData();
    journalists = data.journalists;
    clubs = data.clubs;
    rumor = data.rumors.find((r) => r.playerName === playerName);
    timeline = data.articles
      .filter((article) => article.playerName === playerName)
      .sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
  } catch (err) {
    loadError = (err as Error).message;
  }

  if (loadError) {
    return (
      <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
        <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <Link href="/" className="text-sm text-zinc-500 hover:text-emerald-600">
            ← 메인으로
          </Link>
        </header>
        <main className="mx-auto w-full max-w-2xl px-6 py-8">
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            DB에서 이적설을 불러오지 못했습니다: {loadError}
          </p>
        </main>
      </div>
    );
  }

  if (!rumor) {
    notFound();
  }

  // 조회수 증가. 실패해도(아직 increment_rumor_view 함수를 못 만들었거나 등)
  // 페이지 자체는 보여줘야 하니 조용히 무시한다.
  try {
    const supabase = getSupabaseClient();
    await supabase.rpc("increment_rumor_view", { target_player_name: playerName });
  } catch {
    // 조회수 집계 실패는 치명적이지 않으니 무시.
  }

  const clubMap = buildClubMap(clubs);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-emerald-600"
        >
          ← 메인으로
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-8">
        <section>
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{rumor.playerName}</h1>
            <RumorFavoriteToggle playerName={rumor.playerName} />
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            <TeamBadge team={rumor.fromTeam} club={clubMap.get(rumor.fromTeam)} />
            <span>{rumor.fromTeam}</span>
            <span className="text-zinc-400">→</span>
            <TeamBadge team={rumor.toTeam} club={clubMap.get(rumor.toTeam)} />
            <span>{rumor.toTeam}</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              종합 신뢰 점수 {rumor.score}점
            </p>
            <span className="text-xs text-zinc-400">
              ♥ {rumor.favoriteCount} · 조회 {rumor.viewCount}
            </span>
            <ShareButton title={`${rumor.playerName} 이적설 - 이적팅글`} />
          </div>
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
                <li key={article.id} className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{journalist.name}</p>
                      <p className="text-xs text-zinc-400">{journalist.outlet}</p>
                    </div>
                    {/* 저장 시점에 lib/articleMutations.ts가 계산해 둔 개별 신뢰 점수 */}
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      {article.score}점
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="rounded-full border border-zinc-300 px-2 py-0.5 font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                      {article.certainty}
                    </span>
                    <span className="text-zinc-400">
                      {formatRelativeDate(article.publishedAt)} · {article.publishedAt}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{article.summary}</p>

                  <ArticleVotes articleId={article.id} />

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

        <CommentsSection playerName={rumor.playerName} />
      </main>
    </div>
  );
}
