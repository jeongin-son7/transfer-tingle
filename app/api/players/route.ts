// 관리자 등록 폼의 "선수 검색·선택" 콤보박스용 — players 마스터 테이블 전체를
// 반환한다. (예전엔 articles에서 중복 제거해 "추천"만 했는데, 이젠 자유 입력이
// 아니라 이 목록에서 반드시 선택하는 방식으로 바뀌었다.)

import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function GET() {
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("players")
    .select("id, name, current_team")
    .order("name");

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const players = (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    currentTeam: row.current_team as string,
  }));

  return NextResponse.json({ ok: true, players });
}
