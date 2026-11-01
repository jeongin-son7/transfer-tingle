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

/** 기사에 등장한 팀 이름이 clubs 테이블에 아직 없으면 로고 없는 기본값으로
 * 하나 만들어둔다 — 그래야 나중에 관리자가 /admin/settings에서 그 팀을 찾아
 * 로고를 채울 수 있다(없으면 아예 목록에 안 뜸). 이미 있는 팀이면
 * ON CONFLICT DO NOTHING이라 아무 일도 안 한다. clubs 쓰기는 "추가(insert)는
 * 로그인한 누구나, 수정/삭제는 관리자만" 정책이라 이 호출 자체는 누가 불러도
 * 되고, 실패해도(이미 있어서 등) 기사 저장에는 영향 없으니 결과를 신경 쓰지
 * 않는다. */
async function ensureClubExists(name: string, league: string) {
  const supabase = getSupabaseClient();
  await supabase.from("clubs").upsert(
    { name, short_code: name.slice(0, 3).toUpperCase(), league, logo_url: null },
    { onConflict: "name", ignoreDuplicates: true },
  );
}

export async function saveArticle(input: ArticleFormInput, journalist: JournalistRow, userId: string) {
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

  await Promise.all([
    ensureClubExists(input.fromTeam, league),
    ensureClubExists(input.toTeam, getTeamLeague(input.toTeam)),
  ]);

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
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return { article: data, score };
}

export interface ArticleEditInput {
  url: string;
  certainty: Certainty;
  summary: string;
  publishedAt: string;
}

/** 마이페이지에서 "내 기사" 수정. 선수/팀/기자는 바꾸지 않고(그러면 사실상
 * 새 기사라), 링크·확실성·요약·날짜만 고친다. 확실성이 바뀌면 점수도 다시
 * 계산해서 같이 저장한다 — league는 from_team 기준으로 그대로 다시 구한다. */
export async function updateArticle(
  articleId: string,
  input: ArticleEditInput,
  fromTeam: string,
  journalist: JournalistRow,
) {
  const supabase = getSupabaseClient();

  const league = getTeamLeague(fromTeam);
  const journalistForScore: Journalist = {
    id: journalist.id,
    name: journalist.name,
    outlet: journalist.outlet,
    leagueTiers: journalist.league_tiers ?? [],
    baseTier: journalist.base_tier,
  };
  const score = calculateArticleScore({ league, certainty: input.certainty }, journalistForScore);

  const { data, error } = await supabase
    .from("articles")
    .update({
      url: input.url,
      certainty: input.certainty,
      summary: input.summary,
      published_at: input.publishedAt,
      score,
    })
    .eq("id", articleId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return { article: data, score };
}

export async function deleteArticle(articleId: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("articles").delete().eq("id", articleId);

  if (error) {
    throw new Error(error.message);
  }
}
