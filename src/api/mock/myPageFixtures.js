// [MOCK] 마이페이지 더미 데이터 — 백엔드 구현 전까지만 쓰고, 연동 브랜치(⑩ common/records-integration)에서 제거한다.
// 응답 모양은 실제 API 계약 초안(작업 문서 06.identity_my-page.md)과 같게 유지한다.
//
// 화면 상태를 눈으로 확인하려고 URL 쿼리 `?mock=`으로 시나리오를 고를 수 있다.
//   (없음)              기록이 풍부한 계정
//   empty               글 0개 신규 회원
//   fail:summary        지표 조회만 실패
//   fail:calendar       캘린더 조회만 실패
//   fail:recent         최근 글 조회만 실패

// 가입 시각 — 실제로는 /members/me에 createdAt이 추가될 예정(백엔드 요청 전)
export const MOCK_JOINED_AT = "2026-08-15T10:30:00";

export const readMockScenario = () => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("mock");
};

const pad = (n) => String(n).padStart(2, "0");

// 로컬 날짜 기준 "YYYY-MM-DD" — toISOString은 UTC로 바뀌어 하루 밀릴 수 있어 쓰지 않음
const toDateString = (date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const currentYearMonth = (now = new Date()) =>
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;

// 까다로운 경우를 일부러 넣는다 — 같은 날 여러 건(기본 12일), 분석이 없거나 FAILED인 날(기본 20일).
// 이번 달은 오늘까지만 존재하므로(미래 글 없음) 오늘 이전으로 당겨 달 초에도 두 경우가 보이게 한다
const pickSpecialDays = (lastDay) => {
    const multiDay = Math.min(12, lastDay);
    const candidate = Math.min(20, lastDay);
    const noScoreDay = lastDay < 2 ? null : candidate === multiDay ? multiDay - 1 : candidate;
    return { multiDay, noScoreDay };
};

// 해당 월의 캘린더 응답 — 글이 있는 날만 담는다: { yearMonth, days: [{ date, entryCount, averageScore | null }] }
export const buildCalendarMonth = (yearMonth, now = new Date()) => {
    const [year, month] = yearMonth.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = toDateString(now);

    // 오늘이 속한 달이면 오늘까지, 지난 달이면 말일까지, 앞으로의 달이면 없음
    const lastDay = yearMonth === currentYearMonth(now) ? now.getDate() : yearMonth < currentYearMonth(now) ? daysInMonth : 0;
    const { multiDay, noScoreDay } = pickSpecialDays(lastDay);

    const days = [];
    for (let day = 1; day <= lastDay; day += 1) {
        const date = `${year}-${pad(month)}-${pad(day)}`;
        if (date > today) break;

        const forced = day === multiDay || day === noScoreDay;
        if (!forced && (day * 7 + month * 3) % 5 >= 2) continue;

        const entryCount = day === multiDay ? 2 : 1;
        const averageScore =
            day === noScoreDay
                ? null
                : ((day * 37 + month * 11) % 61) + 35 + (entryCount === 2 ? 0.5 : 0);

        days.push({ date, entryCount, averageScore });
    }

    return { yearMonth, days };
};

// 지표 응답 — { totalEntryCount, monthEntryCount }
export const buildSummary = (now = new Date()) => {
    const monthEntryCount = buildCalendarMonth(currentYearMonth(now), now).days.reduce(
        (sum, day) => sum + day.entryCount,
        0
    );
    return { totalEntryCount: monthEntryCount + 9, monthEntryCount };
};

const RECENT_SAMPLES = [
    { emotionDetected: "기대", content: "오늘은 다시 EUNOIA를 다듬어보고 싶다는 생각이 들었다." },
    { emotionDetected: "불안", content: "요즘 취업 준비에만 매몰된 것 같아서 조금 지쳤다." },
    { emotionDetected: null, content: "분석이 아직 끝나지 않았거나 실패한 글은 감정 태그가 비어 있다." },
    { emotionDetected: "평온", content: "저녁에 산책을 했다. 오랜만에 아무 생각 없이 걸었다." },
    { emotionDetected: "뿌듯함", content: "미뤄 두었던 일을 끝냈다. 별것 아닌데도 마음이 가벼워졌다." },
    { emotionDetected: "막막함", content: "무엇부터 해야 할지 모르겠다는 생각이 하루 종일 따라다녔다." },
];

// 최근 글 응답 — 최신순 [{ id, entryDate, content, emotionDetected | null }]
export const buildRecentEntries = (limit = 5, now = new Date()) =>
    RECENT_SAMPLES.slice(0, limit).map((sample, index) => {
        const date = new Date(now);
        date.setDate(date.getDate() - index * 2);
        return {
            id: RECENT_SAMPLES.length - index,
            entryDate: toDateString(date),
            content: sample.content,
            emotionDetected: sample.emotionDetected,
        };
    });
