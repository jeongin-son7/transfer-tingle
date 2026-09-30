import Link from "next/link";
import { notFound } from "next/navigation";
import TeamBadge from "@/components/TeamBadge";
import { articles, journalists, rumors } from "@/lib/dummyData";
import { formatRelativeDate } from "@/lib/relativeDate";
import { calculateArticleScore } from "@/lib/trustScore";
import type { Article } from "@/lib/types";

// 더미 데이터 기준이라 모든 이적설 상세 페이지를 빌드 시점에 미리 만들어 둔다.
// 6차시에 실제 DB로 바뀌면 이 함수는 지우거나 Supabase 조회로 바꾸면 된다.
export function generateStaticParams() {
  return rumors.map((rumor) => ({ id: rumor.id }));
}

export default async function RumorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rumor = rumors.find((r) => r.id === id);

  if (!rumor) {
    notFound();
  }

  // 관련 기사를 날짜순(오래된 것 → 최신) 타임라인으로 정렬.
  const timeline = rumor.articleIds
    .map((articleId) => articles.find((article) => article.id === articleId))
    .filter((article): article is Article => article !== undefined)
    .sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));

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

              const score = calculateArticleScore(article, journalist);

              return (
                <li key={article.id} className="rounded-lg border border-zinc-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{journalist.name}</p>
                      <p className="text-xs text-zinc-400">{journalist.outlet}</p>
                    </div>
                    {/* 개별 기사 신뢰 점수 = 티어 점수 × 확실성 가중치 (lib/trustScore.ts) */}
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-bold text-emerald-700">
                      {score}점
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
