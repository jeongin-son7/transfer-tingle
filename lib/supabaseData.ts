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
import { calculateAggregateScore } from "./trustScore";
import type { Certainty, Journalist, Rumor } from "./types";

export interface LiveArticle {
  id: string;
  url: string;
  journalistId: string;
  playerName: string;
  fromTeam: string;
  toTeam: string;
  certainty: Certainty;
  summary: string;
  publishedAt: string;
  /** articles.score — 저장 시점에 lib/articleMutations.ts가 이미 계산해 둔 값. */
  score: number;
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
}): LiveArticle {
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

function buildRumors(
  articles: LiveArticle[],
  journalists: Journalist[],
  favoriteCounts: Map<string, number>,
  viewCounts: Map<string, number>,
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
      score: calculateAggregateScore(playerArticles.map((a) => a.score)),
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
    };
  });
}

// React.cache로 감싸서 같은 요청(request) 안에서는 한 번만 실제로 조회한다
// — generateMetadata()와 페이지 컴포넌트가 둘 다 fetchLiveData()를 부르면
// 중복 조회가 생기는데, 이걸 막아준다.
export const fetchLiveData = cache(async (): Promise<LiveData> => {
  const supabase = getSupabaseClient();

  const [journalistsRes, articlesRes, clubsRes, favoritesRes, viewsRes] = await Promise.all([
    supabase.from("journalists").select("id, name, outlet, league_tiers, base_tier"),
    supabase
      .from("articles")
      .select(
        "id, url, journalist_id, player_name, from_team, to_team, certainty, summary, published_at, score, created_by, created_at",
      ),
    supabase.from("clubs").select("id, name, short_code, league, logo_url"),
    supabase.from("favorites").select("player_name"),
    supabase.from("rumor_views").select("player_name, view_count"),
  ]);

  if (journalistsRes.error) throw new Error(journalistsRes.error.message);
  if (articlesRes.error) throw new Error(articlesRes.error.message);
  if (clubsRes.error) throw new Error(clubsRes.error.message);
  if (favoritesRes.error) throw new Error(favoritesRes.error.message);
  if (viewsRes.error) throw new Error(viewsRes.error.message);

  const journalists = (journalistsRes.data ?? []).map(toJournalist);
  const articles = (articlesRes.data ?? []).map(toArticle);
  const clubs = (clubsRes.data ?? []).map(toClub);

  const favoriteCounts = new Map<string, number>();
  for (const row of favoritesRes.data ?? []) {
    favoriteCounts.set(row.player_name, (favoriteCounts.get(row.player_name) ?? 0) + 1);
  }
  const viewCounts = new Map(
    (viewsRes.data ?? []).map((row) => [row.player_name, row.view_count as number]),
  );

  const rumors = buildRumors(articles, journalists, favoriteCounts, viewCounts);

  return { journalists, articles, rumors, clubs };
});
