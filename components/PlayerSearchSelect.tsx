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
  /** 검색해도 없는 선수를 새로 등록할 때. players 테이블에 insert하고
   * 성공하면 그 결과를 돌려줘야 한다(부모가 바로 선택 처리). */
  onCreateNew: (input: { name: string; currentTeam: string }) => Promise<PlayerOption>;
}

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-600";

// 선수 수가 많아지면(실제 배포 시 "거의 모든 선수") 긴 드롭다운에서 고르기
// 어려우니, 자동완성처럼 타이핑해서 걸러낸 뒤 목록에서 클릭으로 확정하는
// 방식. <select>와 달리 일치하는 후보만 눌러야 선택되고(자유 입력 불가),
// 선택하면 부모(app/admin/page.tsx)가 "이적 전 팀"을 자동으로 채운다.
// 검색해도 없는 선수면("새로 보도되는 신예" 등) 바로 아래에서 현재 소속팀만
// 같이 입력해 새로 등록하고 이어서 선택할 수 있다.
export default function PlayerSearchSelect({
  players,
  selected,
  onSelect,
  onCreateNew,
}: PlayerSearchSelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [newPlayerTeam, setNewPlayerTeam] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const trimmed = query.trim();
  const filtered = trimmed === "" ? players : players.filter((p) => p.name.includes(trimmed));

  const handleCreate = async () => {
    if (!trimmed || !newPlayerTeam.trim()) return;
    setCreating(true);
    setCreateError(null);

    try {
      const created = await onCreateNew({ name: trimmed, currentTeam: newPlayerTeam.trim() });
      onSelect(created);
      setQuery("");
      setNewPlayerTeam("");
      setOpen(false);
    } catch (err) {
      setCreateError(String(err instanceof Error ? err.message : err));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={open ? query : (selected?.name ?? "")}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setCreateError(null);
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
        <div
          onMouseDown={(e) => e.preventDefault()}
          className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-zinc-300 bg-white text-sm shadow-lg"
        >
          <ul className="max-h-48 overflow-auto">
            {filtered.map((player) => (
              <li key={player.id}>
                <button
                  type="button"
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
            ))}
          </ul>

          {trimmed !== "" && (
            <div className="border-t border-zinc-200 bg-zinc-50 p-3">
              {filtered.length === 0 && (
                <p className="mb-2 text-xs text-zinc-400">
                  &apos;{trimmed}&apos;와(과) 일치하는 선수가 없습니다.
                </p>
              )}
              <p className="mb-1 text-xs font-medium text-zinc-600">
                새 선수로 추가: {trimmed}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPlayerTeam}
                  onChange={(e) => setNewPlayerTeam(e.target.value)}
                  placeholder="현재 소속팀"
                  className="flex-1 rounded border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-emerald-600"
                />
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating || !newPlayerTeam.trim()}
                  className="shrink-0 rounded bg-zinc-900 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
                >
                  {creating ? "추가 중..." : "추가"}
                </button>
              </div>
              {createError && <p className="mt-1 text-xs text-red-600">{createError}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
