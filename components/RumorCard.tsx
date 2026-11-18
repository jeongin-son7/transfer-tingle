import Link from "next/link";
import type { Rumor, RumorStatus } from "@/lib/types";
import type { LiveClub } from "@/lib/supabaseData";
import TeamBadge from "./TeamBadge";
import FavoriteButton from "./FavoriteButton";
import Tooltip from "./Tooltip";
import { formatRelativeDate } from "@/lib/relativeDate";
import { SCORE_EXPLANATION } from "@/lib/trustScore";

const STATUS_BADGE_STYLE: Record<RumorStatus, string> = {
  진행중: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  성사: "bg-emerald-600 text-white",
  무산: "bg-zinc-500 text-white",
};

export default function RumorCard({
  rumor,
  clubs,
  isFavorited,
  loggedIn,
  onToggleFavorite,
}: {
  rumor: Rumor;
  clubs: Map<string, LiveClub>;
  isFavorited: boolean;
  loggedIn: boolean;
  onToggleFavorite: () => void;
}) {
  return (
    <article className="relative overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* 하트 버튼은 <a> 안에 중첩된 인터랙티브 요소가 되지 않도록 Link 바깥에 둔다. */}
      <div className="absolute right-3 top-3 z-10 text-lg">
        <FavoriteButton isFavorited={isFavorited} loggedIn={loggedIn} onToggle={onToggleFavorite} />
      </div>

      <Link href={`/rumor/${rumor.id}`} className="block p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800">
        <div className="flex items-center justify-between gap-3 pr-8">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{rumor.playerName}</h3>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${STATUS_BADGE_STYLE[rumor.status]}`}
            >
              {rumor.status}
            </span>
            {rumor.isRecentlyAdded && (
              <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">
                NEW
              </span>
            )}
          </div>
          {/* 임시 종합 신뢰 점수 (lib/trustScore.ts 1단계: 단순 평균) */}
          <Tooltip content={SCORE_EXPLANATION}>
            <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              {rumor.score}점
            </span>
          </Tooltip>
        </div>

        <div className="mt-2 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          <TeamBadge team={rumor.fromTeam} club={clubs.get(rumor.fromTeam)} />
          <span>{rumor.fromTeam}</span>
          <span className="text-zinc-400">→</span>
          <TeamBadge team={rumor.toTeam} club={clubs.get(rumor.toTeam)} />
          <span>{rumor.toTeam}</span>
        </div>

        {/* 비전문가도 바로 감이 오도록 포지션 + 한 줄 특징. 확실히 아는 선수만
            players.position/trait가 채워져 있고, 없으면 그냥 안 보인다. */}
        {(rumor.position || rumor.trait) && (
          <p className="mt-1 text-xs text-zinc-400">
            {rumor.position && (
              <span className="font-medium text-zinc-500 dark:text-zinc-300">{rumor.position}</span>
            )}
            {rumor.position && rumor.trait && " · "}
            {rumor.trait}
          </p>
        )}

        <div className="mt-2 flex items-center gap-3 text-xs text-zinc-400">
          <span>
            기사 {rumor.articleIds.length}건 · 매체 {rumor.outletCount}곳
          </span>
          <span>♥ {rumor.favoriteCount}</span>
          <span>조회 {rumor.viewCount}</span>
        </div>
      </Link>

      {/* 계획서 "원문 링크" 요구사항: 날짜 + 기자명 + 링크 아이콘.
          Link 바깥에 둬서 <a> 안에 <a>가 중첩되는 걸 피했다. */}
      <div className="border-t border-zinc-100 px-4 py-2 dark:border-zinc-800">
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
