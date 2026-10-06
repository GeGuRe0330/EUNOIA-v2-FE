// 메타 분석 화면의 순수 로직 — API 응답을 화면에서 쓸 상태로 변환

const KNOWN_STATUSES = ["PREPARING", "READY"];

// 조회/생성 응답의 status를 알려진 값만 인정(fail-closed) — 그 외(계약 위반)는 "UNKNOWN"
export function resolveGateStatus(data) {
    if (!data || !KNOWN_STATUSES.includes(data.status)) return "UNKNOWN";
    return data.status;
}

// 생성이 끝난 뒤의 latest가 실제로 결과를 보여줄 수 있는 형태인지 확인 — READY인데 content가 없는 드문 경우 방어
export function isUsableGenerateResult(data) {
    return resolveGateStatus(data) === "READY" && Boolean(data?.content);
}

// 생성 작업이 진행 중인지 — POST(202)·GET /latest 공통의 generationStatus(백엔드 ㉒). status(PREPARING/READY)와는 별개 축
export function isGenerating(data) {
    return data?.generationStatus === "PROCESSING";
}

export const GENERATE_FAILED_MESSAGE = "분석 결과를 만들지 못했어요. 다시 시도해 주세요.";
export const GENERATE_UNKNOWN_MESSAGE = "알 수 없는 응답이에요.";
export const GENERATE_TIMEOUT_MESSAGE =
    "분석을 만드는 데 시간이 걸리고 있어요. 잠시 뒤 이 화면으로 다시 오면 이어서 보여드려요.";

// 생성이 끝난(PROCESSING을 벗어난) latest → 화면이 할 일
//  failed:  서버가 확정한 실패(generationStatus FAILED) — message는 서버 고정 문구(없으면 기본), 재시도는 다시 누르면 새 시도
//  invalid: 알려지지 않은 status이거나 READY인데 결과(content)가 없음 — 계약 위반, 불완전한 데이터를 결과로 보여주지 않음
//  ready:   결과 사용 — sameResult는 폴링 전 결과와 같은 행인지(구성이 같아 새로 만들지 않은 경우)
export function resolveGenerationOutcome(previous, latest) {
    if (resolveGateStatus(latest) === "UNKNOWN") return { name: "invalid", message: GENERATE_UNKNOWN_MESSAGE };
    if (latest.generationStatus === "FAILED") {
        return { name: "failed", message: latest.generationReason || GENERATE_FAILED_MESSAGE };
    }
    if (!isUsableGenerateResult(latest)) return { name: "invalid", message: GENERATE_FAILED_MESSAGE };
    return { name: "ready", sameResult: isSameResult(previous, latest) };
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
