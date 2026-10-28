"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminGate from "@/components/AdminGate";
import { getSupabaseClient } from "@/lib/supabase";

interface ClubRow {
  id: string;
  name: string;
  short_code: string;
  league: string;
  logo_url: string | null;
}

function ClubRowEditor({
  club,
  onSaved,
}: {
  club: ClubRow;
  onSaved: (updated: ClubRow) => void;
}) {
  const [name, setName] = useState(club.name);
  const [shortCode, setShortCode] = useState(club.short_code);
  const [logoUrl, setLogoUrl] = useState(club.logo_url ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setStatus("saving");
    setError(null);

    const supabase = getSupabaseClient();
    const { data, error: updateError } = await supabase
      .from("clubs")
      .update({ name, short_code: shortCode, logo_url: logoUrl || null })
      .eq("id", club.id)
      .select()
      .single();

    if (updateError) {
      setStatus("error");
      setError(updateError.message);
      return;
    }

    setStatus("saved");
    onSaved(data as ClubRow);
    setTimeout(() => setStatus("idle"), 1500);
  };

  const rowInputClass = "w-full rounded border border-zinc-300 px-2 py-1 text-sm";

  return (
    <tr className="border-b border-zinc-100 align-top">
      <td className="px-2 py-2 text-xs text-zinc-400">{club.league}</td>
      <td className="px-2 py-2">
        <input value={name} onChange={(e) => setName(e.target.value)} className={rowInputClass} />
      </td>
      <td className="px-2 py-2">
        <input
          value={shortCode}
          onChange={(e) => setShortCode(e.target.value)}
          className={`${rowInputClass} w-16`}
        />
      </td>
      <td className="px-2 py-2">
        <input
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://..."
          className={rowInputClass}
        />
      </td>
      <td className="px-2 py-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={status === "saving"}
          className="shrink-0 rounded bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {status === "saving" ? "저장 중" : status === "saved" ? "저장됨" : "저장"}
        </button>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </td>
    </tr>
  );
}

function ClubSettings() {
  const [clubs, setClubs] = useState<ClubRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase
      .from("clubs")
      .select("id, name, short_code, league, logo_url")
      .order("league")
      .order("name")
      .then(({ data, error }) => {
        if (error) {
          setLoadError(error.message);
          return;
        }
        setClubs(data as ClubRow[]);
      });
  }, []);

  const filtered = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return clubs;
    return clubs.filter((club) => club.name.includes(trimmed));
  }, [clubs, query]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900">클럽 설정</h1>
        <Link href="/admin" className="text-sm text-zinc-500 hover:text-emerald-600">
          ← 기사 등록으로
        </Link>
      </div>

      <p className="mb-4 text-xs text-zinc-400">
        구단 이름·약자·로고 URL을 여기서 수정할 수 있습니다. 저장하면 메인
        화면의 팀 배지에 바로 반영됩니다. 로고가 안 뜨는 팀 있으면 여기서
        실제로 작동하는 이미지 URL로 바꿔주세요.
      </p>

      {loadError && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          클럽 목록을 불러오지 못했습니다: {loadError}
        </p>
      )}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="구단 이름 검색"
        className="mb-4 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
      />

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-xs text-zinc-400">
              <th className="px-2 py-2 font-medium">리그</th>
              <th className="px-2 py-2 font-medium">이름</th>
              <th className="px-2 py-2 font-medium">약자</th>
              <th className="px-2 py-2 font-medium">로고 URL</th>
              <th className="px-2 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((club) => (
              <ClubRowEditor
                key={club.id}
                club={club}
                onSaved={(updated) =>
                  setClubs((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
                }
              />
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-zinc-400">검색 결과가 없습니다.</p>
        )}
      </div>
    </main>
  );
}

export default function AdminSettingsPage() {
  return (
    <AdminGate>
      <div className="flex min-h-full flex-1 flex-col bg-zinc-50">
        <ClubSettings />
      </div>
    </AdminGate>
  );
}
