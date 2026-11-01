"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabase";

/**
 * 로그인한 사용자가 즐겨찾기한 선수 이름 전체 집합 + 토글 함수.
 * 메인 목록(여러 카드)에서 한 번만 불러와서 공유하는 용도.
 */
export function useFavoritePlayers(session: Session | null | undefined) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    // session===null(로그아웃)일 때 setState를 effect 본문에서 바로 부르지
    // 않으려고(react-hooks/set-state-in-effect) Promise 콜백 안으로 옮겼다 —
    // 어차피 비동기 조회와 같은 타이밍에 반영돼도 문제없다.
    Promise.resolve().then(() => {
      if (cancelled) return;

      if (!session) {
        setFavorites(new Set());
        return;
      }

      const supabase = getSupabaseClient();
      supabase
        .from("favorites")
        .select("player_name")
        .eq("user_id", session.user.id)
        .then(({ data }) => {
          if (!cancelled) {
            setFavorites(new Set((data ?? []).map((row) => row.player_name as string)));
          }
        });
    });

    return () => {
      cancelled = true;
    };
  }, [session]);

  const toggleFavorite = useCallback(
    async (playerName: string) => {
      if (!session) return;
      const supabase = getSupabaseClient();
      const isFavorited = favorites.has(playerName);

      // 낙관적 업데이트: 응답 기다리지 않고 바로 하트를 바꾼다.
      setFavorites((prev) => {
        const next = new Set(prev);
        if (isFavorited) next.delete(playerName);
        else next.add(playerName);
        return next;
      });

      if (isFavorited) {
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", session.user.id)
          .eq("player_name", playerName);
      } else {
        await supabase
          .from("favorites")
          .insert({ user_id: session.user.id, player_name: playerName });
      }
    },
    [favorites, session],
  );

  return { favorites, toggleFavorite };
}
