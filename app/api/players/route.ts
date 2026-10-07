// 관리자 등록 폼의 "관련 선수명" 자동완성(datalist)용 — articles에 이미 등록된
// player_name 목록을 중복 없이 반환. "players" 테이블이 따로 없기 때문에(계획서
// 데이터 모델엔 journalists/articles/rumors 3개뿐) articles에서 직접 뽑는다.
// 완전한 드롭다운이 아니라 "추천"일 뿐이라 목록에 없는 새 선수도 자유롭게
// 입력할 수 있다.

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
    .from("articles")
    .select("player_name")
    .order("player_name");

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const players = [...new Set((data ?? []).map((row) => row.player_name as string))];

  return NextResponse.json({ ok: true, players });
}
