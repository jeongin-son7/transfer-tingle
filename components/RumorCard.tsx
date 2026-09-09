import type { Rumor } from "@/lib/types";

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
      <p className="mt-1 text-sm text-zinc-600">
        {rumor.fromTeam} → {rumor.toTeam}
      </p>
      <p className="mt-2 text-xs text-zinc-400">최근 업데이트 {rumor.updatedAt}</p>
    </article>
  );
}
