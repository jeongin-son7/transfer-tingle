"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { loginAdmin } from "@/app/admin/actions";

export default function AdminPasswordForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(loginAdmin, undefined);
  const succeededRef = useRef(false);

  // 로그인 성공(에러 없이 끝남)하면 쿠키가 이미 서버에 설정된 상태이므로,
  // 같은 페이지를 다시 렌더링해서 isAdminAuthenticated()가 true로 바뀐
  // 서버 컴포넌트 결과를 받아온다.
  useEffect(() => {
    if (state && !state.error && !succeededRef.current) {
      succeededRef.current = true;
      router.refresh();
    }
  }, [state, router]);

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 px-6 dark:bg-zinc-950">
      <form
        action={formAction}
        className="flex w-full max-w-sm flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">관리자 비밀번호</h1>
        <p className="text-xs text-zinc-400">
          클럽 설정 · 기사 승인/반려 같은 관리자 전용 기능은 별도 비밀번호로
          보호됩니다. 기사 등록은 이 비밀번호 없이도 로그인만 하면 가능합니다.
        </p>
        <input
          type="password"
          name="password"
          required
          autoFocus
          placeholder="비밀번호"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
        />
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="mt-1 rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {pending ? "확인 중..." : "들어가기"}
        </button>
      </form>
    </div>
  );
}
