"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabase";

/**
 * 로그인 상태를 구독하는 훅.
 * - undefined: 아직 확인 중
 * - null: 로그인 안 함
 * - Session: 로그인함
 */
export function useAdminSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    const supabase = getSupabaseClient();

    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return session;
}

/**
 * 로그인한 사용자가 관리자(profiles.is_admin)인지 조회하는 훅.
 * - undefined: 아직 확인 중(세션 자체가 아직 undefined거나, profiles 조회 중)
 * - false: 로그인 안 했거나, 로그인은 했지만 관리자가 아님
 * - true: 관리자
 */
export function useIsAdmin(session: Session | null | undefined) {
  // profiles 조회 결과만 들고 있는다 — "로그인 확인 중"/"로그인 안 함"은
  // session 값 자체로 바로 계산하면 되니, effect 안에서 동기적으로
  // setState할 필요가 없다.
  const [adminFlag, setAdminFlag] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (!session) return;

    let cancelled = false;
    const supabase = getSupabaseClient();

    supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => {
        if (!cancelled) setAdminFlag(data?.is_admin ?? false);
      });

    return () => {
      cancelled = true;
    };
  }, [session]);

  if (session === undefined) return undefined;
  if (session === null) return false;
  return adminFlag;
}
