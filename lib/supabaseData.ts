// 8차시: Supabase에서 journalists/articles를 읽어와, 더미 데이터 때와 똑같은
// 모양(Rumor[])으로 묶어준다. lib/dummyData.ts의 buildRumors()와 사실상 같은
// 로직인데, 소스만 더미 배열 대신 실제 DB 조회 결과로 바뀐 것 — 그래서 화면
// 컴포넌트(RumorCard, 상세 페이지)는 데이터 출처가 바뀐 걸 신경 쓸 필요가 없다.
//
// rumors 테이블 자체는 쓰지 않는다(7차시에서 그렇게 결정함) — 대신 articles를
// player_name 기준으로 묶어서 그때그때 계산한다. 이적설의 id는 별도 PK 없이
// encodeURIComponent(playerName)을 쓴다 (상세 페이지 라우트 /rumor/[id]에서
// decodeURIComponent로 되돌려 player_name으로 조회).

import { cache } from "react";
import { getSupabaseClient } from "./supabase";
import { getTeamLeague } from "./teams";
import {
  calculateAggregateScore,
  calibrateJournalist,
  judgeArticle,
  applyCalibrationMultiplier,
  type ArticleJudgment,
  type JournalistCalibration,
} from "./trustScore";
import type { Certainty, Journalist, Rumor, RumorStatus } from "./types";

export interface LiveArticle {
  id: string;
  url: string;
  journalistId: string;
  playerName: string;
  fromTeam: string;
  toTeam: string;
  /** 신뢰도 티어 조회에 쓰는 리그 태그(이적 전 팀 기준). DB엔 안 저장돼 있어서
   * 매번 fromTeam으로 다시 계산한다(lib/teams.ts getTeamLeague, 결정론적 함수). */
  league: string;
  certainty: Certainty;
  summary: string;
  publishedAt: string;
  /** articles.score — 저장 시점에 lib/articleMutations.ts가 이미 계산해 둔 "원점수"
   * (티어 × 확실성 가중치). DB 그대로의 값이라 수정하지 않는다. */
  score: number;
  /** 기자 신뢰도 보정 배율을 score에 곱한 "화면에 보여줄 최종 점수". 저장은
   * 안 하고 조회할 때마다 다시 계산한다 — 새 이적설이 결과가 날 때마다 과거
   * 기사들의 점수도 자동으로 다시 반영돼야 하기 때문. */
  calibratedScore: number;
  /** 이 기사가 결과 확정된 이적설에 대한 확정/진전 보도였는지, 맞았는지. 관심
   * 단계 기사나 아직 결과가 안 난 이적설의 기사는 null(판정 불가). */
  judgment: ArticleJudgment | null;
  /** 이 기사를 등록한 사용자(마이페이지 "내 기사"용). 가입 이전에 들어간
   * 기사는 null. */
  createdBy: string | null;
  /** DB에 실제로 등록된 시각(ISO). published_at(사용자가 입력하는 기사 날짜)과는 다름. */
  createdAt: string;
}

export interface LiveClub {
  id: string;
  name: string;
  shortCode: string;
  league: string;
  logoUrl: string | null;
}

export interface LiveData {
  journalists: Journalist[];
  articles: LiveArticle[];
  rumors: Rumor[];
  clubs: LiveClub[];
  /** 기자별 적중률 보정 결과. 랭킹 페이지(/journalists)와 기자 프로필 페이지
   * (/journalist/[id])에서 쓴다. */
  journalistStats: JournalistStat[];
}

/** 클럽 이름 → 클럽 정보. TeamBadge가 관리자 설정 화면에서 수정한 로고/약자를
 * 바로 반영하도록, 팀 이름 문자열로 조회하는 용도. */
export function buildClubMap(clubs: LiveClub[]): Map<string, LiveClub> {
  return new Map(clubs.map((club) => [club.name, club]));
}

function toJournalist(row: {
  id: string;
  name: string;
  outlet: string;
  league_tiers: { league: string; score: number }[] | null;
  base_tier: number;
}): Journalist {
  return {
    id: row.id,
    name: row.name,
    outlet: row.outlet,
    leagueTiers: row.league_tiers ?? [],
    baseTier: row.base_tier,
  };
}

/** DB row → LiveArticle의 "원본" 필드만 옮긴 중간 모양. league/calibratedScore/
 * judgment는 다른 기사·이적설 결과와 같이 봐야 계산되는 값이라 여기서는 못
 * 채우고, fetchLiveData에서 enrichArticles()가 나중에 채운다. */
