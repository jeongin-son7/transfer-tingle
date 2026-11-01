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
  sortRumors,
  SORT_OPTIONS,
  type RumorFilterState,
  type SortOption,
} from "@/lib/filters";
import { buildClubMap, type LiveClub } from "@/lib/supabaseData";
import { useAdminSession } from "@/lib/auth";
import { useFavoritePlayers } from "@/lib/favorites";
import type { Journalist, Rumor } from "@/lib/types";

interface HomeClientProps {
  rumors: Rumor[];
  journalists: Journalist[];
  clubs: LiveClub[];
  loadError: string | null;
}

// app/page.tsx(서버 컴포넌트)가 Supabase에서 읽어온 데이터를 props로 받아서,
// 필터·검색·정렬·즐겨찾기 같은 상호작용(클라이언트 상태)만 여기서 담당한다.
export default function HomeClient({ rumors, journalists, clubs, loadError }: HomeClientProps) {
  const [filter, setFilter] = useState<RumorFilterState>(EMPTY_FILTER);
  const [sort, setSort] = useState<SortOption>("latest");
  const clubMap = useMemo(() => buildClubMap(clubs), [clubs]);

  const session = useAdminSession();
  const { favorites, toggleFavorite } = useFavoritePlayers(session);

  const players = useMemo(() => [...new Set(rumors.map((rumor) => rumor.playerName))], [rumors]);
  // "팀별" 필터는 더 이상 고정된 5팀(CORE_TEAMS)이 아니라, 실제 이적설에
  // 등장하는 모든 팀(이적 전+후)을 보여준다 — 5대 리그 96개 구단 아무 팀이나
  // 이적설이 있으면 필터에 뜨도록.
  const teams = useMemo(
    () => [...new Set(rumors.flatMap((rumor) => [rumor.fromTeam, rumor.toTeam]))].sort(),
    [rumors],
  );

  const visibleRumors = useMemo(
    () => sortRumors(filterRumors(rumors, filter), sort),
    [rumors, filter, sort],
  );

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <div className="mx-auto flex w-full max-w-5xl flex-1">
        <FilterSidebar
          teams={teams}
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
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              DB에서 이적설을 불러오지 못했습니다: {loadError}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <span>총 {visibleRumors.length}건</span>
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

            <div className="flex items-center gap-1 text-xs">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSort(option.value)}
                  className={`rounded-full px-3 py-1 font-medium ${
                    sort === option.value
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "bg-white text-zinc-500 ring-1 ring-zinc-200 hover:text-emerald-600 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <section className="flex flex-col gap-3">
            {visibleRumors.length === 0 ? (
              <p className="rounded-lg border border-dashed border-zinc-300 py-16 text-center text-sm text-zinc-400">
                {loadError ? "데이터를 불러오지 못했습니다." : "조건에 맞는 이적설이 없습니다."}
              </p>
            ) : (
              visibleRumors.map((rumor) => (
                <RumorCard
                  key={rumor.id}
                  rumor={rumor}
                  clubs={clubMap}
                  isFavorited={favorites.has(rumor.playerName)}
                  loggedIn={!!session}
                  onToggleFavorite={() => toggleFavorite(rumor.playerName)}
                />
              ))
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
