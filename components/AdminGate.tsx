"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminSession, useIsAdmin } from "@/lib/auth";
import { getSupabaseClient } from "@/lib/supabase";

// 관리자 전용 페이지(클럽 설정)를 감싼다. 기사 등록은 로그인한 사용자 누구나
// 가능하도록 바뀌어서(AuthGate), 여기서는 로그인 여부뿐 아니라 profiles.is_admin도
// 확인한다. 진짜 보안은 RLS(supabase/schema.sql의 write_admin_only 정책)가
// 하고 있고, 이건 그냥 화면 UX다 — 관리자가 아닌 사람이 쓰기 시도를 해봤자
// DB가 거부하지만, 그 전에 보기 좋게 안내해주는 역할.
export default function AdminGate({ children }: { children: ReactNode }) {
  const session = useAdminSession();
  const isAdmin = useIsAdmin(session);
  const router = useRouter();

  useEffect(() => {
    if (session === null) {
      router.replace("/admin/login");
    }
  }, [session, router]);

  if (session === undefined || (session !== null && isAdmin === undefined)) {
    return <p className="p-6 text-sm text-zinc-400">로그인 확인 중...</p>;
  }

  if (session === null) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-2 bg-zinc-50 px-6 text-center dark:bg-zinc-950">
        <p className="text-sm text-zinc-600">관리자 전용 페이지입니다.</p>
        <Link href="/" className="text-sm text-emerald-600 hover:underline">
          메인으로 돌아가기
        </Link>
      </div>
    );
  }

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 bg-white px-6 py-2 text-xs text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
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
