// docs/PLAN.md 7번 "다룰 팀" 5개(프리미어리그) 배지 스타일 정보.
// 실제 구단 로고 이미지 대신, 저작권 문제 없이 바로 쓸 수 있는 이니셜 배지로 대체.

export interface TeamMeta {
  name: string;
  shortCode: string;
  color: string;
}

export const CORE_TEAMS: TeamMeta[] = [
  { name: "토트넘 홋스퍼", shortCode: "TOT", color: "#132257" },
  { name: "맨체스터 시티", shortCode: "MCI", color: "#6CABDD" },
  { name: "맨체스터 유나이티드", shortCode: "MUN", color: "#DA291C" },
  { name: "리버풀", shortCode: "LIV", color: "#C8102E" },
  { name: "첼시", shortCode: "CHE", color: "#034694" },
];

const FALLBACK_COLOR = "#9CA3AF";

/** 5개 핵심 팀이면 지정된 배지를, 그 외(상대 구단 등)는 회색 이니셜 배지를 반환. */
export function getTeamMeta(name: string): TeamMeta {
  const found = CORE_TEAMS.find((team) => team.name === name);
  if (found) return found;
  return { name, shortCode: name.slice(0, 1), color: FALLBACK_COLOR };
}

// 기사 등록 시 "이적 전 소속팀(fromTeam)의 리그"를 신뢰도 티어 조회용 리그 태그로
// 쓴다 (docs/PLAN.md 4번 "리그 태그 규칙" 참고). lib/dummyData.ts의 더미 기사들에
// 등장한 팀 전부 + 우리 핵심 5팀을 포함.
const TEAM_LEAGUES: Record<string, string> = {
  "토트넘 홋스퍼": "프리미어리그",
  "맨체스터 시티": "프리미어리그",
  "맨체스터 유나이티드": "프리미어리그",
  리버풀: "프리미어리그",
  첼시: "프리미어리그",
  브라이튼: "프리미어리그",
  "파리 생제르맹": "리그 1",
  "AS 모나코": "리그 1",
  "레알 마드리드": "라리가",
  "FC 바르셀로나": "라리가",
  유벤투스: "세리에 A",
  "AC 밀란": "세리에 A",
  "바이에른 뮌헨": "분데스리가",
  "보루시아 도르트문트": "분데스리가",
  "알-힐랄": "사우디 프로리그",
};

/**
 * 팀 이름으로 소속 리그를 조회한다. 목록에 없는 팀이면 그 팀 이름을 그대로
 * 반환하는데, 그러면 getTierScore()에서 어떤 기자의 league_tiers와도 매치되지
 * 않아 자연스럽게 base_tier로 대체된다(의도된 동작, 별도 처리 불필요).
 */
export function getTeamLeague(team: string): string {
  return TEAM_LEAGUES[team] ?? team;
}
