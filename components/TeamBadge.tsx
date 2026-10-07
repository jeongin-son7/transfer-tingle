"use client";

import { useState } from "react";
import { getLogoUrl, getTeamMeta } from "@/lib/teams";

// 로고 이미지가 있으면 그걸 먼저 시도하고, 로드에 실패하면(깨진 링크 등)
// 자동으로 색+이니셜 배지로 돌아간다. 이 세션에서는 이미지 URL이 실제로
// 열리는지 직접 확인을 못 해서(네트워크 제한), 이 폴백이 꼭 필요하다.
export default function TeamBadge({ team }: { team: string }) {
  const meta = getTeamMeta(team);
  const logoUrl = getLogoUrl(meta);
  const [logoFailed, setLogoFailed] = useState(false);

  if (logoUrl && !logoFailed) {
    return (
      <img
        src={logoUrl}
        alt={team}
        title={team}
        className="h-6 w-6 shrink-0 rounded-full bg-white object-contain ring-1 ring-zinc-200"
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
      {meta.shortCode}
    </span>
  );
}
