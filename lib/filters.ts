import type { Rumor } from "./types";

// "최신순"은 항상 켜져 있는 기본 정렬, "팀별/기자별/선수별"과 검색어는 실제로
// 목록을 걸러내는 필터로 동작한다 (가나다순 재배열이 아니라 조건에 안 맞는
// 카드는 화면에서 사라짐).
export interface RumorFilterState {
  team: string | null;
  journalistId: string | null;
  playerName: string | null;
  /** 검색창 입력값. 선수명·이적 전/후 팀 이름에 포함되면 매치. */
  query: string;
}

export const EMPTY_FILTER: RumorFilterState = {
  team: null,
  journalistId: null,
  playerName: null,
  query: "",
};

export function hasActiveFilter(filter: RumorFilterState): boolean {
  return (
    filter.team !== null ||
    filter.journalistId !== null ||
    filter.playerName !== null ||
    filter.query.trim() !== ""
  );
}

/** 팀/기자/선수/검색어 조건을 모두 AND로 결합해 걸러낸다. 선택 안 한 조건은 통과. */
export function filterRumors(rumors: Rumor[], filter: RumorFilterState): Rumor[] {
  const query = filter.query.trim();

  return rumors.filter((rumor) => {
    const matchesTeam =
      filter.team === null || rumor.fromTeam === filter.team || rumor.toTeam === filter.team;
    const matchesJournalist =
      filter.journalistId === null || rumor.journalistIds.includes(filter.journalistId);
    const matchesPlayer = filter.playerName === null || rumor.playerName === filter.playerName;
    const matchesQuery =
      query === "" ||
      rumor.playerName.includes(query) ||
      rumor.fromTeam.includes(query) ||
      rumor.toTeam.includes(query);

    return matchesTeam && matchesJournalist && matchesPlayer && matchesQuery;
  });
}

export function sortByLatest(rumors: Rumor[]): Rumor[] {
  return [...rumors].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
