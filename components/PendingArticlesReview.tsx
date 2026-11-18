"use client";

import { useState } from "react";
import { approveArticleAction, rejectArticleAction, type PendingArticleRow } from "@/app/admin/actions";

export interface JournalistLookup {
  id: string;
  name: string;
  outlet: string;
}

function PendingArticleCard({
  article,
  journalist,
  onDecided,
}: {
  article: PendingArticleRow;
  journalist: JournalistLookup | undefined;
  onDecided: (id: string) => void;
}) {
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDecide = async (decision: "approve" | "reject") => {
    setPending(decision);
    setError(null);

    const result =
      decision === "approve" ? await approveArticleAction(article.id) : await rejectArticleAction(article.id);

    if (result.error) {
      setError(result.error);
      setPending(null);
      return;
    }

    onDecided(article.id);
  };

  return (
    <li className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {article.player_name} ({article.from_team} → {article.to_team})
          </p>
          <p className="text-xs text-zinc-400">
            {journalist ? `${journalist.name} · ${journalist.outlet}` : "기자 정보 없음"} ·{" "}
            {article.certainty} · {article.published_at}
          </p>
          {article.summary && <p className="mt-1 text-xs text-zinc-500">{article.summary}</p>}
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-xs text-emerald-600 hover:underline"
          >
            원문 보기 ↗
          </a>
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => handleDecide("approve")}
          disabled={pending !== null}
          className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {pending === "approve" ? "승인 중..." : "승인"}
        </button>
        <button
          type="button"
          onClick={() => handleDecide("reject")}
          disabled={pending !== null}
          className="rounded border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {pending === "reject" ? "반려 중..." : "반려"}
        </button>
      </div>
    </li>
  );
}

export default function PendingArticlesReview({
  initialPending,
  journalists,
}: {
  initialPending: PendingArticleRow[];
  journalists: JournalistLookup[];
}) {
  const [pendingArticles, setPendingArticles] = useState(initialPending);
  const journalistById = new Map(journalists.map((j) => [j.id, j]));

  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-8">
      <h2 className="mb-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">
        승인 대기 중인 기사 ({pendingArticles.length}건)
      </h2>
      <p className="mb-4 text-xs text-zinc-400">
        승인하기 전까지는 메인 · 상세 · 기자 프로필 화면에 공개되지 않고, 점수 ·
        적중률 계산에도 들어가지 않습니다.
      </p>

      {pendingArticles.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
          대기 중인 기사가 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {pendingArticles.map((article) => (
            <PendingArticleCard
              key={article.id}
              article={article}
              journalist={journalistById.get(article.journalist_id)}
              onDecided={(id) => setPendingArticles((prev) => prev.filter((a) => a.id !== id))}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
