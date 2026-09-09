// docs/PLAN.md 7·8번(다룰 선수·팀 목록, 기자 후보 5명) 기준 더미 데이터.
// 3차시: 이 배열을 메인 화면 카드 목록에 렌더링하고, 필터(팀별/기자별/선수별)로 걸러낸다.
// 6차시부터는 이 배열 대신 Supabase 쿼리 결과를 같은 타입으로 채워 넣으면 된다.
//
// 리그 태그 규칙: article.league는 "이적 전 소속팀(fromTeam)의 리그"를 기준으로 정한다.
// 예) AC 밀란(세리에 A) 소속 선수가 첼시(프리미어리그)로 이적하는 기사는 league: "세리에 A".
// 이렇게 해야 디 마르치오(세리에 A 전문)·플레텐베르크(분데스리가 전문) 같은
// 리그 특화 기자의 티어 점수가 실제로 쓰이는 사례를 보여줄 수 있다.

import type { Article, Journalist, Rumor } from "./types";
import { calculateAggregateScore, calculateArticleScore } from "./trustScore";

// docs/PLAN.md 8번 기자 후보 5명 + 임시 리그별/기본 티어 점수.
// 로마노·오른스타인은 프리미어리그 특화라 리그 태그가 일치해 높은 점수를 받고,
// 디 마르치오·플레텐베르크는 각자 세리에 A·분데스리가가 전문이라 그 리그 기사에서만
// 높은 점수를 받으며 그 외에는 기본 티어(낮은 값)로 대체된다. 카슬스는 처음부터
// 낮은 티어로 잡아 "신뢰도 낮은 매체" 대조군 역할을 하게 했다.
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

