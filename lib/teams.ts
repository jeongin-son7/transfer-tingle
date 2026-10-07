// docs/PLAN.md 7번 "다룰 팀" 5개(프리미어리그) 배지 스타일 정보 + 자주 등장하는
// 상대 구단들의 실제 로고(베스트 에포트). 색+이니셜 배지가 기본값이고, 로고
// 이미지가 있으면 그게 우선 — 단, 이 세션에서는 이미지 URL이 실제로 열리는지
// 직접 확인을 못 했어서(네트워크 제한), 로드 실패하면 TeamBadge 컴포넌트가
// 자동으로 이니셜 배지로 되돌아가도록 구현돼 있다 (components/TeamBadge.tsx).

export interface TeamMeta {
  name: string;
  shortCode: string;
  color: string;
  /** Wikipedia Special:FilePath용 파일명 (예: "Tottenham_Hotspur.svg"). 없으면 로고 시도 안 함. */
  logoFile?: string;
}

export const CORE_TEAMS: TeamMeta[] = [
  { name: "토트넘 홋스퍼", shortCode: "TOT", color: "#132257", logoFile: "Tottenham_Hotspur.svg" },
  {
    name: "맨체스터 시티",
    shortCode: "MCI",
    color: "#6CABDD",
    logoFile: "Manchester_City_FC_badge.svg",
  },
  {
    name: "맨체스터 유나이티드",
    shortCode: "MUN",
    color: "#DA291C",
    logoFile: "Manchester_United_FC_crest.svg",
  },
  { name: "리버풀", shortCode: "LIV", color: "#C8102E", logoFile: "Liverpool_FC.svg" },
  { name: "첼시", shortCode: "CHE", color: "#034694", logoFile: "Chelsea_FC.svg" },
];

// 더미/시드 데이터에 자주 등장하는 그 외 구단들. CORE_TEAMS와 같은 TeamMeta
// 모양이라 getTeamMeta()가 똑같이 처리한다.
const OTHER_TEAMS: TeamMeta[] = [
  {
    name: "브라이튼",
    shortCode: "BHA",
    color: "#0057B8",
    logoFile: "Brighton_%26_Hove_Albion_logo.svg",
  },
  {
    name: "파리 생제르맹",
    shortCode: "PSG",
    color: "#004170",
    logoFile: "Paris_Saint-Germain_F.C..svg",
  },
  { name: "레알 마드리드", shortCode: "RMA", color: "#FEBE10", logoFile: "Real_Madrid_CF.svg" },
  { name: "FC 바르셀로나", shortCode: "BAR", color: "#A50044", logoFile: "FC_Barcelona_(crest).svg" },
  { name: "유벤투스", shortCode: "JUV", color: "#000000", logoFile: "Juventus_FC_2017_icon.svg" },
  { name: "AC 밀란", shortCode: "MIL", color: "#FB090B", logoFile: "Logo_of_AC_Milan.svg" },
  {
    name: "바이에른 뮌헨",
    shortCode: "FCB",
    color: "#DC052D",
    logoFile: "FC_Bayern_München_logo_(2017).svg",
  },
  {
    name: "보루시아 도르트문트",
    shortCode: "BVB",
    color: "#FDE100",
    logoFile: "Borussia_Dortmund_logo.svg",
  },
  { name: "알-힐랄", shortCode: "HIL", color: "#1E4D2B", logoFile: "Al Hilal SFC Logo.svg" },
  { name: "아스널", shortCode: "ARS", color: "#EF0107", logoFile: "Arsenal_FC.svg" },
  {
    name: "웨스트햄 유나이티드",
    shortCode: "WHU",
    color: "#7A263A",
    logoFile: "West_Ham_United_FC_logo.svg",
  },
  { name: "애스턴 빌라", shortCode: "AVL", color: "#670E36" },
  {
    name: "아틀레티코 마드리드",
    shortCode: "ATM",
    color: "#CB3524",
    logoFile: "Atletico_Madrid_2017_logo.svg",
  },
  { name: "인터 밀란", shortCode: "INT", color: "#010E80", logoFile: "FC_Internazionale_Milano_2021.svg" },
  { name: "벤피카", shortCode: "SLB", color: "#E00000" },
];

const FALLBACK_COLOR = "#9CA3AF";

/** Wikipedia의 Special:FilePath 리다이렉트로 실제 이미지 주소를 얻는다. */
export function getLogoUrl(team: TeamMeta): string | null {
  if (!team.logoFile) return null;
  return `https://en.wikipedia.org/wiki/Special:FilePath/${encodeURIComponent(team.logoFile)}`;
}

/** 알려진 팀이면 배지/로고 정보를, 그 외(상대 구단 등)는 회색 이니셜 배지 정보를 반환. */
export function getTeamMeta(name: string): TeamMeta {
  const found = [...CORE_TEAMS, ...OTHER_TEAMS].find((team) => team.name === name);
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
  아스널: "프리미어리그",
  "애스턴 빌라": "프리미어리그",
  "웨스트햄 유나이티드": "프리미어리그",
  "파리 생제르맹": "리그 1",
  "AS 모나코": "리그 1",
  "레알 마드리드": "라리가",
  "FC 바르셀로나": "라리가",
  "아틀레티코 마드리드": "라리가",
  유벤투스: "세리에 A",
  "AC 밀란": "세리에 A",
  "인터 밀란": "세리에 A",
  "바이에른 뮌헨": "분데스리가",
  "보루시아 도르트문트": "분데스리가",
  "바이어 레버쿠젠": "분데스리가",
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
