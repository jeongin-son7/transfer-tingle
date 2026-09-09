"use client";

import { useMemo, useState } from "react";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import FilterSidebar from "@/components/FilterSidebar";
import RumorCard from "@/components/RumorCard";
import { rumors } from "@/lib/dummyData";
import { EMPTY_FILTER, filterRumors, hasActiveFilter, sortByLatest, type RumorFilterState } from "@/lib/filters";

export default function Home() {
  const [filter, setFilter] = useState<RumorFilterState>(EMPTY_FILTER);

  const players = useMemo(() => [...new Set(rumors.map((rumor) => rumor.playerName))], []);

  const visibleRumors = useMemo(() => sortByLatest(filterRumors(rumors, filter)), [filter]);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50">
      <Header />
      <div className="mx-auto flex w-full max-w-5xl flex-1">
        <FilterSidebar players={players} value={filter} onChange={setFilter} />
        <main className="flex flex-1 flex-col gap-4 px-6 py-6">
          <SearchBar />

          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span>최신순 · 총 {visibleRumors.length}건</span>
            {hasActiveFilter(filter) && (
              <button
                type="button"
                onClick={() => setFilter(EMPTY_FILTER)}
                className="text-emerald-600 underline underline-offset-2"
              >
                필터 초기화
              </button>
            )}
          </div>

          <section className="flex flex-col gap-3">
            {visibleRumors.length === 0 ? (
              <p className="rounded-lg border border-dashed border-zinc-300 py-16 text-center text-sm text-zinc-400">
                조건에 맞는 이적설이 없습니다.
              </p>
            ) : (
              visibleRumors.map((rumor) => <RumorCard key={rumor.id} rumor={rumor} />)
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
