// 관리자 등록 폼의 "이적 전/후 팀" 자동완성(datalist)용 — articles에 이미
// 등록된 from_team/to_team 값을 중복 없이 반환. app/api/players/route.ts와
// 같은 이유로 완전한 드롭다운이 아니라 추천 목록이다 (새 상대 구단도 자유 입력).

import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function GET() {
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }

  const { data, error } = await supabase.from("articles").select("from_team, to_team");

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const teams = [
    ...new Set((data ?? []).flatMap((row) => [row.from_team as string, row.to_team as string])),
  ].sort();

  return NextResponse.json({ ok: true, teams });
}
