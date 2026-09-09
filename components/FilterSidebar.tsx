"use client";

import { journalists } from "@/lib/dummyData";
import type { RumorFilterState } from "@/lib/filters";
import { CORE_TEAMS } from "@/lib/teams";

interface Option {
  key: string;
  label: string;
}

function FilterGroup({
  title,
  options,
  selected,
  onSelect,
}: {
  title: string;
  options: Option[];
  selected: string | null;
  onSelect: (key: string | null) => void;
}) {
  return (
    <div>
      <h3 className="mb-2 px-1 text-xs font-semibold tracking-wide text-zinc-400">{title}</h3>
      <div className="flex flex-col gap-1">
        <button
          type="button"
          aria-pressed={selected === null}
          onClick={() => onSelect(null)}
          className={`rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
            selected === null
              ? "bg-zinc-900 text-white"
              : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          전체
        </button>
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            aria-pressed={selected === option.key}
            onClick={() => onSelect(option.key)}
            className={`rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
              selected === option.key
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface FilterSidebarProps {
  /** 현재 더미 데이터에 등장하는 선수 이름 목록 ("선수별" 필터 옵션). */
  players: string[];
  value: RumorFilterState;
  onChange: (next: RumorFilterState) => void;
}

// 계획서 취지에 맞춘 실제 필터: "팀별/기자별/선수별"을 누르면 정렬이 아니라
// 그 카테고리의 구체적인 선택지가 나타나고, 하나를 고르면 해당 조건에 맞는
// 이적설만 화면에 남는다. "최신순"은 항상 적용되는 기본 정렬이라 여기엔 없다.
export default function FilterSidebar({ players, value, onChange }: FilterSidebarProps) {
  return (
    <aside className="flex w-52 shrink-0 flex-col gap-6 border-r border-zinc-200 bg-white px-3 py-6">
      <FilterGroup
        title="팀별"
        options={CORE_TEAMS.map((team) => ({ key: team.name, label: team.name }))}
        selected={value.team}
        onSelect={(team) => onChange({ ...value, team })}
      />
      <FilterGroup
        title="기자별"
        options={journalists.map((journalist) => ({ key: journalist.id, label: journalist.name }))}
        selected={value.journalistId}
        onSelect={(journalistId) => onChange({ ...value, journalistId })}
      />
      <FilterGroup
        title="선수별"
        options={players.map((name) => ({ key: name, label: name }))}
        selected={value.playerName}
        onSelect={(playerName) => onChange({ ...value, playerName })}
      />
    </aside>
  );
}
