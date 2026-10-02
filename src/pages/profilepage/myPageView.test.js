import { describe, expect, it } from "vitest";
import {
    daysTogether,
    formatTogetherText,
    resolveLatestEmotion,
    formatEntryCount,
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
