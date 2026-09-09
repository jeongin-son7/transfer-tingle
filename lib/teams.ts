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
