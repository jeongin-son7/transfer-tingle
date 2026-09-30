import Link from "next/link";
import type { Rumor } from "@/lib/types";
import TeamBadge from "./TeamBadge";
import { formatRelativeDate } from "@/lib/relativeDate";

export default function RumorCard({ rumor }: { rumor: Rumor }) {
  return (
    <article className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <Link href={`/rumor/${rumor.id}`} className="block p-4 hover:bg-zinc-50">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-zinc-900">{rumor.playerName}</h3>
          {/* 임시 종합 신뢰 점수 (lib/trustScore.ts 1단계: 단순 평균) */}
          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-bold text-emerald-700">
            {rumor.score}점
          </span>
        </div>

        <div className="mt-2 flex items-center gap-2 text-sm text-zinc-600">
          <TeamBadge team={rumor.fromTeam} />
          <span>{rumor.fromTeam}</span>
          <span className="text-zinc-400">→</span>
          <TeamBadge team={rumor.toTeam} />
          <span>{rumor.toTeam}</span>
        </div>
      </Link>

      {/* 계획서 "원문 링크" 요구사항: 날짜 + 기자명 + 링크 아이콘.
          Link 바깥에 둬서 <a> 안에 <a>가 중첩되는 걸 피했다. */}
      <div className="border-t border-zinc-100 px-4 py-2">
        <a
          href={rumor.latestArticle.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-emerald-600 hover:underline"
        >
          {formatRelativeDate(rumor.updatedAt)} · {rumor.latestArticle.journalistName} ↗
        </a>
      </div>
    </article>
  );
}
