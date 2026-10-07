"use client";

import { useState } from "react";

export interface PlayerOption {
  id: string;
  name: string;
  currentTeam: string;
}

interface PlayerSearchSelectProps {
  players: PlayerOption[];
  selected: PlayerOption | null;
  onSelect: (player: PlayerOption) => void;
}

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-600";

// 선수 수가 많아지면(실제 배포 시 "거의 모든 선수") 긴 드롭다운에서 고르기
// 어려우니, 자동완성처럼 타이핑해서 걸러낸 뒤 목록에서 클릭으로 확정하는
// 방식. <select>와 달리 일치하는 후보만 눌러야 선택되고(자유 입력 불가),
// 선택하면 부모(app/admin/page.tsx)가 "이적 전 팀"을 자동으로 채운다.
export default function PlayerSearchSelect({ players, selected, onSelect }: PlayerSearchSelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const trimmed = query.trim();
  const filtered = trimmed === "" ? players : players.filter((p) => p.name.includes(trimmed));

  return (
    <div className="relative">
      <input
        type="text"
        value={open ? query : (selected?.name ?? "")}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setQuery("");
          setOpen(true);
        }}
        onBlur={() => {
          // 목록 항목 클릭(onMouseDown)이 blur보다 먼저 처리되도록 약간 지연
          setTimeout(() => setOpen(false), 150);
        }}
        placeholder="선수 이름 검색"
        className={inputClass}
      />

      {open && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-zinc-300 bg-white text-sm shadow-lg">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-zinc-400">일치하는 선수가 없습니다</li>
          ) : (
            filtered.map((player) => (
              <li key={player.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onSelect(player);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="block w-full px-3 py-2 text-left hover:bg-zinc-100"
                >
                  {player.name}{" "}
                  <span className="text-xs text-zinc-400">({player.currentTeam})</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
