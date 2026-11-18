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
import { useInterestedPlayers } from "@/lib/interests";
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
  // 로그인 없이 쓰는 "관심 선수" — 이 브라우저의 localStorage에만 저장된다
  // (lib/interests.ts 주석 참고). hydrated 전에는 항상 false라서, 서버
  // 렌더링 결과와 클라이언트 렌더링 결과가 깜빡이지 않고 자연스럽게 이어진다.
  const { interests, toggleInterest } = useInterestedPlayers();
  const [onlyInterested, setOnlyInterested] = useState(false);

  const players = useMemo(() => [...new Set(rumors.map((rumor) => rumor.playerName))], [rumors]);
  // "팀별" 필터는 더 이상 고정된 5팀(CORE_TEAMS)이 아니라, 실제 이적설에
  // 등장하는 모든 팀(이적 전+후)을 보여준다 — 5대 리그 96개 구단 아무 팀이나
  // 이적설이 있으면 필터에 뜨도록.
  const teams = useMemo(
    () => [...new Set(rumors.flatMap((rumor) => [rumor.fromTeam, rumor.toTeam]))].sort(),
    [rumors],
  );

  const visibleRumors = useMemo(() => {
    const base = sortRumors(filterRumors(rumors, filter), sort);
    if (!onlyInterested) return base;
    return base.filter((rumor) => interests.has(rumor.playerName));
  }, [rumors, filter, sort, onlyInterested, interests]);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />
      {/* 좁은 화면에서는 사이드바(고정 너비 w-52)가 본문을 짓누르지 않도록
          위아래로 쌓고(flex-col), 데스크톱(md 이상)에서만 좌우로 나란히 둔다. */}
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col md:flex-row">
        <FilterSidebar
          teams={teams}
          players={players}
          journalists={journalists}
          value={filter}
          onChange={setFilter}
        />
        <main className="flex flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
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
            <div className="flex flex-wrap items-center gap-2">
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
              <button
                type="button"
                onClick={() => setOnlyInterested((v) => !v)}
                title="관심 선수는 이 브라우저에만 저장됩니다 — 기기를 바꾸면 사라져요."
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  onlyInterested
                    ? "bg-amber-500 text-white"
                    : "bg-white text-zinc-500 ring-1 ring-zinc-200 hover:text-amber-500 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-700"
                }`}
              >
                ★ 관심 목록만 보기{interests.size > 0 ? ` (${interests.size})` : ""}
              </button>
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
                {loadError
                  ? "데이터를 불러오지 못했습니다."
                  : onlyInterested
                    ? "관심 목록에 추가한 이적설이 없습니다. 카드의 ☆를 눌러 추가해보세요."
                    : "조건에 맞는 이적설이 없습니다."}
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
                  isInterested={interests.has(rumor.playerName)}
                  onToggleInterest={() => toggleInterest(rumor.playerName)}
                />
              ))
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
