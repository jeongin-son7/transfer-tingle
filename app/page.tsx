import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import FilterTabs from "@/components/FilterTabs";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50">
      <Header />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-6 py-8">
        <SearchBar />
        <FilterTabs />
        {/* TODO(3차시): 더미 이적설 카드 배열을 렌더링하는 목록으로 교체 */}
        <section className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-zinc-300 py-20 text-sm text-zinc-400">
          이적설 카드 목록 영역 (3차시에 더미 데이터로 채울 예정)
        </section>
      </main>
    </div>
  );
}
