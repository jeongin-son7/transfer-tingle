// docs/PLAN.md 7·8번(다룰 선수·팀 목록, 기자 후보 5명) 기준 더미 데이터.
// 3차시: 이 배열을 메인 화면 카드 목록에 렌더링하고, 필터 정렬에 사용한다.
// 6차시부터는 이 배열 대신 Supabase 쿼리 결과를 같은 타입으로 채워 넣으면 된다.

import type { Article, Journalist, Rumor } from "./types";
import { calculateAggregateScore, calculateArticleScore } from "./trustScore";

// docs/PLAN.md 8번 기자 후보 5명 + 임시 리그별/기본 티어 점수.
// 로마노·오른스타인은 프리미어리그 특화라 리그 태그가 일치해 높은 점수를 받고,
// 디 마르치오·플레텐베르크는 담당 리그가 달라 기본 티어(낮은 값)로 대체되고,
// 카슬스는 처음부터 낮은 티어로 잡아 "신뢰도 낮은 매체" 대조군 역할을 하게 했다.
export const journalists: Journalist[] = [
  {
    id: "romano",
    name: "파브리지오 로마노",
    outlet: "Here We Go (프리랜서)",
    leagueTiers: [{ league: "프리미어리그", score: 95 }],
    baseTier: 90,
  },
  {
    id: "ornstein",
    name: "데이비드 오른스타인",
    outlet: "The Athletic",
    leagueTiers: [{ league: "프리미어리그", score: 97 }],
    baseTier: 80,
  },
  {
    id: "dimarzio",
    name: "잔루카 디 마르치오",
    outlet: "Sky Sport Italia",
    leagueTiers: [{ league: "세리에 A", score: 93 }],
    baseTier: 55,
  },
  {
    id: "plettenberg",
    name: "플로리안 플레텐베르크",
    outlet: "Sky Sport DE",
    leagueTiers: [{ league: "분데스리가", score: 92 }],
    baseTier: 50,
  },
  {
    id: "castles",
    name: "던컨 카슬스",
    outlet: "프리랜서 (팟캐스트)",
    leagueTiers: [],
    baseTier: 30,
  },
];

