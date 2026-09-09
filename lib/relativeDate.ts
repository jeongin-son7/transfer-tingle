// 참고 디자인의 "어제 · 기자명 ↗" 출처 표기 스타일에 쓰는 상대 날짜 포맷터.

export function formatRelativeDate(dateStr: string): string {
  const target = new Date(`${dateStr}T00:00:00`);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round(
    (startOfToday.getTime() - target.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays <= 0) return "오늘";
  if (diffDays === 1) return "어제";
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  return dateStr;
}
