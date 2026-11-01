"use client";

import { useState } from "react";

export default function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // 사용자가 공유 시트를 취소한 경우 등 — 조용히 무시.
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 클립보드 접근 실패 — 조용히 무시.
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 hover:border-emerald-600 hover:text-emerald-600"
    >
      {copied ? "링크 복사됨" : "공유하기"}
    </button>
  );
}
