// 점수 차트용 순수 로직 — 화면(EmotionScoreChart)과 분리해 테스트 가능하게 둠

// "2026-09-26" → "09/26"
// Date 객체를 거치지 않고 문자열로 자름 — `new Date("2026-09-26")`은 UTC 자정으로 해석돼
// UTC보다 늦은 시간대(예: 미국)에선 로컬 날짜가 하루 전으로 밀림
export const formatEntryDate = (entryDate) => {
    const match = /^\d{4}-(\d{2})-(\d{2})/.exec(String(entryDate ?? ""));
    return match ? `${match[1]}/${match[2]}` : "";
};

// 감정 점수(0~100)의 범위 — Y축 domain과 아이콘 위치 계산이 같은 값을 쓴다
export const SCORE_DOMAIN = [0, 100];

// Y축 눈금의 아이콘이 놓일 세로 중심(px) — 눈금 값(value)에서 아이콘이 놓일 점수(at)까지의 거리를 픽셀로 바꿔 눈금 y에 더한다
// recharts가 눈금에 넘겨 주는 height는 0~100 전체의 픽셀 길이라 "점수 1점 = height / 100px". height를 모르면 눈금 위치 그대로
export const iconCenterY = ({ y, height, value, at }) => {
    if (!Number.isFinite(height)) return y;
    const pixelsPerPoint = height / (SCORE_DOMAIN[1] - SCORE_DOMAIN[0]);
    return y + (value - at) * pixelsPerPoint; // 점수가 클수록 위(y가 작음)
};
