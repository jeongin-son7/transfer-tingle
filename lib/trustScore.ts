// docs/PLAN.md 4번 "신뢰도 계산 로직" 1단계 구현.
// 개별 기사 점수 = 티어 점수 × 확실성 가중치 (저장 시점, DB에 그대로 고정됨).
// 종합 점수 = 단순 평균.
//
// 여기에 "기자 신뢰도 보정"(2단계)을 추가한다: 결과가 확정된(성사/무산) 이적설의
// 기사들을 돌아보면서 "이 기자가 확정/진전이라고 한 게 실제로 맞았는가"를
// 적중률로 집계하고, 그 적중률을 초기 티어 쪽으로 당겨서(표본이 적을 때 한두 건
// 때문에 요동치지 않게) 보정 배율을 만든다. 이 배율은 저장된 articles.score를
// 덮어쓰지 않고, 화면에 보여줄 때(lib/supabaseData.ts)만 곱해서 쓴다 — DB에는
// "그 당시 알던 값"이 그대로 남는다.

import type { Article, Certainty, Journalist, RumorStatus } from "./types";

export const CERTAINTY_WEIGHT: Record<Certainty, number> = {
  확정: 1.0,
  진전: 0.7,
  관심: 0.4,
};

/** 확실성 문구 툴팁용 설명. 실제 이적 기사에서 흔히 쓰이는 표현(Here We Go,
 * 메디컬 진행 등)을 예로 들어 비전문가도 바로 이해할 수 있게 적었다. */
export const CERTAINTY_DESCRIPTION: Record<Certainty, string> = {
  확정: "구단 공식 발표 수준의 확정 보도 (예: \"Here We Go\", 계약 서명 완료)",
  진전: "메디컬 테스트, 구단 간 합의 등 구체적인 진전이 있다는 보도",
  관심: "아직 초기 단계의 관심 · 타진 수준 보도",
};

/** 신뢰 점수 툴팁용 설명. */
export const SCORE_EXPLANATION =
  "신뢰 점수 = 기자의 리그별 신뢰도 티어 × 확실성 가중치 × 기자의 과거 적중률 보정. 100점에 가까울수록 믿을 만한 기자 · 확실한 보도의 조합입니다.";

/** 기자의 (리그별 티어 → 없으면 기본 티어) 순으로 점수를 조회한다. */
export function getTierScore(journalist: Journalist, league: string): number {
  const matched = journalist.leagueTiers.find((tier) => tier.league === league);
  return matched ? matched.score : journalist.baseTier;
}

/** 개별 기사의 신뢰 점수 = 티어 점수 × 확실성 가중치 */
export function calculateArticleScore(
  article: Pick<Article, "league" | "certainty">,
  journalist: Journalist,
): number {
  const tierScore = getTierScore(journalist, article.league);
  return Math.round(tierScore * CERTAINTY_WEIGHT[article.certainty]);
}

/** 같은 이적설에 속한 기사들의 개별 점수를 하나의 종합 점수로 합친다 (1단계: 단순 평균). */
export function calculateAggregateScore(articleScores: number[]): number {
  if (articleScores.length === 0) return 0;
  const sum = articleScores.reduce((total, score) => total + score, 0);
  return Math.round(sum / articleScores.length);
}

// ── 기자 신뢰도 보정(2단계) ──────────────────────────────────────────────

/** 베이지안 평균(라플라스 스무딩)의 "가상 사전 표본 개수". 판정된 기사가
 * 이보다 훨씬 적으면 초기 티어 쪽에, 훨씬 많으면 실제 적중률 쪽에 가깐다. */
export const DEFAULT_CALIBRATION_K = 3;

export type ArticleJudgment = "적중" | "빗나감";