type RawLiveArticle = Omit<LiveArticle, "league" | "calibratedScore" | "judgment">;

function toArticle(row: {
  id: string;
  url: string;
  journalist_id: string;
  player_name: string;
  from_team: string;
  to_team: string;
  certainty: Certainty;
  summary: string | null;
  published_at: string;
  score: number | null;
  created_by: string | null;
  created_at: string;
}): RawLiveArticle {
  return {
    id: row.id,
    url: row.url,
    journalistId: row.journalist_id,
    playerName: row.player_name,
    fromTeam: row.from_team,
    toTeam: row.to_team,
    certainty: row.certainty,
    summary: row.summary ?? "",
    publishedAt: row.published_at,
    score: row.score ?? 0,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function toClub(row: {
  id: string;
  name: string;
  short_code: string;
  league: string;
  logo_url: string | null;
}): LiveClub {
  return {
    id: row.id,
    name: row.name,
    shortCode: row.short_code,
    league: row.league,
    logoUrl: row.logo_url,
  };
}

const RECENT_MS = 24 * 60 * 60 * 1000;

interface RumorOutcome {
  status: RumorStatus;
  actualTeam: string | null;
  resolvedAt: string | null;
}

/** 기자 한 명의 신뢰도 보정 결과 + 화면에 보여줄 이름/매체. 랭킹 페이지와
 * 기자 프로필 페이지(/journalist/[id])가 같이 쓴다. */
export interface JournalistStat extends JournalistCalibration {
  journalistId: string;
  name: string;
  outlet: string;
}

/**
 * articles에 league/calibratedScore/judgment를 채워 넣고, 기자별 적중률 보정
 * 결과도 같이 계산한다. 보정은 "이 기자가 쓴 모든 결과-확정 기사"를 기준으로
 * 하므로, 특정 이적설 하나에 종속되지 않는 전역 계산이다.
 */
function enrichArticles(
  rawArticles: RawLiveArticle[],
  journalists: Journalist[],
  outcomes: Map<string, RumorOutcome>,
): { articles: LiveArticle[]; journalistStats: JournalistStat[] } {
  const judgments = rawArticles.map((article) => {
    const outcome = outcomes.get(article.playerName) ?? { status: "진행중" as RumorStatus, actualTeam: null };
    return judgeArticle(article, outcome);
  });

  const tally = new Map<string, { hits: number; judgedCount: number }>();
  rawArticles.forEach((article, index) => {
    const judgment = judgments[index];
    if (judgment === null) return;
    const entry = tally.get(article.journalistId) ?? { hits: 0, judgedCount: 0 };
    entry.judgedCount += 1;
    if (judgment === "적중") entry.hits += 1;
    tally.set(article.journalistId, entry);
  });

  const journalistStats: JournalistStat[] = journalists.map((journalist) => {
    const { hits, judgedCount } = tally.get(journalist.id) ?? { hits: 0, judgedCount: 0 };
    return {
      journalistId: journalist.id,
      name: journalist.name,
      outlet: journalist.outlet,
      ...calibrateJournalist(journalist, hits, judgedCount),
    };
  });
  const statById = new Map(journalistStats.map((stat) => [stat.journalistId, stat]));

  const articles: LiveArticle[] = rawArticles.map((article, index) => {
    const multiplier = statById.get(article.journalistId)?.multiplier ?? 1;
    return {
      ...article,
      league: getTeamLeague(article.fromTeam),
      calibratedScore: applyCalibrationMultiplier(article.score, multiplier),
      judgment: judgments[index],
    };
  });

  return { articles, journalistStats };
}

function buildRumors(
  articles: LiveArticle[],
  journalists: Journalist[],
  favoriteCounts: Map<string, number>,
  viewCounts: Map<string, number>,
  outcomes: Map<string, RumorOutcome>,
): Rumor[] {
  const journalistById = new Map(journalists.map((j) => [j.id, j]));
  const playerOrder = [...new Set(articles.map((a) => a.playerName))];
  // 요청(서버 데이터 조회) 시점에 한 번만 계산한다 — 컴포넌트 렌더링 중에
  // Date.now()를 직접 부르면 순수하지 않은 렌더가 되기 때문.
  const now = Date.now();

  return playerOrder.map((playerName) => {
    const playerArticles = articles.filter((a) => a.playerName === playerName);
    const latestArticle = [...playerArticles].sort((a, b) =>
      b.publishedAt.localeCompare(a.publishedAt),
    )[0];
    const latestCreatedAt = playerArticles.reduce(
      (latest, a) => (a.createdAt > latest ? a.createdAt : latest),
      playerArticles[0].createdAt,
    );

    return {
      id: encodeURIComponent(playerName),
      playerName,
      fromTeam: playerArticles[0].fromTeam,
      toTeam: latestArticle.toTeam,
      articleIds: playerArticles.map((a) => a.id),
      journalistIds: [...new Set(playerArticles.map((a) => a.journalistId))],
      // 기자 신뢰도 보정이 반영된 점수로 평균을 낸다 — 그래서 다른 이적설의
      // 결과가 새로 확정될 때마다 이 선수의 종합 점수도 같이 바뀔 수 있다.
      score: calculateAggregateScore(playerArticles.map((a) => a.calibratedScore)),
      updatedAt: latestArticle.publishedAt,
      latestArticle: {
        journalistName: journalistById.get(latestArticle.journalistId)?.name ?? "알 수 없음",
        url: latestArticle.url,
        publishedAt: latestArticle.publishedAt,
      },
      favoriteCount: favoriteCounts.get(playerName) ?? 0,
      viewCount: viewCounts.get(playerName) ?? 0,
      latestCreatedAt,
      isRecentlyAdded: now - new Date(latestCreatedAt).getTime() < RECENT_MS,
      status: outcomes.get(playerName)?.status ?? "진행중",
      actualTeam: outcomes.get(playerName)?.actualTeam ?? null,
      resolvedAt: outcomes.get(playerName)?.resolvedAt ?? null,
    };
  });
}

// React.cache로 감싸서 같은 요청(request) 안에서는 한 번만 실제로 조회한다
// — generateMetadata()와 페이지 컴포넌트가 둘 다 fetchLiveData()를 부르면
// 중복 조회가 생기는데, 이걸 막아준다.
export const fetchLiveData = cache(async (): Promise<LiveData> => {
  const supabase = getSupabaseClient();

  const [journalistsRes, articlesRes, clubsRes, favoritesRes, viewsRes, outcomesRes] =
    await Promise.all([
      supabase.from("journalists").select("id, name, outlet, league_tiers, base_tier"),
      supabase
        .from("articles")
        .select(
          "id, url, journalist_id, player_name, from_team, to_team, certainty, summary, published_at, score, created_by, created_at",
        ),
      supabase.from("clubs").select("id, name, short_code, league, logo_url"),
      supabase.from("favorites").select("player_name"),
      supabase.from("rumor_views").select("player_name, view_count"),
      // rumors의 결과 컬럼(status/actual_team/resolved_at)은 supabase/migration_
      // rumor_outcome.sql을 아직 실행하지 않았으면 존재하지 않을 수 있다 — 그
      // 경우 이 조회만 에러가 나는데, 결과 표시는 부가 기능이라 사이트 전체가
      // 안 뜨면 안 되므로 throw하지 않고 빈 결과로 넘어간다(전부 "진행중" 취급).
      supabase.from("rumors").select("player_name, status, actual_team, resolved_at"),
    ]);

  if (journalistsRes.error) throw new Error(journalistsRes.error.message);
  if (articlesRes.error) throw new Error(articlesRes.error.message);
  if (clubsRes.error) throw new Error(clubsRes.error.message);
  if (favoritesRes.error) throw new Error(favoritesRes.error.message);
  if (viewsRes.error) throw new Error(viewsRes.error.message);

  const journalists = (journalistsRes.data ?? []).map(toJournalist);
  const rawArticles = (articlesRes.data ?? []).map(toArticle);
  const clubs = (clubsRes.data ?? []).map(toClub);

  const favoriteCounts = new Map<string, number>();
  for (const row of favoritesRes.data ?? []) {
    favoriteCounts.set(row.player_name, (favoriteCounts.get(row.player_name) ?? 0) + 1);
  }
  const viewCounts = new Map(
    (viewsRes.data ?? []).map((row) => [row.player_name, row.view_count as number]),
  );

  const outcomes = new Map<string, RumorOutcome>(
    (outcomesRes.error ? [] : outcomesRes.data ?? []).map((row) => [
      row.player_name as string,
      {
        status: row.status as RumorStatus,
        actualTeam: row.actual_team as string | null,
        resolvedAt: row.resolved_at as string | null,
      },
    ]),
  );

  const { articles, journalistStats } = enrichArticles(rawArticles, journalists, outcomes);
  const rumors = buildRumors(articles, journalists, favoriteCounts, viewCounts, outcomes);

  return { journalists, articles, rumors, clubs, journalistStats };
});
