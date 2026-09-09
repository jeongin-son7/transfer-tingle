import type { Rumor } from "@/lib/types";
import TeamBadge from "./TeamBadge";
import { formatRelativeDate } from "@/lib/relativeDate";

// TODO(4차시): 클릭 시 이 이적설의 기사 타임라인을 보여주는 상세 페이지로 이동.
export default function RumorCard({ rumor }: { rumor: Rumor }) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
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

      {/* 계획서 "원문 링크" 요구사항: 날짜 + 기자명 + 링크 아이콘 한 줄로 표시 */}
      <a
        href={rumor.latestArticle.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-emerald-600 hover:underline"
      >
        {formatRelativeDate(rumor.updatedAt)} · {rumor.latestArticle.journalistName} ↗
      </a>
    </article>
  );
}
