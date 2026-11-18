import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase";
import { isAdminAuthenticated, logoutAdmin, fetchPendingArticles } from "@/app/admin/actions";
import AdminPasswordForm from "@/components/AdminPasswordForm";
import ClubSettings, { type ClubRow } from "@/components/ClubSettings";
import PendingArticlesReview from "@/components/PendingArticlesReview";

// 쿠키를 읽어서 인증 여부를 판단하므로 캐시되면 안 된다 — 매 요청마다 새로
// 확인한다.
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const authed = await isAdminAuthenticated();

  if (!authed) {
    return <AdminPasswordForm />;
  }

  const supabase = getSupabaseClient();

  const [clubsRes, journalistsRes, pendingRes] = await Promise.all([
    supabase.from("clubs").select("id, name, short_code, league, logo_url").order("league").order("name"),
    supabase.from("journalists").select("id, name, outlet"),
    fetchPendingArticles(),
  ]);

  const clubs = (clubsRes.data ?? []) as ClubRow[];
  const journalists = (journalistsRes.data ?? []) as { id: string; name: string; outlet: string }[];

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 bg-white px-6 py-2 text-xs text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
        <Link href="/admin" className="hover:text-emerald-600">
          ← 기사 등록으로
        </Link>
        <form action={logoutAdmin}>
          <button type="submit" className="text-emerald-600 hover:underline">
            관리자 로그아웃
          </button>
        </form>
      </div>

      {clubsRes.error && (
        <p className="mx-auto mt-4 w-full max-w-3xl rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          클럽 목록을 불러오지 못했습니다: {clubsRes.error.message}
        </p>
      )}

      {pendingRes.ok ? (
        <PendingArticlesReview initialPending={pendingRes.articles} journalists={journalists} />
      ) : (
        <p className="mx-auto mt-4 w-full max-w-3xl rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          승인 대기 기사를 불러오지 못했습니다: {pendingRes.error}
          <br />
          supabase/migration_article_approval.sql을 실행했는지 확인하세요.
        </p>
      )}

      <ClubSettings initialClubs={clubs} />
    </div>
  );
}
