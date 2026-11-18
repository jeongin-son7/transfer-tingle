"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "transfer-tingle:interested-players";

/**
 * 로그인 없이 쓰는 "관심 선수" 기능. 하트(♥, 즐겨찾기)와는 완전히 별개의
 * 기능이다 — 하트는 Supabase Auth 로그인이 필요하고 모든 기기에서 동기화되는
 * 반면, 이 별(★) 표시는 로그인 없이 누구나 쓸 수 있지만 "이 브라우저의
 * localStorage에만" 저장된다. 즉 기기를 바꾸거나 브라우저 저장 데이터를
 * 지우면 그대로 사라진다 — 계정에 연동되지 않는 한계를 의도적으로 감수하고
 * "로그인 없이도 바로 쓸 수 있다"는 쪽을 택한 설계.
 */
function readStoredInterests(): Set<string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    // 프라이빗 브라우징 등으로 localStorage 접근이 막힌 경우 — 빈 상태로
    // 시작한다(사이트가 깨지면 안 됨).
    return new Set();
  }
}

export function useInterestedPlayers() {
  const [interests, setInterests] = useState<Set<string>>(new Set());
  // 서버 렌더 결과와 클라이언트 localStorage 값이 처음엔 다를 수 있어서
  // (hydration mismatch 방지) 마운트 후에만 실제 값을 읽어 채운다.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // lib/favorites.ts와 같은 이유로 Promise 콜백 안에서 setState한다
    // (react-hooks/set-state-in-effect — effect 본문에서 동기적으로 바로
    // 부르면 안 됨). 마운트 직후 한 번만 실행되면 되니 타이밍은 문제없다.
    Promise.resolve().then(() => {
      setInterests(readStoredInterests());
      setHydrated(true);
    });
  }, []);

  const toggleInterest = useCallback((playerName: string) => {
    setInterests((prev) => {
      const next = new Set(prev);
      if (next.has(playerName)) next.delete(playerName);
      else next.add(playerName);

      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // 저장 실패해도 이번 세션의 화면 상태(React state)는 그대로 유지한다.
      }

      return next;
    });
  }, []);

  return { interests, toggleInterest, hydrated };
}
