// 마이페이지 화면용 순수 로직 — 화면(MyPage)과 분리해 테스트 가능하게 둠

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// 가입일 문자열("2026-08-15T10:30:00" 등)과 오늘의 달력 날짜 차이로 "가입 N일째"를 구함(가입 당일 = 1일째)
// Date 객체로 시각을 비교하지 않고 날짜만 UTC 자정으로 맞춰 빼서 시간대·시각에 흔들리지 않음
// 형식이 틀렸거나 존재하지 않는 날짜, 미래 날짜면 null
export const daysTogether = (createdAt, now = new Date()) => {
    const match = DATE_PATTERN.exec(String(createdAt ?? ""));
    if (!match) return null;

    const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
    const joined = new Date(Date.UTC(year, month - 1, day));
    if (joined.getUTCMonth() !== month - 1 || joined.getUTCDate() !== day) return null;

    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((today - joined.getTime()) / MS_PER_DAY);
    return diffDays >= 0 ? diffDays + 1 : null;
};

export const formatTogetherText = (days) => (days == null ? null : `함께한 지 ${days}일째`);

// 최근 감정 — 분석이 끝난 SUCCESS의 emotionDetected만 인정(④번과 같은 fail-closed: 알려진 status만)
// 분석이 없거나(null) FAILED(감정 필드가 null)이거나 값이 비어 있으면 null
export const resolveLatestEmotion = (latest) => {
    if (latest?.status !== "SUCCESS") return null;
    const emotion = typeof latest.emotionDetected === "string" ? latest.emotionDetected.trim() : "";
    return emotion || null;
};

export const formatEntryCount = (count) => (Number.isFinite(count) ? `${count}개` : "-");

const ENTRY_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

// LocalDate 문자열("2026-10-02")을 "2026.10.02"로 — Date 파싱 없이 문자열만 다뤄 시간대 밀림 없음. 형식이 틀리면 빈 문자열
export const formatEntryDate = (entryDate) => {
    const match = ENTRY_DATE_PATTERN.exec(String(entryDate ?? ""));
    return match ? `${match[1]}.${match[2]}.${match[3]}` : "";
};

// 최근 글 응답을 화면에서 쓸 카드 목록으로 정리 — 서버 응답이 깨져도 카드 하나가 화면을 깨뜨리지 않게
// id(숫자·비어 있지 않은 문자열)와 본문(문자열)이 없는 항목은 버리고, 감정 태그는 비어 있으면 null
// 응답이 배열이 아니면 빈 배열(조회 실패와 "글 없음"의 구분은 호출한 쪽의 오류 상태가 맡음)
export const normalizeRecentEntries = (entries) => {
    if (!Array.isArray(entries)) return [];

    return entries.flatMap((entry) => {
        const validId =
            (typeof entry?.id === "number" && Number.isFinite(entry.id)) ||
            (typeof entry?.id === "string" && entry.id !== "");
        if (!validId || typeof entry.content !== "string") return [];

        const emotion = typeof entry.emotionDetected === "string" ? entry.emotionDetected.trim() : "";
        return [
            {
                id: entry.id,
                dateText: formatEntryDate(entry.entryDate),
                content: entry.content,
                emotion: emotion || null,
            },
        ];
    });
};
