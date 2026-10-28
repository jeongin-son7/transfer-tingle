"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminSession } from "@/lib/auth";
import { getSupabaseClient } from "@/lib/supabase";

// /admin 아래 페이지들을 감싸서 로그인 안 한 사람은 /admin/login으로 돌려보낸다.
// 진짜 보안은 RLS(supabase/schema.sql)가 하고 있고, 이건 그냥 화면 UX다 —
// 로그인 안 한 사람은 쓰기 시도를 해봤자 DB가 거부하지만, 그 전에 보기 좋게
// 로그인 화면으로 안내해주는 역할.
export default function AdminGate({ children }: { children: ReactNode }) {
  const session = useAdminSession();
  const router = useRouter();

  useEffect(() => {
    if (session === null) {
      router.replace("/admin/login");
    }
  }, [session, router]);

  if (session === undefined) {
    return <p className="p-6 text-sm text-zinc-400">로그인 확인 중...</p>;
  }

  if (session === null) {
    return null;
  }

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 bg-white px-6 py-2 text-xs text-zinc-400">
        <Link href="/" className="hover:text-emerald-600">
          ← 메인으로
        </Link>
        <div className="flex items-center gap-2">
          <span>{session.user.email} 로그인됨</span>
          <button type="button" onClick={handleLogout} className="text-emerald-600 hover:underline">
            로그아웃
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
