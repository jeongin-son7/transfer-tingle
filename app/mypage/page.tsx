"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import { useAdminSession } from "@/lib/auth";
import { getSupabaseClient } from "@/lib/supabase";
import {
  deleteArticle,
  updateArticle,
  type ArticleEditInput,
  type JournalistRow,
} from "@/lib/articleMutations";
import type { Certainty } from "@/lib/types";

interface MyArticleRow {
  id: string;
  url: string;
  journalist_id: string;
  player_name: string;
  from_team: string;
  to_team: string;
  certainty: Certainty;
  summary: string | null;
  published_at: string;
  score: number | null;
}

const CERTAINTY_OPTIONS: Certainty[] = ["확정", "진전", "관심"];
const fieldClass = "rounded border border-zinc-300 px-2 py-1";

function ArticleRowEditor({
  article,
  journalist,
  onSaved,
  onDeleted,
}: {
  article: MyArticleRow;
  journalist: JournalistRow | undefined;
  onSaved: (updated: MyArticleRow) => void;
  onDeleted: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(article.url);
  const [certainty, setCertainty] = useState<Certainty>(article.certainty);
  const [summary, setSummary] = useState(article.summary ?? "");
  const [publishedAt, setPublishedAt] = useState(article.published_at);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!journalist) return;
    setSaving(true);
    setError(null);

    try {
      const input: ArticleEditInput = { url, certainty, summary, publishedAt };
      const { article: updated } = await updateArticle(
        article.id,
        input,
        article.from_team,
        journalist,
      );
      onSaved(updated as MyArticleRow);
      setEditing(false);
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠어요?")) return;
    setDeleting(true);
    try {
      await deleteArticle(article.id);
      onDeleted();
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
      setDeleting(false);
    }
  };

  return (
    <li className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {article.player_name} ({article.from_team} → {article.to_team})
          </p>
          <p className="text-xs text-zinc-400">
            {journalist ? `${journalist.name} · ${journalist.outlet}` : "기자 정보 없음"}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-bold text-emerald-700">
          {article.score ?? 0}점
        </span>
      </div>

      {editing ? (
        <div className="mt-3 flex flex-col gap-2 text-sm">
          <label className="flex flex-col gap-1 text-xs text-zinc-500">
            기사 링크
            <input value={url} onChange={(e) => setUrl(e.target.value)} className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-500">
            확실성
            <select
              value={certainty}
              onChange={(e) => setCertainty(e.target.value as Certainty)}
              className={fieldClass}
            >
              {CERTAINTY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-500">
            날짜
            <input
              type="date"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-500">
            요약
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={2}
              className={fieldClass}
            />
          </label>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded border border-zinc-300 px-3 py-1 text-xs text-zinc-500 hover:bg-zinc-50"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="rounded-full border border-zinc-300 px-2 py-0.5 font-medium text-zinc-600">
            {article.certainty}
          </span>
          <span className="text-zinc-400">{article.published_at}</span>
          {error && <span className="text-red-600">{error}</span>}
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={() => setEditing(true)} className="text-emerald-600 hover:underline">
              수정
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-600 hover:underline disabled:opacity-50"
            >
              {deleting ? "삭제 중..." : "삭제"}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function MyArticles() {
  const session = useAdminSession();
  const [articles, setArticles] = useState<MyArticleRow[]>([]);
  const [journalists, setJournalists] = useState<JournalistRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!session) return;
    const supabase = getSupabaseClient();

    Promise.all([
      supabase
        .from("articles")
        .select(
          "id, url, journalist_id, player_name, from_team, to_team, certainty, summary, published_at, score",
        )
        .eq("created_by", session.user.id)
        .order("published_at", { ascending: false }),
      fetch("/api/journalists").then((res) => res.json()),
    ]).then(([articlesRes, journalistsData]) => {
      if (articlesRes.error) {
        setLoadError(articlesRes.error.message);
      } else {
        setArticles(articlesRes.data as MyArticleRow[]);
      }
      if (journalistsData.ok) {
        setJournalists(journalistsData.journalists);
      }
      setLoaded(true);
    });
  }, [session]);

  const journalistById = new Map(journalists.map((j) => [j.id, j]));

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">마이페이지</h1>
      <p className="mt-1 text-xs text-zinc-400">
        내가 등록한 기사만 모아서 수정·삭제할 수 있어요.
      </p>

      {loadError && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          내 기사 목록을 불러오지 못했습니다: {loadError}
        </p>
      )}

      <ul className="mt-6 flex flex-col gap-3">
        {articles.map((article) => (
          <ArticleRowEditor
            key={article.id}
            article={article}
            journalist={journalistById.get(article.journalist_id)}
            onSaved={(updated) =>
              setArticles((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
            }
            onDeleted={() => setArticles((prev) => prev.filter((a) => a.id !== article.id))}
          />
        ))}
      </ul>

      {loaded && articles.length === 0 && !loadError && (
        <p className="mt-10 text-center text-sm text-zinc-400">
          아직 등록한 기사가 없습니다.{" "}
          <Link href="/admin" className="text-emerald-600 hover:underline">
            기사 등록하러 가기
          </Link>
        </p>
      )}
    </main>
  );
}

export default function MyPage() {
  return (
    <AuthGate>
      <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
        <MyArticles />
      </div>
    </AuthGate>
  );
}
