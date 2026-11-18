"use server";

// 관리자 전용(클럽 설정, 기사 승인/반려) 비밀번호 보호.
//
// 기사 등록(/admin, AuthGate)은 그대로 "로그인한 사용자 누구나" 정책(RLS)으로
// 동작하고, 여기서 건드리는 건 "진짜 관리자 기능"만이다. 이 관리자는 Supabase
// Auth로 로그인하지 않으므로 auth.uid()가 없고, 기존 RLS 정책(update_own_or_admin,
// update_admin_only 등)을 anon key로는 통과할 수 없다. 그래서 이 파일의 쓰기
// 함수들은:
//   1) httpOnly 쿠키로 "비밀번호를 맞혔다"는 세션을 서버에서 직접 확인하고,
//   2) 통과하면 SUPABASE_SERVICE_ROLE_KEY(RLS를 완전히 우회하는 키, 서버에만
//      존재)로 Supabase에 쓴다.
// 비밀번호와 service role key는 코드/깃에 절대 넣지 않고 Vercel 환경변수로만
// 등록한다(.env.example 참고).

import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";

const ADMIN_COOKIE_NAME = "admin_session";
const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 8; // 8시간

function getExpectedToken(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("서버에 ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.");
  }
  // 비밀번호 자체를 쿠키 값으로 그대로 내려보내지 않기 위해 해시만 저장한다.
  return createHash("sha256").update(`transfer-tingle-admin-session:${password}`).digest("hex");
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;

  const store = await cookies();
  const token = store.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return false;

  const expected = getExpectedToken();
  const tokenBuf = Buffer.from(token);
  const expectedBuf = Buffer.from(expected);
  // 길이가 다르면 timingSafeEqual 자체가 예외를 던지므로 먼저 걸러낸다.
  if (tokenBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(tokenBuf, expectedBuf);
}

export async function loginAdmin(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    return { error: "서버에 ADMIN_PASSWORD가 설정되어 있지 않습니다. Vercel 환경변수를 확인하세요." };
  }

  if (!password || password !== expected) {
    return { error: "비밀번호가 올바르지 않습니다." };
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, getExpectedToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  });

  return {};
}

export async function logoutAdmin(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE_NAME);
}

async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    throw new Error("관리자 인증이 필요합니다.");
  }
}

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다.",
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function updateClubAction(
  id: string,
  input: { name: string; shortCode: string; logoUrl: string },
): Promise<{ error?: string }> {
  try {
    await requireAdmin();
  } catch (err) {
    return { error: String(err instanceof Error ? err.message : err) };
  }

  const supabase = getServiceRoleClient();
  const { error } = await supabase
    .from("clubs")
    .update({ name: input.name, short_code: input.shortCode, logo_url: input.logoUrl || null })
    .eq("id", id);

  if (error) return { error: error.message };
  return {};
}

export interface PendingArticleRow {
  id: string;
  url: string;
  journalist_id: string;
  player_name: string;
  from_team: string;
  to_team: string;
  certainty: "확정" | "진전" | "관심";
  summary: string | null;
  published_at: string;
  created_at: string;
}

export async function fetchPendingArticles(): Promise<
  { ok: true; articles: PendingArticleRow[] } | { ok: false; error: string }
> {
  try {
    await requireAdmin();
  } catch (err) {
    return { ok: false, error: String(err instanceof Error ? err.message : err) };
  }

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("articles")
    .select(
      "id, url, journalist_id, player_name, from_team, to_team, certainty, summary, published_at, created_at",
    )
    .eq("approval_status", "대기")
    .order("created_at", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, articles: data as PendingArticleRow[] };
}

export async function approveArticleAction(id: string): Promise<{ error?: string }> {
  try {
    await requireAdmin();
  } catch (err) {
    return { error: String(err instanceof Error ? err.message : err) };
  }

  const supabase = getServiceRoleClient();
  const { error } = await supabase.from("articles").update({ approval_status: "승인" }).eq("id", id);
  if (error) return { error: error.message };
  return {};
}

export async function rejectArticleAction(id: string): Promise<{ error?: string }> {
  try {
    await requireAdmin();
  } catch (err) {
    return { error: String(err instanceof Error ? err.message : err) };
  }

  const supabase = getServiceRoleClient();
  const { error } = await supabase.from("articles").update({ approval_status: "반려" }).eq("id", id);
  if (error) return { error: error.message };
  return {};
}
