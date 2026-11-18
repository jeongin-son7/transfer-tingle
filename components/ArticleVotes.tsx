"use client";

import { useEffect, useState } from "react";
import { useAdminSession } from "@/lib/auth";
import { getSupabaseClient } from "@/lib/supabase";

type Vote = "agree" | "disagree";

export default function ArticleVotes({
  articleId,
  disabled = false,
}: {
  articleId: string;
  /** 이적설이 이미 성사/무산으로 끝났으면 더 투표할 의미가 없어서 막는다. */
  disabled?: boolean;
}) {
  const session = useAdminSession();
  const [agree, setAgree] = useState(0);
  const [disagree, setDisagree] = useState(0);
  const [myVote, setMyVote] = useState<Vote | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase
      .from("article_votes")
      .select("vote, user_id")
      .eq("article_id", articleId)
      .then(({ data }) => {
        const rows = data ?? [];
        setAgree(rows.filter((row) => row.vote === "agree").length);
        setDisagree(rows.filter((row) => row.vote === "disagree").length);
        if (session) {
          const mine = rows.find((row) => row.user_id === session.user.id);
          setMyVote((mine?.vote as Vote) ?? null);
        }
      });
  }, [articleId, session]);

  const handleVote = async (vote: Vote) => {
    if (!session || disabled) return;
    const supabase = getSupabaseClient();

    if (myVote === vote) {
      // 같은 버튼을 다시 누르면 투표 취소.
      await supabase
        .from("article_votes")
        .delete()
        .eq("article_id", articleId)
        .eq("user_id", session.user.id);
      setMyVote(null);
      if (vote === "agree") setAgree((n) => n - 1);
      else setDisagree((n) => n - 1);
      return;
    }

    const hadVote = myVote !== null;
    await supabase
      .from("article_votes")
      .upsert({ article_id: articleId, user_id: session.user.id, vote });

    if (vote === "agree") {
      setAgree((n) => n + 1);
      if (hadVote) setDisagree((n) => n - 1);
    } else {
      setDisagree((n) => n + 1);
      if (hadVote) setAgree((n) => n - 1);
    }
    setMyVote(vote);
  };

  return (
    <div className="mt-2 flex items-center gap-2 text-xs">
      <button
        type="button"
        onClick={() => handleVote("agree")}
        disabled={!session || disabled}
        title={disabled ? "종결된 이적설이라 투표할 수 없어요" : session ? undefined : "로그인하면 투표할 수 있어요"}
        className={`rounded-full px-2 py-1 disabled:opacity-50 ${
          myVote === "agree"
            ? "bg-emerald-600 text-white"
            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        }`}
      >
        👍 동의 {agree}
      </button>
      <button
        type="button"
        onClick={() => handleVote("disagree")}
        disabled={!session || disabled}
        title={disabled ? "종결된 이적설이라 투표할 수 없어요" : session ? undefined : "로그인하면 투표할 수 있어요"}
        className={`rounded-full px-2 py-1 disabled:opacity-50 ${
          myVote === "disagree"
            ? "bg-red-500 text-white"
            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        }`}
      >
        👎 반대 {disagree}
      </button>
    </div>
  );
}
