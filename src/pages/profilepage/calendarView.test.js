import { describe, expect, it } from "vitest";
import {
    currentYearMonth,
    todayDateString,
    shiftYearMonth,
    canGoNext,
    formatYearMonthLabel,
    buildMonthGrid,
    scoreToLevel,
    indexCalendarDays,
    formatDayLabel,
} from "./calendarView";

const now = new Date(2026, 9, 2, 15, 0, 0); // 2026-10-02 15:00 (로컬)

describe("currentYearMonth / todayDateString", () => {
    it("로컬 날짜 기준으로 만든다", () => {
        expect(currentYearMonth(now)).toBe("2026-10");
        expect(todayDateString(now)).toBe("2026-10-02");
    });

    it("한 자리 월·일은 0을 채운다", () => {
        const early = new Date(2026, 0, 5);
        expect(currentYearMonth(early)).toBe("2026-01");
        expect(todayDateString(early)).toBe("2026-01-05");
    });
});

describe("shiftYearMonth", () => {
    it("한 달씩 이동한다", () => {
        expect(shiftYearMonth("2026-10", -1)).toBe("2026-09");
        expect(shiftYearMonth("2026-10", 1)).toBe("2026-11");
    });

    it("연도를 넘겨 이동한다", () => {
        expect(shiftYearMonth("2026-01", -1)).toBe("2025-12");
        expect(shiftYearMonth("2025-12", 1)).toBe("2026-01");
    });

    it("여러 달도 이동한다", () => {
        expect(shiftYearMonth("2026-10", -10)).toBe("2025-12");
        expect(shiftYearMonth("2026-10", 14)).toBe("2027-12");
    });

    it.each([null, undefined, "", "2026-13", "2026-00", "2026-1", "abc"])("형식이 틀리면(%s) null이다", (value) => {
        expect(shiftYearMonth(value, 1)).toBeNull();
    });
});

describe("canGoNext", () => {
    it("지난 달에서는 다음 달로 갈 수 있다", () => {
        expect(canGoNext("2026-09", now)).toBe(true);
        expect(canGoNext("2025-12", now)).toBe(true);
    });

    it("이번 달에서는 갈 수 없다", () => {
        expect(canGoNext("2026-10", now)).toBe(false);
    });

    it("미래 달이나 틀린 형식에서는 갈 수 없다", () => {
        expect(canGoNext("2026-11", now)).toBe(false);
        expect(canGoNext("abc", now)).toBe(false);
        expect(canGoNext(null, now)).toBe(false);
    });
});

describe("formatYearMonthLabel", () => {
    it("년·월 문구를 만든다(월의 0은 지운다)", () => {
        expect(formatYearMonthLabel("2026-10")).toBe("2026년 10월");
        expect(formatYearMonthLabel("2026-01")).toBe("2026년 1월");
    });

    it("틀린 형식은 빈 문자열이다", () => {
        expect(formatYearMonthLabel("2026-13")).toBe("");
        expect(formatYearMonthLabel(undefined)).toBe("");
    });
});

describe("buildMonthGrid", () => {
    const flatten = (weeks) => weeks.flat();
    const filled = (weeks) => flatten(weeks).filter(Boolean);

    it("모든 주는 7칸이다", () => {
        ["2026-10", "2026-02", "2026-08", "2024-02"].forEach((ym) => {
            buildMonthGrid(ym).forEach((week) => expect(week).toHaveLength(7));
        });
    });

    it("2026년 10월은 목요일에 시작하고 31일까지 있다(일요일 시작 그리드)", () => {
        const weeks = buildMonthGrid("2026-10");
        expect(weeks[0].map((c) => c?.day ?? null)).toEqual([null, null, null, null, 1, 2, 3]);
        expect(filled(weeks)).toHaveLength(31);
        expect(filled(weeks).at(-1)).toEqual({ date: "2026-10-31", day: 31 });
        // 31일은 토요일이라 마지막 주가 꽉 참
        expect(weeks.at(-1).at(-1)?.day).toBe(31);
    });

    it("일요일에 시작하는 달은 앞 빈칸이 없다(2026년 2월, 28일)", () => {
        const weeks = buildMonthGrid("2026-02");
        expect(weeks[0][0]).toEqual({ date: "2026-02-01", day: 1 });
        expect(filled(weeks)).toHaveLength(28);
        expect(weeks).toHaveLength(4);
    });

    it("윤년 2월은 29일까지 있다", () => {
        const dates = filled(buildMonthGrid("2028-02")).map((c) => c.date);
        expect(dates).toHaveLength(29);
        expect(dates.at(-1)).toBe("2028-02-29");
    });

    it("평년 2월은 28일까지 있다", () => {
        expect(filled(buildMonthGrid("2027-02"))).toHaveLength(28);
    });

    it("6주가 필요한 달이 있다(2026년 8월: 토요일 시작 + 31일)", () => {
        const weeks = buildMonthGrid("2026-08");
        expect(weeks).toHaveLength(6);
        expect(weeks[0].map((c) => c?.day ?? null)).toEqual([null, null, null, null, null, null, 1]);
    });

    it("날짜 문자열은 0을 채운 YYYY-MM-DD다", () => {
        expect(filled(buildMonthGrid("2026-01"))[4]).toEqual({ date: "2026-01-05", day: 5 });
    });

    it.each([null, undefined, "", "2026-13", "abc"])("틀린 형식(%s)은 빈 배열이다", (value) => {
        expect(buildMonthGrid(value)).toEqual([]);
    });
});

