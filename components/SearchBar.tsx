"use client";

import { useState } from "react";

export default function SearchBar() {
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    // TODO(3~4차시): 선수·팀 더미 데이터 배열을 query로 필터링하는 로직과 연결하기.
    // 지금은 UI만 구현된 상태라 실제 검색은 동작하지 않는다.
    console.log("검색어:", query);
  };

  return (
    <div className="flex w-full gap-2">
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => event.key === "Enter" && handleSearch()}
        placeholder="선수명 또는 팀명을 검색하세요"
        className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-600"
      />
      <button
        type="button"
        onClick={handleSearch}
        className="shrink-0 rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700"
      >
        검색
      </button>
    </div>
  );
}
