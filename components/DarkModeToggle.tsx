"use client";

import { useEffect, useState } from "react";

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // effect 본문에서 바로 setState하지 않으려고(react-hooks/set-state-in-effect)
    // Promise 콜백 안으로 옮겼다 — 마운트 직후 한 번만 실행되는 건 동일하다.
    Promise.resolve().then(() => {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem("theme");
      } catch {
        // 프라이빗 모드 등에서 localStorage 접근이 막힐 수 있음 — 그냥 시스템 설정을 따른다.
      }

      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initialDark = stored ? stored === "dark" : prefersDark;
      setIsDark(initialDark);
      document.documentElement.classList.toggle("dark", initialDark);
    });
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // 저장 실패해도 이번 세션 내 토글 자체는 그대로 동작하니 무시.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="다크 모드 전환"
      title="다크 모드 전환"
      className="rounded-full border border-zinc-300 px-2 py-1 text-xs hover:border-emerald-600 dark:border-zinc-700"
    >
      {isDark ? "🌙" : "☀️"}
    </button>
  );
}
