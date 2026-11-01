"use client";

import { useState } from "react";
import { getLogoUrl, getTeamMeta } from "@/lib/teams";
import type { LiveClub } from "@/lib/supabaseData";

interface TeamBadgeProps {
  team: string;
  /** clubs 테이블에서 찾은 값이 있으면 관리자 설정에서 수정한 로고/약자를 우선 사용. */
  club?: Pick<LiveClub, "shortCode" | "logoUrl"> | null;
}

// 로고 이미지가 있으면 그걸 먼저 시도하고, 로드에 실패하면(깨진 링크 등)
// 자동으로 색+이니셜 배지로 돌아간다. 이 세션에서는 이미지 URL이 실제로
// 열리는지 직접 확인을 못 해서(네트워크 제한), 이 폴백이 꼭 필요하다.
export default function TeamBadge({ team, club }: TeamBadgeProps) {
  const meta = getTeamMeta(team);
  const logoUrl = club?.logoUrl ?? getLogoUrl(meta);
  const shortCode = club?.shortCode ?? meta.shortCode;
  const [logoFailed, setLogoFailed] = useState(false);

  if (logoUrl && !logoFailed) {
    return (
      <img
        src={logoUrl}
        alt={team}
        title={team}
        className="h-6 w-6 shrink-0 rounded-full bg-white object-contain ring-1 ring-zinc-200 dark:ring-zinc-700"
        onError={() => setLogoFailed(true)}
      />
    );
  }

  return (
    <span
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
      style={{ backgroundColor: meta.color }}
      title={team}
    >
      {shortCode}
    </span>
  );
}
