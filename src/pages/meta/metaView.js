// 메타 분석 화면의 순수 로직 — API 응답을 화면에서 쓸 상태로 변환

const KNOWN_STATUSES = ["PREPARING", "READY"];

// 조회/생성 응답의 status를 알려진 값만 인정(fail-closed) — 그 외(계약 위반)는 "UNKNOWN"
export function resolveGateStatus(data) {
    if (!data || !KNOWN_STATUSES.includes(data.status)) return "UNKNOWN";
    return data.status;
}

// 생성 응답이 실제로 결과를 보여줄 수 있는 형태인지 확인 — READY인데 content가 없는 드문 경우 방어
export function isUsableGenerateResult(data) {
    return resolveGateStatus(data) === "READY" && Boolean(data?.content);
}

// 재생성 가드로 이전 결과가 그대로 돌아왔는지 판별 — 선택된 일기 집합이 같으면 서버가 GPT 호출 없이
// 기존 결과를 그대로 돌려주고 updatedAt도 그대로임(백엔드 문서 §5.8)
export function isSameResult(previous, updated) {
    if (!previous?.updatedAt || !updated?.updatedAt) return false;
    return previous.updatedAt === updated.updatedAt;
}

// LocalDate 문자열("2026-09-27")을 "2026.09.27"로 — Date 파싱 없이 문자열만 다뤄 시간대 밀림 없음
export function formatDate(dateStr) {
    if (!dateStr) return "";
    return dateStr.replaceAll("-", ".");
}

// LocalDateTime 문자열("2026-09-27T10:15:30...")을 "2026.09.27 10:15"로 — 위와 같은 이유로 문자열만 다룸
export function formatDateTime(isoString) {
    if (!isoString) return "";
    const [datePart, timePart] = isoString.split("T");
    if (!datePart) return "";
    const date = formatDate(datePart);
    if (!timePart) return date;
    return `${date} ${timePart.slice(0, 5)}`;
}

const HISTORY_TITLE_MAX_LENGTH = 40;

// 이력 목록 제목 — content.outer.summary의 첫 문장을 발췌. 비어 있으면(백엔드가 근거 없을 때 빈 값으로 둠)
// fallbackText(보통 분석 기간 텍스트)로 대체
export function excerptHistoryTitle(content, fallbackText) {
    const summary = content?.outer?.summary;
    if (!summary) return fallbackText;

    const firstSentence = summary.split(/(?<=[.!?])\s/)[0] || summary;
    if (firstSentence.length <= HISTORY_TITLE_MAX_LENGTH) return firstSentence;
    return `${firstSentence.slice(0, HISTORY_TITLE_MAX_LENGTH)}…`;
}
