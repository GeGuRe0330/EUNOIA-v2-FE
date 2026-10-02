// [MOCK] 열람 화면(감정글 목록) 더미 데이터 — 백엔드 구현 전까지만 쓰고, 연동 브랜치(⑩ common/records-integration)에서 제거한다.
// 마이페이지 캘린더 더미(myPageFixtures)와 **같은 날짜·같은 글 수**로 만들어, 캘린더에서 날짜를 눌러 넘어와도 그 날의 글이 실제로 나온다.
// 시나리오 선택은 myPageFixtures의 `?mock=`을 함께 쓴다 — 이 화면에선 empty · fail:list(첫 조회 실패) · fail:more(더 보기만 실패).

import { buildCalendarMonth } from "./myPageFixtures";

const pad = (n) => String(n).padStart(2, "0");

// 더미 글의 id는 900001부터 — 실제 DB의 일기 id(1, 2, 3…)와 우연히 겹치지 않게 한다.
// 겹치면 더미 카드를 눌러도 실제 서버의 같은 id 글이 열려 "더미인지 실제인지" 헷갈리고, 삭제 같은 더미 동작이 실제 글처럼 보인다
export const MOCK_ENTRY_ID_BASE = 900000;

// 더미 글의 id인가 — 더미 글은 상세·분석도 서버가 아니라 더미로 열린다(EunoiaApi의 [MOCK] 구간)
export const isMockEntryId = (id) => Number.isInteger(id) && id > MOCK_ENTRY_ID_BASE;

const SAMPLES = [
    { emotionDetected: "기대", content: "오늘은 다시 EUNOIA를 다듬어보고 싶다는 생각이 들었다." },
    { emotionDetected: "불안", content: "요즘 취업 준비에만 매몰된 것 같아서 조금 지쳤다." },
    { emotionDetected: "평온", content: "저녁에 산책을 했다. 오랜만에 아무 생각 없이 걸었다." },
    { emotionDetected: "뿌듯함", content: "미뤄 두었던 일을 끝냈다. 별것 아닌데도 마음이 가벼워졌다." },
    { emotionDetected: "막막함", content: "무엇부터 해야 할지 모르겠다는 생각이 하루 종일 따라다녔다." },
    {
        emotionDetected: "그리움",
        content:
            "오래된 사진첩을 정리하다가 예전 친구들 사진을 한참 들여다봤다. 그때는 별것 아닌 일로도 크게 웃었는데, 지금은 연락 한 번 하는 것도 쉽지 않다. 그래도 이렇게 가끔 떠올릴 수 있다는 게 다행이라는 생각이 들었다.",
    },
    { emotionDetected: "답답함", content: "할 일은 쌓여 있는데 손이 안 간다." },
];

// 이번 달부터 거슬러 올라가며 캘린더 더미의 날짜별 글 수만큼 일기를 만든다 — 최신순(날짜 내림차순, 같은 날은 id 내림차순)
// 캘린더에서 점수가 없는 날(분석 없음·FAILED)의 글은 감정 태그가 null
export const buildAllEntries = (now = new Date(), monthsBack = 6) => {
    const chronological = [];

    for (let back = monthsBack - 1; back >= 0; back -= 1) {
        const first = new Date(now.getFullYear(), now.getMonth() - back, 1);
        const yearMonth = `${first.getFullYear()}-${pad(first.getMonth() + 1)}`;

        buildCalendarMonth(yearMonth, now).days.forEach((day) => {
            for (let n = 0; n < day.entryCount; n += 1) {
                chronological.push({ date: day.date, hasScore: day.averageScore !== null });
            }
        });
    }

    return chronological
        .map((entry, index) => {
            const sample = SAMPLES[index % SAMPLES.length];
            return {
                id: MOCK_ENTRY_ID_BASE + index + 1,
                entryDate: entry.date,
                content: sample.content,
                emotionDetected: entry.hasScore ? sample.emotionDetected : null,
            };
        })
        .reverse();
};

// 조회 기간(from·to, 둘 다 그 날 포함, 한쪽만 줘도 됨) 필터 + 페이지 나누기 — 응답: { items, page, size, hasNext }
// "YYYY-MM-DD" 고정 형식이라 문자열 비교가 곧 날짜 비교
export const pageEntries = (entries, { from, to, page = 0, size = 10 } = {}) => {
    const filtered = entries.filter(
        (entry) => (!from || entry.entryDate >= from) && (!to || entry.entryDate <= to)
    );
    const start = page * size;

    return {
        items: filtered.slice(start, start + size),
        page,
        size,
        hasNext: start + size < filtered.length,
    };
};

// --- 더미 삭제 반영 — 지운 id를 목록·캘린더·지표에서 빼는 순수 함수들 (deletedEntries 저장소가 id를 기억함)

// 지운 글을 뺀 목록(최신순 유지)
export const withoutDeleted = (entries, deletedIds) => {
    const deleted = new Set(deletedIds);
    return entries.filter((entry) => !deleted.has(entry.id));
};

// 지운 글이 있던 날의 글 수를 줄이고, 0이 되면 그날을 뺀다 — 열람 목록에서 그 날을 조회했을 때 글 수와 캘린더가 일치하도록(api-spec의 일치 규칙)
// 점수(averageScore)는 그대로 둔다(남은 글의 점수를 더미가 다시 계산하지 않음)
export const applyDeletionsToCalendar = (calendar, deletedEntries) => {
    const removedByDate = {};
    deletedEntries.forEach((entry) => {
        removedByDate[entry.entryDate] = (removedByDate[entry.entryDate] ?? 0) + 1;
    });

    return {
        ...calendar,
        days: calendar.days
            .map((day) => ({ ...day, entryCount: day.entryCount - (removedByDate[day.date] ?? 0) }))
            .filter((day) => day.entryCount > 0),
    };
};

// 지운 글만큼 총 글 수를 줄이고, 이번 달에 쓴 글이면 이번 달 글 수도 줄인다(0 아래로는 내려가지 않음)
export const applyDeletionsToSummary = (summary, deletedEntries, yearMonth) => {
    const inMonth = deletedEntries.filter((entry) => entry.entryDate.startsWith(`${yearMonth}-`)).length;

    return {
        totalEntryCount: Math.max(0, summary.totalEntryCount - deletedEntries.length),
        monthEntryCount: Math.max(0, summary.monthEntryCount - inMonth),
    };
};
