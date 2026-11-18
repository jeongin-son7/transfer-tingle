"use client";

import { useState, type ReactNode } from "react";

// 데스크톱에서는 마우스를 올리면(hover) 보이고, 모바일처럼 hover가 없는
// 기기에서는 탭(click)하면 열리고 다시 탭하면 닫힌다 — 두 입력 방식을 같은
// open 상태 하나로 처리한다. 카드 전체가 <Link>로 감싸져 있는 곳에서도 쓰이므로
// 클릭 시 링크 이동이 같이 일어나지 않도록 preventDefault/stopPropagation을 건다.
export default function Tooltip({ content, children }: { content: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        className="cursor-help underline decoration-dotted decoration-from-font"
      >
        {children}
      </span>
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 z-20 mb-1.5 w-52 -translate-x-1/2 rounded-md bg-zinc-900 px-2.5 py-1.5 text-[11px] font-normal leading-snug text-white shadow-lg dark:bg-zinc-700"
        >
          {content}
        </span>
      )}
    </span>
  );
}