/**
 * 결과가 확정된 이적설의 기사 하나를 적중/빗나감으로 판정한다.
 * - "관심" 단계 기사는 아직 확정적 주장이 아니라서 판정 대상에서 뺀다(null).
 * - 이적설이 "진행중"이면 아직 판정할 수 없다(null).
 * - "무산"이면 그 기사가 말한 도착팀이 뭐였든 틀린 예측이 된다.
 * - "성사"면 그 기사의 도착팀이 실제 도착팀과 일치할 때만 적중.
 */
export function judgeArticle(
  article: Pick<Article, "certainty" | "toTeam">,
  rumor: { status: RumorStatus; actualTeam: string | null },
): ArticleJudgment | null {
  if (article.certainty === "관심") return null;
  if (rumor.status === "진행중") return null;
  if (rumor.status === "무산") return "빗나감";
  if (!rumor.actualTeam) return null;
  return article.toTeam === rumor.actualTeam ? "적중" : "빗나감";
}

/** 기자의 초기 티어(0~100)를 "처음부터 믿고 들어가는 적중 확률"로 환산한다.
 * 리그별로 티어가 다를 수 있지만, 적중률은 기자 한 명당 전체를 통틀어 하나의
 * 숫자로 다루는 게 더 안정적이다(표본이 원래도 적은데 리그별로 쪼개면 더
 * 적어진다) — 그래서 baseTier(전반적 평판) 하나만 기준으로 삼는다. */
export function getInitialAccuracyRatio(journalist: Journalist): number {
  return journalist.baseTier / 100;
}

/**
 * 적중률 보정. (적중 수 + k × 초기 비율) / (판정된 기사 수 + k).
 * - 판정된 기사가 0건이면 결과는 정확히 초기 비율과 같다(보정 없음).
 * - 판정 건수가 늘어날수록 실제 적중률이 더 크게 반영된다.
 */
export function calculateCalibratedAccuracy(
  hits: number,
  judgedCount: number,
  initialRatio: number,
  k: number = DEFAULT_CALIBRATION_K,
): number {
  return (hits + k * initialRatio) / (judgedCount + k);
}

/**
 * 보정 배율 = 보정된 적중률 ÷ 초기 비율.
 * - 초기 티어가 예상한 것보다 실제로 더 잘 맞혔으면 1보다 커짐(보상).
 * - 더 못 맞혔으면 1보다 작아짐(페널티).
 * - 판정된 기사가 없으면 정확히 1(변화 없음).
 */
export function calculateCalibrationMultiplier(
  calibratedRatio: number,
  initialRatio: number,
): number {
  if (initialRatio <= 0) return 1;
  return calibratedRatio / initialRatio;
}

export interface JournalistCalibration {
  hits: number;
  judgedCount: number;
  initialRatio: number;
  calibratedRatio: number;
  multiplier: number;
}

/** 위 세 함수를 합쳐서 기자 한 명의 보정 정보를 한 번에 계산한다. */
export function calibrateJournalist(
  journalist: Journalist,
  hits: number,
  judgedCount: number,
  k: number = DEFAULT_CALIBRATION_K,
): JournalistCalibration {
  const initialRatio = getInitialAccuracyRatio(journalist);
  const calibratedRatio = calculateCalibratedAccuracy(hits, judgedCount, initialRatio, k);
  const multiplier = calculateCalibrationMultiplier(calibratedRatio, initialRatio);
  return { hits, judgedCount, initialRatio, calibratedRatio, multiplier };
}

/** 보정 배율을 개별 기사의 원점수에 곱해서 화면에 보여줄 최종 점수를 만든다.
 * 0~100으로 clamp — 배율이 1보다 많이 커지면(예: 초기 티어가 낮았는데 전부
 * 적중) 원점수를 넘어서는 것도 막는다(애초에 티어 자체가 100을 넘지 않으니
 * 상한도 100). */
export function applyCalibrationMultiplier(rawScore: number, multiplier: number): number {
  return Math.max(0, Math.min(100, Math.round(rawScore * multiplier)));
}
