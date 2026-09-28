// 점수 차트용 순수 로직 — 화면(EmotionScoreChart)과 분리해 테스트 가능하게 둠

// "2026-09-26" → "09/26"
// Date 객체를 거치지 않고 문자열로 자름 — `new Date("2026-09-26")`은 UTC 자정으로 해석돼
// UTC보다 늦은 시간대(예: 미국)에선 로컬 날짜가 하루 전으로 밀림
export const formatEntryDate = (entryDate) => {
    const match = /^\d{4}-(\d{2})-(\d{2})/.exec(String(entryDate ?? ""));
    return match ? `${match[1]}/${match[2]}` : "";
};
