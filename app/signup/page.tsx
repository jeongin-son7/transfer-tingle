"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const supabase = getSupabaseClient();
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

    setSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // Supabase 프로젝트 설정(이메일 인증 여부)에 따라 가입과 동시에 로그인
    // 세션이 생기기도 하고, 이메일 인증을 기다려야 할 수도 있다.
    if (data.session) {
      router.replace("/admin");
      return;
    }

    setDone(true);
  };

  if (done) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 px-6">
        <div className="flex w-full max-w-sm flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-bold text-zinc-900">가입 완료</h1>
          <p className="text-sm text-zinc-600">
            이메일 인증이 켜져 있는 프로젝트라면, 받은 메일의 인증 링크를 눌러야
            로그인할 수 있어요. 인증 메일이 안 왔다면 바로 로그인을 시도해보세요.
          </p>
          <Link
            href="/admin/login"
            className="mt-2 inline-block rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            로그인하러 가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 px-6">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-lg font-bold text-zinc-900">회원가입</h1>
        <p className="text-xs text-zinc-400">
          가입하면 로그인해서 이적설 기사를 직접 등록할 수 있어요.
        </p>

        <label className="flex flex-col gap-1 text-sm text-zinc-600">
          이메일
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-zinc-600">
          비밀번호
          <input
            required
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
          />
          <span className="text-xs text-zinc-400">6자 이상</span>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {submitting ? "가입 중..." : "가입하기"}
        </button>

        <Link
          href="/admin/login"
          className="text-center text-xs text-zinc-400 hover:text-emerald-600"
        >
          이미 계정이 있으신가요? 로그인
        </Link>
      </form>
    </div>
  );
}
