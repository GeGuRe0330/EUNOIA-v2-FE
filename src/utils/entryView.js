// 일기 카드용 순수 로직 — 마이페이지 최근 글과 열람 화면이 함께 씀

const ENTRY_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

// LocalDate 문자열("2026-10-02")을 "2026.10.02"로 — Date 파싱 없이 문자열만 다뤄 시간대 밀림 없음. 형식이 틀리면 빈 문자열
export const formatEntryDate = (entryDate) => {
    const match = ENTRY_DATE_PATTERN.exec(String(entryDate ?? ""));
    return match ? `${match[1]}.${match[2]}.${match[3]}` : "";
};

// 일기 목록 응답(마이페이지 최근 글, 열람 목록 공통)을 화면에서 쓸 카드 목록으로 정리 — 서버 응답이 깨져도 카드 하나가 화면을 깨뜨리지 않게
// id(숫자·비어 있지 않은 문자열)와 본문(문자열)이 없는 항목은 버리고, 감정 태그는 비어 있으면 null
// 응답이 배열이 아니면 빈 배열(조회 실패와 "글 없음"의 구분은 호출한 쪽의 오류 상태가 맡음)
export const normalizeEntries = (entries) => {
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

// 마이페이지 캘린더에서 그 날의 글 목록으로 가는 경로 — 하루는 시작일=종료일인 조회 기간으로 주입한다. 날짜 형식이 틀리면 필터 없는 전체 목록
export const entriesPathForDate = (date) =>
    ENTRY_DATE_PATTERN.test(String(date ?? "")) ? `/entries?from=${date}&to=${date}` : "/entries";
