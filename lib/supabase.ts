// 6차시: Supabase 클라이언트. docs/PLAN.md 3번 데이터 모델(journalists/articles/rumors)을
// 그대로 조회·저장하는 데 쓴다. .env.local에 NEXT_PUBLIC_SUPABASE_URL /
// NEXT_PUBLIC_SUPABASE_ANON_KEY를 채워 넣어야 동작한다 (supabase/schema.sql을
// Supabase 대시보드 SQL Editor에서 먼저 실행해 테이블을 만들어 둔 상태여야 함).
//
// 환경변수 체크는 getSupabaseClient()를 실제로 호출하는 시점에만 한다(모듈을
// import만 해도 실행되는 최상위 코드로 두면, 아직 .env.local을 안 채운 상태에서
// `next build`가 이 파일을 그냥 import하기만 해도 빌드 전체가 깨진다).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase 환경변수가 비어 있습니다. .env.local에 NEXT_PUBLIC_SUPABASE_URL / " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY 값을 채워 넣었는지 확인하세요.",
    );
  }

  client = createClient(supabaseUrl, supabaseAnonKey);
  return client;
}
