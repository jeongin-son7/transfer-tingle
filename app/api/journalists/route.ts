// 7차시: 관리자 등록 폼의 "기자" select 옵션을 채우는 용도.
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
    .from("journalists")
    .select("id, name, outlet, league_tiers, base_tier")
    .order("name");

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, journalists: data });
}
