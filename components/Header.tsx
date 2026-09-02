export default function Header() {
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
      <span className="text-lg font-bold text-zinc-900">이적팅글</span>
      {/* TODO: 로그인 기능 추가 시 실제 마이페이지로 연결 */}
      <span className="text-sm text-zinc-400">마이페이지</span>
    </header>
  );
}
