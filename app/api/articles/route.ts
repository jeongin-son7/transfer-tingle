// 7차시: 관리자 등록 폼이 보낸 기사 데이터를 articles 테이블에 저장.
// docs/PLAN.md 4번 "처리" 로직대로, 저장 시점에 개별 신뢰 점수를 계산해서
// score 컬럼에 같이 넣는다 (티어 점수 × 확실성 가중치). 점수 계산은 클라이언트가
// 아니라 서버(이 라우트)에서 하므로, 폼 입력값만으로 점수를 조작할 수 없다.

import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { getTeamLeague } from "@/lib/teams";
import { calculateArticleScore } from "@/lib/trustScore";
import type { Certainty, Journalist } from "@/lib/types";

interface ArticlePayload {
  url: string;
  journalistId: string;
  playerName: string;
  fromTeam: string;
  toTeam: string;
  certainty: Certainty;
  summary: string;
  publishedAt: string;
}

const REQUIRED_FIELDS: (keyof ArticlePayload)[] = [
  "url",
  "journalistId",
  "playerName",
  "fromTeam",
  "toTeam",
  "certainty",
  "publishedAt",
];

export async function POST(request: Request) {
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }

  const body = (await request.json()) as Partial<ArticlePayload>;

  const missing = REQUIRED_FIELDS.filter((field) => !body[field]);
  if (missing.length > 0) {
    return NextResponse.json(
      { ok: false, error: `필수 항목이 비어 있습니다: ${missing.join(", ")}` },
      { status: 400 },
    );
  }

  // 점수 계산에 필요한 기자 정보 조회 (클라이언트가 보낸 값이 아니라 DB에서 다시 조회)
  const { data: journalistRow, error: journalistError } = await supabase
    .from("journalists")
    .select("id, name, outlet, league_tiers, base_tier")
    .eq("id", body.journalistId)
    .single();

  if (journalistError || !journalistRow) {
    return NextResponse.json(
      { ok: false, error: "선택한 기자를 찾을 수 없습니다. supabase/seed.sql을 실행했는지 확인하세요." },
      { status: 400 },
    );
  }

  const journalist: Journalist = {
    id: journalistRow.id,
    name: journalistRow.name,
    outlet: journalistRow.outlet,
    leagueTiers: journalistRow.league_tiers ?? [],
    baseTier: journalistRow.base_tier,
  };

  const league = getTeamLeague(body.fromTeam as string);
  const score = calculateArticleScore(
    { league, certainty: body.certainty as Certainty },
    journalist,
  );

  const { data, error } = await supabase
    .from("articles")
    .insert({
      url: body.url,
      journalist_id: body.journalistId,
      player_name: body.playerName,
      from_team: body.fromTeam,
      to_team: body.toTeam,
      certainty: body.certainty,
      summary: body.summary ?? "",
      published_at: body.publishedAt,
      score,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, article: data, score });
}
