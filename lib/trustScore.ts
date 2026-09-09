// docs/PLAN.md 4번 "신뢰도 계산 로직" 1단계 구현.
// 지금은 개별 기사 점수 = 티어 점수 × 확실성 가중치, 종합 점수 = 단순 평균까지만
// 구현한 상태. TODO(5차시): calculateAggregateScore를 "최신 기사에 가중치를 더
// 주는 방식"으로 개선하기.

import type { Article, Certainty, Journalist } from "./types";

export const CERTAINTY_WEIGHT: Record<Certainty, number> = {
  확정: 1.0,
  진전: 0.7,
  관심: 0.4,
};

/** 기자의 (리그별 티어 → 없으면 기본 티어) 순으로 점수를 조회한다. */
export function getTierScore(journalist: Journalist, league: string): number {
  const matched = journalist.leagueTiers.find((tier) => tier.league === league);
  return matched ? matched.score : journalist.baseTier;
}

/** 개별 기사의 신뢰 점수 = 티어 점수 × 확실성 가중치 */
export function calculateArticleScore(article: Article, journalist: Journalist): number {
  const tierScore = getTierScore(journalist, article.league);
  return Math.round(tierScore * CERTAINTY_WEIGHT[article.certainty]);
}

/** 같은 이적설에 속한 기사들의 개별 점수를 하나의 종합 점수로 합친다 (1단계: 단순 평균). */
export function calculateAggregateScore(articleScores: number[]): number {
  if (articleScores.length === 0) return 0;
  const sum = articleScores.reduce((total, score) => total + score, 0);
  return Math.round(sum / articleScores.length);
}
