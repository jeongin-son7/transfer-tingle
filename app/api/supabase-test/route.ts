// 6차시 연결 테스트용. supabase/schema.sql을 Supabase 대시보드에서 먼저 실행하고
// .env.local을 채운 뒤, `npm run dev` 상태에서 http://localhost:3000/api/supabase-test
// 로 접속(또는 curl)해서 확인한다.
//
// - { ok: true, ... } 가 나오면 연결 + 테이블 생성이 정상.
// - { ok: false, error: "..." } 가 나오면 메시지를 보고 원인을 찾는다.
//   자주 나오는 경우: 환경변수 비어 있음 / schema.sql을 아직 안 돌림(테이블 없음).

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
    .select("id, name, outlet, base_tier")
    .limit(5);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Supabase 연결 성공",
    journalistsCount: data.length,
    journalists: data,
  });
}
