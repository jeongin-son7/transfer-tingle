"use client";

import Link from "next/link";

interface FavoriteButtonProps {
  isFavorited: boolean;
  loggedIn: boolean;
  onToggle: () => void;
  className?: string;
}

// RumorCard/상세 페이지 둘 다에서 쓰는 하트 버튼. 카드 안에서 쓸 때는 <Link>를
// 감싸는 카드 바깥(또는 별도 영역)에 둬서 <a> 안에 <button>이 중첩되지 않게 한다.
export default function FavoriteButton({
  isFavorited,
  loggedIn,
  onToggle,
  className = "",
}: FavoriteButtonProps) {
  if (!loggedIn) {
    return (
      <Link
        href="/admin/login"
        title="로그인하면 즐겨찾기할 수 있어요"
        className={`text-zinc-300 hover:text-zinc-400 ${className}`}
      >
        ♡
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      title={isFavorited ? "즐겨찾기 해제" : "즐겨찾기 추가"}
      aria-label={isFavorited ? "즐겨찾기 해제" : "즐겨찾기 추가"}
      className={`${isFavorited ? "text-red-500" : "text-zinc-300 hover:text-red-400"} ${className}`}
    >
      {isFavorited ? "♥" : "♡"}
    </button>
  );
}
