import { describe, expect, it } from "vitest";
import {
    daysTogether,
    formatTogetherText,
    resolveLatestEmotion,
    formatEntryCount,
    formatEntryDate,
    normalizeRecentEntries,
} from "./myPageView";

describe("daysTogether", () => {
    const now = new Date(2026, 9, 2, 15, 0, 0); // 2026-10-02 15:00 (로컬)

    it("가입 당일은 1일째다", () => {
        expect(daysTogether("2026-10-02T09:00:00", now)).toBe(1);
    });

    it("다음 날은 2일째다", () => {
        expect(daysTogether("2026-10-01T23:59:59", now)).toBe(2);
    });

    it("시각과 무관하게 날짜만 비교한다(가입 시각이 오늘보다 늦어도 당일이면 1일째)", () => {
        expect(daysTogether("2026-10-02T23:59:59", now)).toBe(1);
    });

    it("월을 넘겨서 센다", () => {
        // 2026-08-15 → 2026-10-02: 8월 16일치 + 9월 30일 + 10월 2일 = 48일 차이 → 49일째
        expect(daysTogether("2026-08-15T10:30:00", now)).toBe(49);
    });

    it("윤년의 2월 29일을 포함해 센다", () => {
        const leapNow = new Date(2028, 2, 1); // 2028-03-01
        expect(daysTogether("2028-02-28", leapNow)).toBe(3);
    });

    it("날짜만 있는 문자열도 받는다", () => {
        expect(daysTogether("2026-10-01", now)).toBe(2);
    });

    it.each([
        ["null", null],
        ["undefined", undefined],
        ["빈 문자열", ""],
        ["형식이 다른 문자열", "어제"],
        ["존재하지 않는 날짜", "2026-02-30"],
        ["존재하지 않는 월", "2026-13-01"],
        ["미래 날짜", "2026-10-03"],
    ])("%s는 null이다", (_, createdAt) => {
        expect(daysTogether(createdAt, now)).toBeNull();
    });
});

describe("formatTogetherText", () => {
    it("일수를 문구로 만든다", () => {
        expect(formatTogetherText(49)).toBe("함께한 지 49일째");
    });

    it("null이면 문구를 만들지 않는다", () => {
        expect(formatTogetherText(null)).toBeNull();
        expect(formatTogetherText(undefined)).toBeNull();
    });
});

describe("resolveLatestEmotion", () => {
    it("SUCCESS의 대표 감정을 돌려준다", () => {
        expect(resolveLatestEmotion({ status: "SUCCESS", emotionDetected: "기대" })).toBe("기대");
    });

    it("앞뒤 공백은 지운다", () => {
        expect(resolveLatestEmotion({ status: "SUCCESS", emotionDetected: " 불안 " })).toBe("불안");
    });

    it.each([
        ["분석 없음(null)", null],
        ["undefined", undefined],
        ["FAILED", { status: "FAILED", reason: "감정 분석에 실패했어요.", emotionDetected: null }],
        ["알려지지 않은 status", { status: "PROCESSING", emotionDetected: "기대" }],
        ["감정이 null", { status: "SUCCESS", emotionDetected: null }],
        ["감정이 빈 문자열", { status: "SUCCESS", emotionDetected: "" }],
        ["감정이 공백뿐", { status: "SUCCESS", emotionDetected: "   " }],
        ["감정이 문자열이 아님", { status: "SUCCESS", emotionDetected: 3 }],
    ])("%s는 null이다", (_, latest) => {
        expect(resolveLatestEmotion(latest)).toBeNull();
    });
});

describe("formatEntryCount", () => {
    it("숫자는 개수 문구로 만든다(0 포함)", () => {
        expect(formatEntryCount(12)).toBe("12개");
        expect(formatEntryCount(0)).toBe("0개");
    });

    it.each([null, undefined, "12", NaN])("숫자가 아니면 '-'다(%s)", (value) => {
        expect(formatEntryCount(value)).toBe("-");
    });
});

describe("formatEntryDate", () => {
    it("날짜를 점으로 구분해 보여준다", () => {
        expect(formatEntryDate("2026-10-02")).toBe("2026.10.02");
    });

    it.each([null, undefined, "", "2026-10", "2026-10-2", "2026-10-02T10:00:00", "어제"])(
        "형식이 틀리면(%s) 빈 문자열이다",
        (value) => {
            expect(formatEntryDate(value)).toBe("");
        }
    );
});

describe("normalizeRecentEntries", () => {
    const entry = { id: 3, entryDate: "2026-10-02", content: "오늘은 다시…", emotionDetected: "기대" };

    it("카드에 쓸 모양으로 바꾼다(서버 순서 유지)", () => {
        const result = normalizeRecentEntries([entry, { ...entry, id: 2, entryDate: "2026-09-30" }]);
        expect(result).toEqual([
            { id: 3, dateText: "2026.10.02", content: "오늘은 다시…", emotion: "기대" },
            { id: 2, dateText: "2026.09.30", content: "오늘은 다시…", emotion: "기대" },
        ]);
    });

    it("감정이 null·빈 값·공백뿐·문자열이 아니면 emotion은 null이다(분석 없음/FAILED)", () => {
        [null, undefined, "", "   ", 5].forEach((emotionDetected) => {
            expect(normalizeRecentEntries([{ ...entry, emotionDetected }])[0].emotion).toBeNull();
        });
    });

    it("감정의 앞뒤 공백은 지운다", () => {
        expect(normalizeRecentEntries([{ ...entry, emotionDetected: " 불안 " }])[0].emotion).toBe("불안");
    });

    it("문자열 id도 받는다", () => {
        expect(normalizeRecentEntries([{ ...entry, id: "e-1" }])[0].id).toBe("e-1");
    });

    it("날짜가 틀린 글도 카드는 만들되 날짜 문구만 비운다", () => {
        expect(normalizeRecentEntries([{ ...entry, entryDate: "어제" }])[0].dateText).toBe("");
    });

    it.each([
        ["id 없음", { content: "본문" }],
        ["id가 빈 문자열", { id: "", content: "본문" }],
        ["id가 NaN", { id: NaN, content: "본문" }],
        ["id가 객체", { id: {}, content: "본문" }],
        ["본문 없음", { id: 1 }],
        ["본문이 문자열이 아님", { id: 1, content: 3 }],
        ["null 항목", null],
    ])("%s 항목은 버린다", (_, item) => {
        expect(normalizeRecentEntries([item])).toEqual([]);
    });

    it("깨진 항목만 걸러내고 나머지는 남긴다", () => {
        expect(normalizeRecentEntries([null, entry, { id: 1 }])).toHaveLength(1);
    });

    it.each([null, undefined, {}, "목록"])("배열이 아니면(%s) 빈 배열이다", (value) => {
        expect(normalizeRecentEntries(value)).toEqual([]);
    });

    it("빈 배열은 빈 배열이다", () => {
        expect(normalizeRecentEntries([])).toEqual([]);
    });
});
