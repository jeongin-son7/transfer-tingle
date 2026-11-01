"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { KNOWN_TEAMS } from "@/lib/dummyData";
import PlayerSearchSelect, { type PlayerOption } from "@/components/PlayerSearchSelect";
import TeamSearchInput from "@/components/TeamSearchInput";
import AuthGate from "@/components/AuthGate";
import { useAdminSession, useIsAdmin } from "@/lib/auth";
import { getSupabaseClient } from "@/lib/supabase";
import { saveArticle, type JournalistRow } from "@/lib/articleMutations";
import type { Certainty } from "@/lib/types";

const CERTAINTY_OPTIONS: Certainty[] = ["확정", "진전", "관심"];

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

const inputClass =
  "rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-600";

function ArticleForm() {
  const session = useAdminSession();
  const isAdmin = useIsAdmin(session);
  const [journalists, setJournalists] = useState<JournalistRow[]>([]);
  // 선수는 players 마스터 테이블에서 검색해서 "선택"하는 방식 (자유 입력 불가).
  // 선택하면 그 선수의 현재 소속팀으로 "이적 전 팀"을 자동으로 채운다.
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerOption | null>(null);
  // 팀 자동완성: 더미 데이터의 팀 목록으로 시작해서 DB에 이미 저장된 팀 이름과
  // 합친다. "이적 전/후 팀" 두 입력창이 같이 쓴다.
  const [teamSuggestions, setTeamSuggestions] = useState<string[]>(KNOWN_TEAMS);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [playersError, setPlayersError] = useState<string | null>(null);
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
        if (!data.ok) {
          setPlayersError(data.error);
          return;
        }
        setPlayers(data.players);
      })
      .catch((err) => setPlayersError(String(err)));

    fetch("/api/teams")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setTeamSuggestions((prev) => [...new Set([...prev, ...data.teams])].sort());
        }
      })
      .catch(() => {});
  }, []);

  // 검색해도 없는 선수를 등록 폼에서 바로 새로 만든다. players 쓰기는
  // "로그인한 사용자 누구나" 정책(schema.sql)이라 관리자가 아니어도 된다.
  const handleCreatePlayer = async ({
    name,
    currentTeam,
  }: {
    name: string;
    currentTeam: string;
  }): Promise<PlayerOption> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("players")
      .insert({ name, current_team: currentTeam })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const created: PlayerOption = {
      id: data.id as string,
      name: data.name as string,
      currentTeam: data.current_team as string,
    };
    setPlayers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    return created;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedPlayer) {
      setResult({ type: "error", message: "선수를 목록에서 검색해 선택해주세요." });
      return;
    }

    if (!form.fromTeam.trim() || !form.toTeam.trim()) {
      setResult({ type: "error", message: "이적 전/후 팀을 모두 입력해주세요." });
      return;
    }

    const journalist = journalists.find((j) => j.id === form.journalistId);
    if (!journalist) {
      setResult({ type: "error", message: "기자를 선택해주세요." });
      return;
    }

    if (!session) {
      setResult({ type: "error", message: "로그인이 필요합니다." });
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const { score } = await saveArticle(form, journalist, session.user.id);

      setResult({
        type: "success",
        message: `저장 완료! 계산된 개별 신뢰 점수: ${score}점`,
      });
      setTeamSuggestions((prev) => [...new Set([...prev, form.fromTeam, form.toTeam])].sort());
      setSelectedPlayer(null);
      setForm((prev) => ({ ...prev, url: "", playerName: "", fromTeam: "", toTeam: "", summary: "" }));
    } catch (err) {
      setResult({ type: "error", message: String(err instanceof Error ? err.message : err) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">기사 등록</h1>
        {isAdmin && (
          <Link href="/admin/settings" className="text-sm text-zinc-500 hover:text-emerald-600">
            클럽 설정 →
          </Link>
        )}
      </div>

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
          관련 선수명 (검색해서 선택)
          <PlayerSearchSelect
            players={players}
            selected={selectedPlayer}
            teams={teamSuggestions}
            onSelect={(player) => {
              setSelectedPlayer(player);
              setForm((p) => ({ ...p, playerName: player.name, fromTeam: player.currentTeam }));
            }}
            onCreateNew={handleCreatePlayer}
          />
          {playersError && (
            <span className="text-xs text-red-600">
              선수 목록을 불러오지 못했습니다: {playersError}
            </span>
          )}
          {!playersError && players.length === 0 && (
            <span className="text-xs text-zinc-400">
              선수 목록이 비어 있습니다. supabase/seed.sql을 실행했는지 확인하세요.
            </span>
          )}
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            이적 전 팀
            <TeamSearchInput
              teams={teamSuggestions}
              value={form.fromTeam}
              onChange={(fromTeam) => setForm((p) => ({ ...p, fromTeam }))}
              placeholder="팀 이름 검색 또는 직접 입력"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            이적 후 팀
            <TeamSearchInput
              teams={teamSuggestions}
              value={form.toTeam}
              onChange={(toTeam) => setForm((p) => ({ ...p, toTeam }))}
              placeholder="팀 이름 검색 또는 직접 입력"
            />
          </label>
        </div>
        <p className="-mt-2 text-xs text-zinc-400">
          목록에 없는 팀이면 그냥 이름을 직접 입력하세요 — 저장할 때 자동으로 등록됩니다.
        </p>
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
          disabled={submitting || journalists.length === 0 || !selectedPlayer}
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
  );
}

export default function AdminPage() {
  return (
    <AuthGate>
      <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
        <ArticleForm />
      </div>
    </AuthGate>
  );
}
