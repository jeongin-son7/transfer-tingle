"use client";

import { useMemo, useState } from "react";
import type { RumorFilterState } from "@/lib/filters";
import type { Journalist } from "@/lib/types";

interface Option {
  key: string;
  label: string;
}

function FilterGroup({
  title,
  options,
  selected,
  onSelect,
  searchPlaceholder,
}: {
  title: string;
  options: Option[];
  selected: string | null;
  onSelect: (key: string | null) => void;
  searchPlaceholder: string;
}) {
  const [query, setQuery] = useState("");

  // 목록이 길어지면(팀 96개, 선수 수십 명) 스크롤로 다 찾기 어려워서,
  // 버튼 목록 자체를 검색어로 한 번 더 걸러낸다. 선택된 항목은 검색어와
  // 안 맞아도 "선택 중"이라는 걸 보여주려고 목록에 그대로 남겨둔다.
  const filteredOptions = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return options;
    return options.filter(
      (option) => option.key === selected || option.label.includes(trimmed),
    );
  }, [options, query, selected]);

  return (
    <div>
      <h3 className="mb-2 px-1 text-xs font-semibold tracking-wide text-zinc-400">{title}</h3>

      {options.length > 6 && (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="mb-2 w-full rounded-md border border-zinc-200 px-2 py-1 text-xs outline-none focus:border-emerald-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      )}

      <div className="flex max-h-56 flex-col gap-1 overflow-y-auto">
        <button
          type="button"
          aria-pressed={selected === null}
          onClick={() => onSelect(null)}
          className={`rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
            selected === null
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
        >
          전체
        </button>
        {filteredOptions.map((option) => (
          <button
            key={option.key}
            type="button"
            aria-pressed={selected === option.key}
            onClick={() => onSelect(option.key)}
            className={`rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
              selected === option.key
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {option.label}
          </button>
        ))}
        {filteredOptions.length === 0 && (
          <p className="px-2.5 py-1.5 text-xs text-zinc-400">검색 결과가 없습니다.</p>
        )}
      </div>
    </div>
  );
}

interface FilterSidebarProps {
  /** 현재 데이터에 등장하는 팀 이름 목록("팀별" 필터 옵션). 더 이상 고정된
   * 5팀(CORE_TEAMS)이 아니라, 실제 이적설에 등장하는 모든 팀(이적 전+후)을
   * 넘겨받는다 — 5대 리그 96개 구단 중 어디든 이적설만 있으면 필터에 뜬다. */
  teams: string[];
  /** 현재 데이터에 등장하는 선수 이름 목록 ("선수별" 필터 옵션). */
  players: string[];
  /** DB에 저장된 기자 목록 ("기자별" 필터 옵션). 더미 데이터가 아니라 실제
   * Supabase journalists를 넘겨받아야 한다 — id가 서로 다르면 필터가 안 먹음. */
  journalists: Journalist[];
  value: RumorFilterState;
  onChange: (next: RumorFilterState) => void;
}

// 계획서 취지에 맞춘 실제 필터: "팀별/기자별/선수별"을 누르면 정렬이 아니라
// 그 카테고리의 구체적인 선택지가 나타나고, 하나를 고르면 해당 조건에 맞는
// 이적설만 화면에 남는다. "최신순"은 항상 적용되는 기본 정렬이라 여기엔 없다.
export default function FilterSidebar({
  teams,
  players,
  journalists,
  value,
  onChange,
}: FilterSidebarProps) {
  return (
    <aside className="flex w-52 shrink-0 flex-col gap-6 border-r border-zinc-200 bg-white px-3 py-6 dark:border-zinc-800 dark:bg-zinc-900">
      <FilterGroup
        title="팀별"
        options={teams.map((team) => ({ key: team, label: team }))}
        selected={value.team}
        onSelect={(team) => onChange({ ...value, team })}
        searchPlaceholder="팀 검색"
      />
      <FilterGroup
        title="기자별"
        options={journalists.map((journalist) => ({ key: journalist.id, label: journalist.name }))}
        selected={value.journalistId}
        onSelect={(journalistId) => onChange({ ...value, journalistId })}
        searchPlaceholder="기자 검색"
      />
      <FilterGroup
        title="선수별"
        options={players.map((name) => ({ key: name, label: name }))}
        selected={value.playerName}
        onSelect={(playerName) => onChange({ ...value, playerName })}
        searchPlaceholder="선수 검색"
      />
    </aside>
  );
}