// docs/PLAN.md 7번 선수 5명 기준, 선수당 2~3개씩 총 13개 기사.
// 다룰 팀이 전부 프리미어리그 소속이라 league는 전부 "프리미어리그"로 고정.
export const articles: Article[] = [
  // 1. 오마르 마르무시 — 맨시티 → 토트넘
  {
    id: "a1",
    url: "https://example.com/articles/marmoush-here-we-go",
    journalistId: "romano",
    playerName: "오마르 마르무시",
    fromTeam: "맨체스터 시티",
    toTeam: "토트넘 홋스퍼",
    league: "프리미어리그",
    certainty: "확정",
    summary: "메디컬 완료, 세부 계약서 사인까지 마무리. Here We Go.",
    publishedAt: "2026-08-30",
  },
  {
    id: "a2",
    url: "https://example.com/articles/marmoush-close",
    journalistId: "ornstein",
    playerName: "오마르 마르무시",
    fromTeam: "맨체스터 시티",
    toTeam: "토트넘 홋스퍼",
    league: "프리미어리그",
    certainty: "진전",
    summary: "양 클럽 합의 근접, 개인 합의 사항만 조율 중.",
    publishedAt: "2026-08-27",
  },
  {
    id: "a3",
    url: "https://example.com/articles/marmoush-interest-it",
    journalistId: "dimarzio",
    playerName: "오마르 마르무시",
    fromTeam: "맨체스터 시티",
    toTeam: "토트넘 홋스퍼",
    league: "프리미어리그",
    certainty: "관심",
    summary: "이탈리아 매체발 소식통, 토트넘의 관심을 포착했다고 보도.",
    publishedAt: "2026-08-20",
  },

  // 2. 사비뉴 — 맨시티 → 토트넘
  {
    id: "a4",
    url: "https://example.com/articles/savinho-done-deal",
    journalistId: "ornstein",
    playerName: "사비뉴",
    fromTeam: "맨체스터 시티",
    toTeam: "토트넘 홋스퍼",
    league: "프리미어리그",
    certainty: "확정",
    summary: "메디컬까지 완료, 공식 발표만 남은 상태.",
    publishedAt: "2026-08-29",
  },
  {
    id: "a5",
    url: "https://example.com/articles/savinho-rumour",
    journalistId: "castles",
    playerName: "사비뉴",
    fromTeam: "맨체스터 시티",
    toTeam: "토트넘 홋스퍼",
    league: "프리미어리그",
    certainty: "관심",
    summary: "토트넘이 검토 중이라는 이야기가 있다는 수준의 보도.",
    publishedAt: "2026-08-22",
  },

  // 3. 미하일로 무드릭 — 첼시 → 토트넘 (임대)
  {
    id: "a6",
    url: "https://example.com/articles/mudryk-confirmed-loan",
    journalistId: "castles",
    playerName: "미하일로 무드릭",
    fromTeam: "첼시",
    toTeam: "토트넘 홋스퍼",
    league: "프리미어리그",
    certainty: "확정",
    summary: "임대 계약 완료, 조만간 발표될 예정이라고 주장.",
    publishedAt: "2026-08-25",
  },
  {
    id: "a7",
    url: "https://example.com/articles/mudryk-progressing",
    journalistId: "romano",
    playerName: "미하일로 무드릭",
    fromTeam: "첼시",
    toTeam: "토트넘 홋스퍼",
    league: "프리미어리그",
    certainty: "진전",
    summary: "임대 조건을 논의 중이며 아직 완전히 타결되지는 않음.",
    publishedAt: "2026-08-28",
  },
  {
    id: "a8",
    url: "https://example.com/articles/mudryk-interest-de",
    journalistId: "plettenberg",
    playerName: "미하일로 무드릭",
    fromTeam: "첼시",
    toTeam: "토트넘 홋스퍼",
    league: "프리미어리그",
    certainty: "관심",
    summary: "독일 매체를 통해 흘러나온 이야기로, 추가 확인이 필요.",
    publishedAt: "2026-08-19",
  },

  // 4. 루카 부슈코비치 — 브라이튼 → 토트넘
  {
    id: "a9",
    url: "https://example.com/articles/bucksic-agreed",
    journalistId: "romano",
    playerName: "루카 부슈코비치",
    fromTeam: "브라이튼",
    toTeam: "토트넘 홋스퍼",
    league: "프리미어리그",
    certainty: "확정",
    summary: "계약 조건 합의 완료, 공식 발표 예정.",
    publishedAt: "2026-08-31",
  },
  {
    id: "a10",
    url: "https://example.com/articles/bucksic-fee-talks",
    journalistId: "ornstein",
    playerName: "루카 부슈코비치",
    fromTeam: "브라이튼",
    toTeam: "토트넘 홋스퍼",
    league: "프리미어리그",
    certainty: "진전",
    summary: "브라이튼과 이적료 협상이 막바지 단계에 들어섬.",
    publishedAt: "2026-08-26",
  },

  // 5. 코디 가크포 — 리버풀, 토트넘/맨시티 경쟁 구도
  {
    id: "a11",
    url: "https://example.com/articles/gakpo-tottenham-interest",
    journalistId: "romano",
    playerName: "코디 가크포",
    fromTeam: "리버풀",
    toTeam: "토트넘 홋스퍼",
    league: "프리미어리그",
    certainty: "관심",
    summary: "토트넘이 관심을 보이고 있다는 초기 단계 보도.",
    publishedAt: "2026-08-21",
  },
  {
    id: "a12",
    url: "https://example.com/articles/gakpo-mancity-interest",
    journalistId: "dimarzio",
    playerName: "코디 가크포",
    fromTeam: "리버풀",
    toTeam: "맨체스터 시티",
    league: "프리미어리그",
    certainty: "관심",
    summary: "이탈리아발 보도, 맨체스터 시티도 가크포에 관심이 있다고 언급.",
    publishedAt: "2026-08-23",
  },
  {
    id: "a13",
    url: "https://example.com/articles/gakpo-tottenham-ahead",
    journalistId: "ornstein",
    playerName: "코디 가크포",
    fromTeam: "리버풀",
    toTeam: "토트넘 홋스퍼",
    league: "프리미어리그",
    certainty: "진전",
    summary: "토트넘이 맨시티보다 한발 앞서 협상 테이블에 나섰다고 보도.",
    publishedAt: "2026-09-01",
  },
];

function findJournalist(journalistId: string): Journalist {
  const journalist = journalists.find((j) => j.id === journalistId);
  if (!journalist) {
    throw new Error(`알 수 없는 기자 id: ${journalistId}`);
  }
  return journalist;
}

/** 기사 배열을 선수 기준으로 묶어 이적설(Rumor) 배열을 만든다. */
function buildRumors(): Rumor[] {
  const playerOrder = [...new Set(articles.map((article) => article.playerName))];

  return playerOrder.map((playerName, index) => {
    const playerArticles = articles.filter((article) => article.playerName === playerName);

    const scored = playerArticles.map((article) => ({
      article,
      journalist: findJournalist(article.journalistId),
      score: calculateArticleScore(article, findJournalist(article.journalistId)),
    }));

    const latestArticle = [...playerArticles].sort((a, b) =>
      b.publishedAt.localeCompare(a.publishedAt),
    )[0];

    const topScored = [...scored].sort((a, b) => b.score - a.score)[0];

    return {
      id: `rumor-${index + 1}`,
      playerName,
      fromTeam: playerArticles[0].fromTeam,
      toTeam: latestArticle.toTeam,
      articleIds: playerArticles.map((article) => article.id),
      score: calculateAggregateScore(scored.map((item) => item.score)),
      topJournalistName: topScored.journalist.name,
      updatedAt: latestArticle.publishedAt,
    };
  });
}

export const rumors: Rumor[] = buildRumors();
