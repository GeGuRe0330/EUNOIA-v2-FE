// 감정 캘린더 순수 로직 — 화면(EmotionCalendar)과 분리해 테스트 가능하게 둠
// 달력 계산은 Date의 UTC 메서드로만 해서 실행 환경의 시간대에 영향받지 않게 함 (④번 6절의 타임존 밀림 이슈와 같은 원칙)

const YEAR_MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (n) => String(n).padStart(2, "0");

// "2026-10" → { year, month } / 형식이 틀리면 null
const parseYearMonth = (yearMonth) => {
    const match = YEAR_MONTH_PATTERN.exec(String(yearMonth ?? ""));
    return match ? { year: Number(match[1]), month: Number(match[2]) } : null;
};

// 오늘이 속한 달 "YYYY-MM" (로컬 날짜 기준)
export const currentYearMonth = (now = new Date()) => `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;

// 오늘 "YYYY-MM-DD" (로컬 날짜 기준)
export const todayDateString = (now = new Date()) =>
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

// 월 이동 — 연도를 넘겨서 계산, 형식이 틀리면 null
export const shiftYearMonth = (yearMonth, delta) => {
    const parsed = parseYearMonth(yearMonth);
    if (!parsed) return null;

    const index = parsed.year * 12 + (parsed.month - 1) + delta;
    return `${Math.floor(index / 12)}-${pad((index % 12) + 1)}`;
};

// 미래 달로는 이동하지 않음 — 고정 형식 문자열이라 사전순 비교가 곧 시간순
export const canGoNext = (yearMonth, now = new Date()) =>
    parseYearMonth(yearMonth) !== null && yearMonth < currentYearMonth(now);

export const formatYearMonthLabel = (yearMonth) => {
    const parsed = parseYearMonth(yearMonth);
    return parsed ? `${parsed.year}년 ${parsed.month}월` : "";
};

// 월 그리드 — 일요일 시작, 7칸씩 주 단위 배열. 달 밖의 칸은 null, 달 안의 칸은 { date: "YYYY-MM-DD", day }
// 형식이 틀리면 빈 배열
export const buildMonthGrid = (yearMonth) => {
    const parsed = parseYearMonth(yearMonth);
    if (!parsed) return [];

    const { year, month } = parsed;
    const leadingBlanks = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0=일요일
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

    const cells = Array(leadingBlanks).fill(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
        cells.push({ date: `${year}-${pad(month)}-${pad(day)}`, day });
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
};

// 감정 점수(0~100, 높을수록 안정) → 명암 단계 1~5. 범위를 벗어나면 0·100으로 맞추고, 숫자가 아니면 null
export const scoreToLevel = (score) => {
    if (typeof score !== "number" || !Number.isFinite(score)) return null;

    const clamped = Math.min(100, Math.max(0, score));
    return Math.min(5, Math.floor(clamped / 20) + 1);
};

// 서버 응답의 days를 날짜로 바로 찾을 수 있게 정리 — { "2026-10-12": { entryCount, level | null } }
// 해당 월이 아닌 날짜, 형식이 틀린 날짜, 글 수가 양의 정수가 아닌 항목은 버림(잘못된 응답이 달력을 깨뜨리지 않게)
// level이 null이면 "기록은 있으나 분석이 없거나 실패한 날"
export const indexCalendarDays = (days, yearMonth) => {
    const indexed = {};
    if (!Array.isArray(days) || parseYearMonth(yearMonth) === null) return indexed;

    days.forEach((day) => {
        const date = typeof day?.date === "string" ? day.date : "";
        if (!DATE_PATTERN.test(date) || !date.startsWith(`${yearMonth}-`)) return;
        if (!Number.isInteger(day.entryCount) || day.entryCount < 1) return;

        indexed[date] = { entryCount: day.entryCount, level: scoreToLevel(day.averageScore) };
    });

    return indexed;
};

// 스크린리더용 날짜 설명 — "10월 12일, 기록 2건" / 기록이 없으면 "10월 3일"
export const formatDayLabel = (date, entryCount) => {
    const match = DATE_PATTERN.exec(String(date ?? ""));
    if (!match) return "";

    const label = `${Number(match[2])}월 ${Number(match[3])}일`;
    return Number.isInteger(entryCount) && entryCount > 0 ? `${label}, 기록 ${entryCount}건` : label;
};
