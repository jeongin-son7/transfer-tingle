"use client";

import { useState, type FocusEvent } from "react";

interface TeamSearchInputProps {
  teams: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-600";

// 팀 이름은 선수와 달리 "반드시 목록에서 선택"을 강제하지 않는다 — 클럽
// 목록(clubs 테이블, 5대 리그 96개 구단)에 없는 새 팀이어도 자유롭게 입력할
// 수 있고, 저장하면 lib/articleMutations.ts의 ensureClubExists가 자동으로
// clubs에 등록해준다. 그래서 입력값 자체가 그대로 폼 상태(value)이고, 아래
// 드롭다운은 타이핑을 돕는 추천 목록일 뿐이다.
//
// 예전엔 <input list="...">(네이티브 datalist)를 썼는데, 추천 목록이 거의
// 안 늘어나 있던 데다(이미 등록된 기사의 팀 이름만 모았음) 브라우저마다
// datalist 동작이 들쭉날쭉해서 "선택이 안 된다"는 느낌을 줬다. 선수 검색과
// 같은 클릭형 드롭다운으로 바꿨다.
export default function TeamSearchInput({
  teams,
  value,
  onChange,
  placeholder,
}: TeamSearchInputProps) {
  const [open, setOpen] = useState(false);

  const trimmed = value.trim();
  const filtered = trimmed === "" ? teams : teams.filter((team) => team.includes(trimmed));

  // PlayerSearchSelect와 같은 이유로, 검색창 자체가 아니라 컨테이너 전체의
  // 포커스 이동을 보고 컴포넌트 밖으로 완전히 나갔을 때만 드롭다운을 닫는다.
  const handleContainerBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setOpen(false);
    }
  };

  return (
    <div className="relative" onBlur={handleContainerBlur}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={inputClass}
      />

      {open && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-zinc-300 bg-white text-sm shadow-lg">
          {filtered.map((team) => (
            <li key={team}>
              <button
                type="button"
                onClick={() => {
                  onChange(team);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left hover:bg-zinc-100"
              >
                {team}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
