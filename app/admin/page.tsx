"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { KNOWN_PLAYERS } from "@/lib/dummyData";
import type { Certainty } from "@/lib/types";

interface JournalistOption {
  id: string;
  name: string;
  outlet: string;
}

const CERTAINTY_OPTIONS: Certainty[] = ["확정", "진전", "관심"];

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

const inputClass =
  "rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-600";

export default function AdminPage() {
  const [journalists, setJournalists] = useState<JournalistOption[]>([]);
  // 선수명 자동완성 후보. 완전한 드롭다운이 아니라 "추천"이라, 여기 없는 새
  // 선수도 그냥 타이핑해서 등록할 수 있다 (players 테이블이 따로 없어서).
  // docs/PLAN.md 공식 선수 목록(메인 화면 필터와 동일)으로 시작해서, DB에 이미
  // 저장된 선수 이름을 합친다 — 두 목록이 따로 노는 걸 막기 위함.
  const [playerSuggestions, setPlayerSuggestions] = useState<string[]>(KNOWN_PLAYERS);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );

  const [form, setForm] = useState({
    url: "",
    journalistId: "",
    playerName: "",
    fromTeam: "",
    toTeam: "",
    certainty: "관심" as Certainty,
    summary: "",
    publishedAt: todayString(),
  });

  useEffect(() => {
    fetch("/api/journalists")
      .then((res) => res.json())
      .then((data) => {
        if (!data.ok) {
          setLoadError(data.error);
          return;
        }
        setJournalists(data.journalists);
        if (data.journalists.length > 0) {
          setForm((prev) => ({ ...prev, journalistId: data.journalists[0].id }));
        }
      })
      .catch((err) => setLoadError(String(err)));

    fetch("/api/players")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setPlayerSuggestions((prev) => [...new Set([...prev, ...data.players])].sort());
        }
      })
      .catch(() => {
        // 자동완성 후보는 필수 기능이 아니라서, 못 가져와도 조용히 넘어간다
        // (직접 타이핑하는 데는 지장 없음).
      });
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!data.ok) {
        setResult({ type: "error", message: data.error });
        return;
      }

      setResult({
        type: "success",
        message: `저장 완료! 계산된 개별 신뢰 점수: ${data.score}점`,
      });
      setPlayerSuggestions((prev) =>
        prev.includes(form.playerName) ? prev : [...prev, form.playerName].sort(),
      );
      setForm((prev) => ({ ...prev, url: "", playerName: "", fromTeam: "", toTeam: "", summary: "" }));
    } catch (err) {
      setResult({ type: "error", message: String(err) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <Link href="/" className="text-sm text-zinc-500 hover:text-emerald-600">
          ← 메인으로
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-6 py-8">
        <h1 className="text-xl font-bold text-zinc-900">관리자 기사 등록</h1>

        {loadError && (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            기자 목록을 불러오지 못했습니다: {loadError}
            <br />
            Supabase 환경변수 / supabase/seed.sql 실행 여부를 확인하세요.
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            기사 링크
            <input
              required
              type="url"
              value={form.url}
              onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
              className={inputClass}
              placeholder="https://..."
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            기자
            <select
              required
              value={form.journalistId}
              onChange={(e) => setForm((p) => ({ ...p, journalistId: e.target.value }))}
              className={inputClass}
            >
              <option value="" disabled>
                선택하세요
              </option>
              {journalists.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.name} ({j.outlet})
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            관련 선수명
            <input
              required
              list="player-suggestions"
              value={form.playerName}
              onChange={(e) => setForm((p) => ({ ...p, playerName: e.target.value }))}
              className={inputClass}
              placeholder="기존 선수명은 자동완성, 새 선수는 직접 입력"
            />
            <datalist id="player-suggestions">
              {playerSuggestions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm text-zinc-600">
              이적 전 팀
              <input
                required
                value={form.fromTeam}
                onChange={(e) => setForm((p) => ({ ...p, fromTeam: e.target.value }))}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-zinc-600">
              이적 후 팀
              <input
                required
                value={form.toTeam}
                onChange={(e) => setForm((p) => ({ ...p, toTeam: e.target.value }))}
                className={inputClass}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            확실성
            <select
              value={form.certainty}
              onChange={(e) => setForm((p) => ({ ...p, certainty: e.target.value as Certainty }))}
              className={inputClass}
            >
              {CERTAINTY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            등록 날짜
            <input
              required
              type="date"
              value={form.publishedAt}
              onChange={(e) => setForm((p) => ({ ...p, publishedAt: e.target.value }))}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            요약 코멘트
            <textarea
              value={form.summary}
              onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
              className={inputClass}
              rows={2}
            />
          </label>

          <button
            type="submit"
            disabled={submitting || journalists.length === 0}
            className="mt-2 rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            {submitting ? "저장 중..." : "기사 저장"}
          </button>
        </form>

        {result && (
          <p
            className={`rounded-lg border p-3 text-sm ${
              result.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {result.message}
          </p>
        )}
      </main>
    </div>
  );
}