// docs/PLAN.md 7번 핵심 5팀·5선수 + 필터 테스트용으로 추가한 5건, 총 10명 선수
// 기준 25개 기사. 5팀(토트넘/맨시티/맨유/리버풀/첼시)이 각각 최소 두 건 이상의
// 이적설에 걸리도록 구성해 "팀별" 필터를 눌렀을 때 카드가 실제로 여러 개 남는지
// 확인할 수 있게 했다.
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

  // 6. 곤살로 라모스 — PSG → 맨체스터 유나이티드 (fromTeam 리그: 리그 1)
  {
    id: "a14",
    url: "https://example.com/articles/ramos-progressing",
    journalistId: "romano",
    playerName: "곤살로 라모스",
    fromTeam: "파리 생제르맹",
    toTeam: "맨체스터 유나이티드",
    league: "리그 1",
    certainty: "진전",
    summary: "맨유의 공식 오퍼가 전달됐고, PSG 내부 검토 중.",
    publishedAt: "2026-08-24",
  },
  {
    id: "a15",
    url: "https://example.com/articles/ramos-interest",
    journalistId: "ornstein",
    playerName: "곤살로 라모스",
    fromTeam: "파리 생제르맹",
    toTeam: "맨체스터 유나이티드",
    league: "리그 1",
    certainty: "관심",
    summary: "맨유가 공격수 보강 후보 중 한 명으로 검토하고 있다는 수준.",
    publishedAt: "2026-08-18",
  },
  {
    id: "a16",
    url: "https://example.com/articles/ramos-confirmed",
    journalistId: "castles",
    playerName: "곤살로 라모스",
    fromTeam: "파리 생제르맹",
    toTeam: "맨체스터 유나이티드",
    league: "리그 1",
    certainty: "확정",
    summary: "이적이 사실상 끝났다고 성급하게 단정한 보도.",
    publishedAt: "2026-08-27",
  },

  // 7. 니코 슐로터베크 — 보루시아 도르트문트 → 리버풀 (fromTeam 리그: 분데스리가)
  {
    id: "a17",
    url: "https://example.com/articles/schlotterbeck-confirmed",
    journalistId: "plettenberg",
    playerName: "니코 슐로터베크",
    fromTeam: "보루시아 도르트문트",
    toTeam: "리버풀",
    league: "분데스리가",
    certainty: "확정",
    summary: "도르트문트와 리버풀이 이적료에 최종 합의했다고 보도 (독일 현지 전문 소식통).",
    publishedAt: "2026-08-15",
  },
  {
    id: "a18",
    url: "https://example.com/articles/schlotterbeck-progressing",
    journalistId: "romano",
    playerName: "니코 슐로터베크",
    fromTeam: "보루시아 도르트문트",
    toTeam: "리버풀",
    league: "분데스리가",
    certainty: "진전",
    summary: "협상이 마지막 단계에 들어섰다고 확인.",
    publishedAt: "2026-08-17",
  },

  // 8. 라파엘 레앙 — AC 밀란 → 첼시 (fromTeam 리그: 세리에 A)
  {
    id: "a19",
    url: "https://example.com/articles/leao-confirmed",
    journalistId: "dimarzio",
    playerName: "라파엘 레앙",
    fromTeam: "AC 밀란",
    toTeam: "첼시",
    league: "세리에 A",
    certainty: "확정",
    summary: "밀란 이사회가 이적을 승인, 계약 조건까지 합의됐다고 보도 (이탈리아 현지 전문 소식통).",
    publishedAt: "2026-08-14",
  },
  {
    id: "a20",
    url: "https://example.com/articles/leao-progressing",
    journalistId: "romano",
    playerName: "라파엘 레앙",
    fromTeam: "AC 밀란",
    toTeam: "첼시",
    league: "세리에 A",
    certainty: "진전",
    summary: "첼시가 제시한 조건에 밀란이 긍정적으로 반응하고 있음.",
    publishedAt: "2026-08-16",
  },
  {
    id: "a21",
    url: "https://example.com/articles/leao-interest",
    journalistId: "castles",
    playerName: "라파엘 레앙",
    fromTeam: "AC 밀란",
    toTeam: "첼시",
    league: "세리에 A",
    certainty: "관심",
    summary: "첼시가 관심을 갖고 있다는 수준의 초기 보도.",
    publishedAt: "2026-08-12",
  },

  // 9. 브루누 페르난데스 — 맨체스터 유나이티드 → 알-힐랄 (아웃고잉)
  {
    id: "a22",
    url: "https://example.com/articles/bruno-progressing",
    journalistId: "ornstein",
    playerName: "브루누 페르난데스",
    fromTeam: "맨체스터 유나이티드",
    toTeam: "알-힐랄",
    league: "프리미어리그",
    certainty: "진전",
    summary: "알-힐랄의 오퍼 규모가 커지면서 맨유도 내부적으로 논의 중.",
    publishedAt: "2026-08-13",
  },
  {
    id: "a23",
    url: "https://example.com/articles/bruno-confirmed",
    journalistId: "castles",
    playerName: "브루누 페르난데스",
    fromTeam: "맨체스터 유나이티드",
    toTeam: "알-힐랄",
    league: "프리미어리그",
    certainty: "확정",
    summary: "이적이 확정됐다고 성급하게 단정한 보도.",
    publishedAt: "2026-08-10",
  },

  // 10. 콜 파머 — 첼시 → 레알 마드리드 (아웃고잉)
  {
    id: "a24",
    url: "https://example.com/articles/palmer-interest",
    journalistId: "romano",
    playerName: "콜 파머",
    fromTeam: "첼시",
    toTeam: "레알 마드리드",
    league: "프리미어리그",
    certainty: "관심",
    summary: "레알 마드리드가 여름 영입 후보로 검토하고 있다는 수준.",
    publishedAt: "2026-08-11",
  },
  {
    id: "a25",
    url: "https://example.com/articles/palmer-progressing",
    journalistId: "ornstein",
    playerName: "콜 파머",
    fromTeam: "첼시",
    toTeam: "레알 마드리드",
    league: "프리미어리그",
    certainty: "진전",
    summary: "첼시 구단이 잔류를 설득 중이나, 선수 본인은 이적에 열려 있다고 보도.",
    publishedAt: "2026-08-09",
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

    const articleScores = playerArticles.map((article) =>
      calculateArticleScore(article, findJournalist(article.journalistId)),
    );

    const latestArticle = [...playerArticles].sort((a, b) =>
      b.publishedAt.localeCompare(a.publishedAt),
    )[0];

    return {
      id: `rumor-${index + 1}`,
      playerName,
      fromTeam: playerArticles[0].fromTeam,
      toTeam: latestArticle.toTeam,
      articleIds: playerArticles.map((article) => article.id),
      journalistIds: [...new Set(playerArticles.map((article) => article.journalistId))],
      score: calculateAggregateScore(articleScores),
      updatedAt: latestArticle.publishedAt,
      latestArticle: {
        journalistName: findJournalist(latestArticle.journalistId).name,
        url: latestArticle.url,
        publishedAt: latestArticle.publishedAt,
      },
    };
  });
}

export const rumors: Rumor[] = buildRumors();
