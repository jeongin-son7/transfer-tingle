"use client";

const FILTERS = [
  { key: "latest", label: "최신순" },
  { key: "team", label: "팀별" },
  { key: "journalist", label: "기자별" },
  { key: "player", label: "선수별" },
] as const;

export type FilterKey = (typeof FILTERS)[number]["key"];

interface FilterTabsProps {
  active: FilterKey;
  onChange: (key: FilterKey) => void;
}

export default function FilterTabs({ active, onChange }: FilterTabsProps) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="이적설 정렬 기준">
      {FILTERS.map((filter) => (
        <button
          key={filter.key}
          type="button"
          role="tab"
          aria-selected={active === filter.key}
          onClick={() => onChange(filter.key)}
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
