"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useAdminSession, useIsAdmin } from "@/lib/auth";
import { getSupabaseClient } from "@/lib/supabase";

interface CommentRow {
  id: string;
  user_id: string | null;
  email: string | null;
  body: string;
  created_at: string;
}

export default function CommentsSection({ playerName }: { playerName: string }) {
  const session = useAdminSession();
  const isAdmin = useIsAdmin(session);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase
      .from("comments")
      .select("id, user_id, email, body, created_at")
      .eq("player_name", playerName)
      .order("created_at", { ascending: true })
      .then(({ data }) => setComments((data as CommentRow[]) ?? []));
  }, [playerName]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !body.trim()) return;

    setSubmitting(true);
    setError(null);

    const supabase = getSupabaseClient();
    const { data, error: insertError } = await supabase
      .from("comments")
      .insert({
        player_name: playerName,
        user_id: session.user.id,
        email: session.user.email,
        body: body.trim(),
      })
      .select()
      .single();

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setComments((prev) => [...prev, data as CommentRow]);
    setBody("");
  };

  const handleDelete = async (id: string) => {
    const supabase = getSupabaseClient();
    const { error: deleteError } = await supabase.from("comments").delete().eq("id", id);
    if (!deleteError) {
      setComments((prev) => prev.filter((comment) => comment.id !== id));
    }
  };

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold tracking-wide text-zinc-400">
        댓글 ({comments.length})
      </h2>

      <ul className="flex flex-col gap-2">
        {comments.map((comment) => (
          <li
            key={comment.id}
            className="rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-zinc-500">{comment.email ?? "익명"}</p>
                <p className="mt-1 text-zinc-700 dark:text-zinc-300">{comment.body}</p>
              </div>
              {session && (session.user.id === comment.user_id || isAdmin) && (
                <button
                  type="button"
                  onClick={() => handleDelete(comment.id)}
                  className="shrink-0 text-xs text-red-500 hover:underline"
                >
                  삭제
                </button>
              )}
            </div>
          </li>
        ))}
        {comments.length === 0 && <p className="text-xs text-zinc-400">아직 댓글이 없습니다.</p>}
      </ul>

      {session ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="댓글을 입력하세요"
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            등록
          </button>
        </form>
      ) : (
        <p className="text-xs text-zinc-400">
          <Link href="/admin/login" className="text-emerald-600 hover:underline">
            로그인
          </Link>
          하면 댓글을 쓸 수 있어요.
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </section>
  );
}
