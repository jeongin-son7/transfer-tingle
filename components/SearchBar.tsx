"use client";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

// 부모(page.tsx)의 필터 상태를 그대로 보여주는 컨트롤드 인풋이라, 입력하는
// 즉시(실시간) 목록이 걸러진다. 버튼은 Enter 없이도 클릭으로 확정하고 싶을 때를
// 위해 남겨뒀다.
export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="flex w-full gap-2">
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="선수명 또는 팀명을 검색하세요"
        className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-600"
      />
      <button
        type="button"
        onClick={() => onChange(value)}
        className="shrink-0 rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700"
      >
        검색
      </button>
    </div>
  );
}
