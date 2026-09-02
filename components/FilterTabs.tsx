"use client";

import { useState } from "react";

const FILTERS = [
  { key: "latest", label: "최신순" },
  { key: "team", label: "팀별" },
  { key: "journalist", label: "기자별" },
  { key: "player", label: "선수별" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export default function FilterTabs() {
  const [active, setActive] = useState<FilterKey>("latest");

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="이적설 정렬 기준">
      {FILTERS.map((filter) => (
        <button
          key={filter.key}
          type="button"
          role="tab"
          aria-selected={active === filter.key}
          onClick={() => {
            // TODO(3차시): 배열 정렬 함수와 연결해 실제 카드 순서를 바꾸기.
            // 지금은 버튼 자체의 활성 상태(클릭 가능한 UI)만 구현된 상태.
            setActive(filter.key);
          }}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
            active === filter.key
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
