"use client";

import { useMemo, useState } from "react";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import FilterSidebar from "@/components/FilterSidebar";
import RumorCard from "@/components/RumorCard";
import {
  EMPTY_FILTER,
  filterRumors,
  hasActiveFilter,
  sortByLatest,
  type RumorFilterState,
} from "@/lib/filters";
import type { Journalist, Rumor } from "@/lib/types";

interface HomeClientProps {
  rumors: Rumor[];
  journalists: Journalist[];
  loadError: string | null;
}

// app/page.tsx(서버 컴포넌트)가 Supabase에서 읽어온 데이터를 props로 받아서,
// 필터·검색 같은 상호작용(클라이언트 상태)만 여기서 담당한다.
export default function HomeClient({ rumors, journalists, loadError }: HomeClientProps) {
  const [filter, setFilter] = useState<RumorFilterState>(EMPTY_FILTER);

  const players = useMemo(() => [...new Set(rumors.map((rumor) => rumor.playerName))], [rumors]);

  const visibleRumors = useMemo(() => sortByLatest(filterRumors(rumors, filter)), [rumors, filter]);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50">
      <Header />
      <div className="mx-auto flex w-full max-w-5xl flex-1">
        <FilterSidebar
          players={players}
          journalists={journalists}
          value={filter}
          onChange={setFilter}
        />
        <main className="flex flex-1 flex-col gap-4 px-6 py-6">
          <SearchBar
            value={filter.query}
            onChange={(query) => setFilter((prev) => ({ ...prev, query }))}
          />

          {loadError && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              DB에서 이적설을 불러오지 못했습니다: {loadError}
            </p>
          )}

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
                {loadError ? "데이터를 불러오지 못했습니다." : "조건에 맞는 이적설이 없습니다."}
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
