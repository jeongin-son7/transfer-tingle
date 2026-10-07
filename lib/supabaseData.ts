// 8차시: Supabase에서 journalists/articles를 읽어와, 더미 데이터 때와 똑같은
// 모양(Rumor[])으로 묶어준다. lib/dummyData.ts의 buildRumors()와 사실상 같은
// 로직인데, 소스만 더미 배열 대신 실제 DB 조회 결과로 바뀐 것 — 그래서 화면
// 컴포넌트(RumorCard, 상세 페이지)는 데이터 출처가 바뀐 걸 신경 쓸 필요가 없다.
//
// rumors 테이블 자체는 쓰지 않는다(7차시에서 그렇게 결정함) — 대신 articles를
// player_name 기준으로 묶어서 그때그때 계산한다. 이적설의 id는 별도 PK 없이
// encodeURIComponent(playerName)을 쓴다 (상세 페이지 라우트 /rumor/[id]에서
// decodeURIComponent로 되돌려 player_name으로 조회).

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
  /** articles.score — 저장 시점에 서버(app/api/articles/route.ts)가 이미 계산해 둔 값. */
  score: number;
}

export interface LiveData {
  journalists: Journalist[];
  articles: LiveArticle[];
  rumors: Rumor[];
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
  };
}

function buildRumors(articles: LiveArticle[], journalists: Journalist[]): Rumor[] {
  const journalistById = new Map(journalists.map((j) => [j.id, j]));
  const playerOrder = [...new Set(articles.map((a) => a.playerName))];

  return playerOrder.map((playerName) => {
    const playerArticles = articles.filter((a) => a.playerName === playerName);
    const latestArticle = [...playerArticles].sort((a, b) =>
      b.publishedAt.localeCompare(a.publishedAt),
    )[0];

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
    };
  });
}

export async function fetchLiveData(): Promise<LiveData> {
  const supabase = getSupabaseClient();

  const [journalistsRes, articlesRes] = await Promise.all([
    supabase.from("journalists").select("id, name, outlet, league_tiers, base_tier"),
    supabase
      .from("articles")
      .select(
        "id, url, journalist_id, player_name, from_team, to_team, certainty, summary, published_at, score",
      ),
  ]);

  if (journalistsRes.error) throw new Error(journalistsRes.error.message);
  if (articlesRes.error) throw new Error(articlesRes.error.message);

  const journalists = (journalistsRes.data ?? []).map(toJournalist);
  const articles = (articlesRes.data ?? []).map(toArticle);
  const rumors = buildRumors(articles, journalists);

  return { journalists, articles, rumors };
}
