import type { FilterKey } from "@/components/FilterTabs";
import type { Rumor } from "./types";

// 필터 버튼(최신순/팀별/기자별/선수별) 각각이 실제로 어떤 기준으로 정렬하는지 정의.
// - 팀별: 이적 전 소속팀(fromTeam) 기준 (선수마다 값이 달라 정렬 효과가 잘 보임)
// - 기자별: 이 이적설을 다룬 기사 중 개별 신뢰 점수가 가장 높은 기자 이름 기준
export function sortRumors(rumors: Rumor[], filter: FilterKey): Rumor[] {
  const sorted = [...rumors];

  switch (filter) {
    case "latest":
      return sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    case "team":
      return sorted.sort((a, b) => a.fromTeam.localeCompare(b.fromTeam, "ko"));
    case "journalist":
      return sorted.sort((a, b) =>
        a.topJournalistName.localeCompare(b.topJournalistName, "ko"),
      );
    case "player":
      return sorted.sort((a, b) => a.playerName.localeCompare(b.playerName, "ko"));
  }
}
