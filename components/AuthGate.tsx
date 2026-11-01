"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminSession } from "@/lib/auth";
import { getSupabaseClient } from "@/lib/supabase";

// 로그인한 사용자라면 누구나 들어올 수 있는 페이지(기사 등록)를 감싼다.
// 관리자 전용 권한 체크는 AdminGate가 따로 한다 — 여기는 "로그인했는가"만 본다.
export default function AuthGate({ children }: { children: ReactNode }) {
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
    router.replace("/");
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
