// docs/PLAN.md 3번 "데이터 모델" 기준 타입 정의.
// 3~5차시는 이 타입 그대로 더미 배열을 쓰고, 6차시부터 Supabase 테이블과 맞춘다.

export type Certainty = "확정" | "진전" | "관심";

export interface Journalist {
  id: string;
  name: string;
  outlet: string;
  /** 리그별 신뢰도 티어 점수. 기사에 태그된 리그와 일치하는 항목을 우선 사용한다. */
  leagueTiers: { league: string; score: number }[];
  /** 담당 리그 기록이 없는 리그의 기사를 쓴 경우 대신 사용하는 기본 티어 점수. */
  baseTier: number;
}

export interface Article {
  id: string;
  url: string;
  journalistId: string;
  playerName: string;
  fromTeam: string;
  toTeam: string;
  /** 신뢰도 티어 조회에 쓰는 리그 태그. 이적 전 소속팀(fromTeam)의 리그를 기준으로 부여한다. */
  league: string;
  certainty: Certainty;
  summary: string;
  /** ISO 날짜 문자열 (YYYY-MM-DD) */
  publishedAt: string;
}

export interface Rumor {
  id: string;
  playerName: string;
  fromTeam: string;
  toTeam: string;
  articleIds: string[];
  /** 이 이적설을 다룬 기자 id 목록(중복 제거). "기자별" 필터에서 포함 여부를 검사할 때 사용. */
  journalistIds: string[];
  /** 임시 종합 신뢰 점수. lib/trustScore.ts의 1단계(단순 평균) 계산 결과. */
  score: number;
  /** 관련 기사 중 가장 최근 등록 날짜 (= latestArticle.publishedAt). */
  updatedAt: string;
  /** 카드 하단 출처 표기("n일 전 · 기자명 ↗")에 쓰는 가장 최근 기사 정보. */
  latestArticle: {
    journalistName: string;
    url: string;
    publishedAt: string;
  };
}
