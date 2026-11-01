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
    <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
      <Link href="/" className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
        이적팅글
      </Link>
      <div className="flex items-center gap-4 text-sm text-zinc-400">
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
            <span className="text-zinc-500">{session.user.email}</span>
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
