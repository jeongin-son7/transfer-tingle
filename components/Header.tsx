import Link from "next/link";

export default function Header() {
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
      <Link href="/" className="text-lg font-bold text-zinc-900">
        이적팅글
      </Link>
      <div className="flex items-center gap-4 text-sm text-zinc-400">
        <Link href="/admin" className="hover:text-emerald-600">
          관리자
        </Link>
        {/* TODO: 로그인 기능 추가 시 실제 마이페이지로 연결 */}
        <span>마이페이지</span>
      </div>
    </header>
  );
}