describe("scoreToLevel", () => {
    it.each([
        [0, 1],
        [19.9, 1],
        [20, 2],
        [39.9, 2],
        [40, 3],
        [59.9, 3],
        [60, 4],
        [79.9, 4],
        [80, 5],
        [100, 5],
    ])("%s점은 %s단계다(경계값)", (score, level) => {
        expect(scoreToLevel(score)).toBe(level);
    });

    it("범위를 벗어난 값은 0·100으로 맞춘다", () => {
        expect(scoreToLevel(-5)).toBe(1);
        expect(scoreToLevel(130)).toBe(5);
    });

    it.each([null, undefined, NaN, Infinity, "80", {}])("숫자가 아니면(%s) null이다", (score) => {
        expect(scoreToLevel(score)).toBeNull();
    });
});

describe("indexCalendarDays", () => {
    it("날짜로 찾을 수 있게 정리하고 점수를 단계로 바꾼다", () => {
        const indexed = indexCalendarDays(
            [
                { date: "2026-10-01", entryCount: 1, averageScore: 85 },
                { date: "2026-10-02", entryCount: 2, averageScore: 36.5 },
            ],
            "2026-10"
        );
        expect(indexed).toEqual({
            "2026-10-01": { entryCount: 1, level: 5 },
            "2026-10-02": { entryCount: 2, level: 2 },
        });
    });

    it("점수가 null인 날(분석 없음/FAILED)은 level이 null이다", () => {
        const indexed = indexCalendarDays([{ date: "2026-10-01", entryCount: 1, averageScore: null }], "2026-10");
        expect(indexed["2026-10-01"]).toEqual({ entryCount: 1, level: null });
    });

    it("해당 월이 아닌 날짜는 버린다", () => {
        const indexed = indexCalendarDays(
            [
                { date: "2026-09-30", entryCount: 1, averageScore: 50 },
                { date: "2026-11-01", entryCount: 1, averageScore: 50 },
                { date: "2026-10-05", entryCount: 1, averageScore: 50 },
            ],
            "2026-10"
        );
        expect(Object.keys(indexed)).toEqual(["2026-10-05"]);
    });

    it.each([
        ["형식이 틀린 날짜", { date: "2026-10-1", entryCount: 1, averageScore: 50 }],
        ["날짜가 없음", { entryCount: 1, averageScore: 50 }],
        ["글 수가 0", { date: "2026-10-05", entryCount: 0, averageScore: 50 }],
        ["글 수가 음수", { date: "2026-10-05", entryCount: -1, averageScore: 50 }],
        ["글 수가 소수", { date: "2026-10-05", entryCount: 1.5, averageScore: 50 }],
        ["글 수가 문자열", { date: "2026-10-05", entryCount: "1", averageScore: 50 }],
        ["null 항목", null],
    ])("%s 항목은 버린다", (_, item) => {
        expect(indexCalendarDays([item], "2026-10")).toEqual({});
    });

    it("days가 배열이 아니거나 월 형식이 틀리면 빈 객체다", () => {
        expect(indexCalendarDays(null, "2026-10")).toEqual({});
        expect(indexCalendarDays(undefined, "2026-10")).toEqual({});
        expect(indexCalendarDays([{ date: "2026-10-01", entryCount: 1, averageScore: 5 }], "abc")).toEqual({});
    });
});

describe("formatDayLabel", () => {
    it("기록이 있으면 건수를 붙인다", () => {
        expect(formatDayLabel("2026-10-12", 2)).toBe("10월 12일, 기록 2건");
    });

    it("기록이 없으면 날짜만 말한다(0은 지운다)", () => {
        expect(formatDayLabel("2026-10-03")).toBe("10월 3일");
        expect(formatDayLabel("2026-01-05", 0)).toBe("1월 5일");
    });

    it("틀린 날짜는 빈 문자열이다", () => {
        expect(formatDayLabel("2026-10")).toBe("");
        expect(formatDayLabel(null)).toBe("");
    });
});
