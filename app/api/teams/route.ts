// 관리자 등록 폼의 "이적 전/후 팀" 자동완성(datalist)용. clubs 테이블(5대
// 리그 96개 구단 전체)과 articles에 이미 등록된 from_team/to_team 값을 합쳐서
// 반환한다 — clubs에 아직 없는데 예전에 자유 입력으로 저장된 팀 이름도
// 놓치지 않기 위해 articles 쪽도 같이 본다. 그래도 완전한 드롭다운은
// 아니라 추천 목록이다 (clubs에도 없는 새 팀은 여전히 자유 입력 가능하고,
// lib/articleMutations.ts의 ensureClubExists가 저장 시 자동으로 clubs에
// 등록해준다).

import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function GET() {
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }

  const [clubsRes, articlesRes] = await Promise.all([
    supabase.from("clubs").select("name"),
    supabase.from("articles").select("from_team, to_team"),
  ]);

  if (clubsRes.error) {
    return NextResponse.json({ ok: false, error: clubsRes.error.message }, { status: 500 });
  }
  if (articlesRes.error) {
    return NextResponse.json({ ok: false, error: articlesRes.error.message }, { status: 500 });
  }

  const teams = [
    ...new Set([
      ...(clubsRes.data ?? []).map((row) => row.name as string),
      ...(articlesRes.data ?? []).flatMap((row) => [
        row.from_team as string,
        row.to_team as string,
      ]),
    ]),
  ].sort();

  return NextResponse.json({ ok: true, teams });
}
