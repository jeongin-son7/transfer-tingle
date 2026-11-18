"use client";

interface InterestStarButtonProps {
  isInterested: boolean;
  onToggle: () => void;
  className?: string;
}

// 로그인 없이 누구나 쓸 수 있는 "관심" 별 표시. RumorCard에서는 <Link> 바깥에
// 둬서(하트 버튼과 같은 이유) <a> 안에 <button>이 중첩되지 않게 한다.
// localStorage에만 저장되는 한계는 이 버튼의 title(=마우스 올리면 뜨는 설명)에
// 적어둔다.
export default function InterestStarButton({
  isInterested,
  onToggle,
  className = "",
}: InterestStarButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={
        isInterested
          ? "관심 해제 (이 브라우저에만 저장 — 기기를 바꾸면 사라져요)"
          : "관심 등록 (이 브라우저에만 저장 — 기기를 바꾸면 사라져요)"
      }
      aria-label={isInterested ? "관심 선수 해제" : "관심 선수 등록"}
      className={`${isInterested ? "text-amber-500" : "text-zinc-300 hover:text-amber-400"} ${className}`}
    >
      {isInterested ? "★" : "☆"}
    </button>
  );
}
