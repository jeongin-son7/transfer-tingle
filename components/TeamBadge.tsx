import { getTeamMeta } from "@/lib/teams";

export default function TeamBadge({ team }: { team: string }) {
  const meta = getTeamMeta(team);
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
