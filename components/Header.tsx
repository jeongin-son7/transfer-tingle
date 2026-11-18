"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminSession } from "@/lib/auth";
import { getSupabaseClient } from "@/lib/supabase";
import DarkModeToggle from "./DarkModeToggle";

export default function Header() {
  const session = useAdminSession();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    // 좁은 화면(모바일)에서는 로그인 상태 전체 묶음이 한 줄에 다 안 들어가서
    // flex-wrap으로 두 줄까지 자연스럽게 내려가게 한다(가로 스크롤 생기지
    // 않도록). 이메일은 길면 더 좁은 화면을 깨뜨릴 수 있어 작은 화면에서는 숨김.
    <header className="flex flex-wrap items-center justify-between gap-y-2 border-b border-zinc-200 bg-white px-4 py-4 sm:px-6 dark:border-zinc-800 dark:bg-zinc-900">
      <Link href="/" className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
        이적팅글
      </Link>
      <div className="flex flex-wrap items-center gap-3 gap-y-2 text-sm text-zinc-400 sm:gap-4">
        <Link href="/journalists" className="hover:text-emerald-600">
          기자 랭킹
        </Link>
        <Link href="/admin" className="hover:text-emerald-600">
          기사 등록
        </Link>
        {session && (
          <Link href="/mypage" className="hover:text-emerald-600">
            마이페이지
          </Link>
        )}
        {session === undefined ? null : session === null ? (
          <>
            <Link href="/admin/login" className="hover:text-emerald-600">
              로그인
            </Link>
            <Link href="/signup" className="hover:text-emerald-600">
              회원가입
            </Link>
          </>
        ) : (
          <>
            <span className="hidden text-zinc-500 sm:inline">{session.user.email}</span>
            <button type="button" onClick={handleLogout} className="hover:text-emerald-600">
              로그아웃
            </button>
          </>
        )}
        <DarkModeToggle />
      </div>
    </header>
  );
}
