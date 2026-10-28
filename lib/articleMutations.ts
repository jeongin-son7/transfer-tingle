// 관리자(로그인된 브라우저)가 articles에 직접 insert한다. RLS가 쓰기는
// authenticated role만 허용하므로(supabase/schema.sql), 로그인 안 한 상태로
// 호출하면 Supabase가 자체적으로 거부한다 — 이 함수 자체는 그 판단을 안 함,
// 그냥 호출만 함.
//
// 점수는 lib/trustScore.ts 공식 그대로 여기(클라이언트)에서 계산해서 같이
// 저장한다. 예전(공개 등록 폼이던 시절, 서버 API 라우트로 저장하던 때)엔 "폼
// 입력만으로 점수를 조작 못 하게" 서버에서 재계산했는데, 이제는 로그인한
// 관리자만 쓸 수 있는 화면이라 그 방어가 필요 없어졌다.

import { getSupabaseClient } from "./supabase";
import { getTeamLeague } from "./teams";
import { calculateArticleScore } from "./trustScore";
import type { Certainty, Journalist } from "./types";

export interface ArticleFormInput {
  url: string;
  journalistId: string;
  playerName: string;
  fromTeam: string;
  toTeam: string;
  certainty: Certainty;
  summary: string;
  publishedAt: string;
}

/** app/api/journalists/route.ts가 그대로 돌려주는 raw Supabase row 모양. */
export interface JournalistRow {
  id: string;
  name: string;
  outlet: string;
  league_tiers: { league: string; score: number }[] | null;
  base_tier: number;
}

export async function saveArticle(input: ArticleFormInput, journalist: JournalistRow) {
  const supabase = getSupabaseClient();

  const league = getTeamLeague(input.fromTeam);
  const journalistForScore: Journalist = {
    id: journalist.id,
    name: journalist.name,
    outlet: journalist.outlet,
    leagueTiers: journalist.league_tiers ?? [],
    baseTier: journalist.base_tier,
  };
  const score = calculateArticleScore(
    { league, certainty: input.certainty },
    journalistForScore,
  );

  const { data, error } = await supabase
    .from("articles")
    .insert({
      url: input.url,
      journalist_id: input.journalistId,
      player_name: input.playerName,
      from_team: input.fromTeam,
      to_team: input.toTeam,
      certainty: input.certainty,
      summary: input.summary,
      published_at: input.publishedAt,
      score,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return { article: data, score };
}
