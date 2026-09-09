"use client";

import { useMemo, useState } from "react";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import FilterTabs, { type FilterKey } from "@/components/FilterTabs";
import RumorCard from "@/components/RumorCard";
import { rumors } from "@/lib/dummyData";
import { sortRumors } from "@/lib/sortRumors";

export default function Home() {
  const [filter, setFilter] = useState<FilterKey>("latest");
  const sortedRumors = useMemo(() => sortRumors(rumors, filter), [filter]);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50">
      <Header />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-6 py-8">
        <SearchBar />
        <FilterTabs active={filter} onChange={setFilter} />
        <section className="flex flex-col gap-3">
          {sortedRumors.map((rumor) => (
            <RumorCard key={rumor.id} rumor={rumor} />
          ))}
        </section>
      </main>
    </div>
  );
}
