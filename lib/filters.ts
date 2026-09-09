import type { Rumor } from "./types";

// "최신순"은 항상 켜져 있는 기본 정렬, "팀별/기자별/선수별"은 실제로 목록을 걸러내는
// 필터로 동작한다 (가나다순 재배열이 아니라 조건에 안 맞는 카드는 화면에서 사라짐).
export interface RumorFilterState {
  team: string | null;
  journalistId: string | null;
  playerName: string | null;
}

export const EMPTY_FILTER: RumorFilterState = {
  team: null,
  journalistId: null,
  playerName: null,
};

export function hasActiveFilter(filter: RumorFilterState): boolean {
  return filter.team !== null || filter.journalistId !== null || filter.playerName !== null;
}

/** 세 조건(팀/기자/선수)을 AND로 결합해 걸러낸다. 선택 안 한 조건은 통과. */
export function filterRumors(rumors: Rumor[], filter: RumorFilterState): Rumor[] {
  return rumors.filter((rumor) => {
    const matchesTeam =
      filter.team === null || rumor.fromTeam === filter.team || rumor.toTeam === filter.team;
    const matchesJournalist =
      filter.journalistId === null || rumor.journalistIds.includes(filter.journalistId);
    const matchesPlayer = filter.playerName === null || rumor.playerName === filter.playerName;

    return matchesTeam && matchesJournalist && matchesPlayer;
  });
}

export function sortByLatest(rumors: Rumor[]): Rumor[] {
  return [...rumors].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
