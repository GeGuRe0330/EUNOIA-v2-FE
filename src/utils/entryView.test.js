import { describe, expect, it } from "vitest";
import { formatEntryDate, normalizeEntries, entriesPathForDate, entryDetailPath } from "./entryView";

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

describe("normalizeEntries", () => {
    const entry = { id: 3, entryDate: "2026-10-02", content: "오늘은 다시…", emotionDetected: "기대" };

    it("카드에 쓸 모양으로 바꾼다(서버 순서 유지)", () => {
        const result = normalizeEntries([entry, { ...entry, id: 2, entryDate: "2026-09-30" }]);
        expect(result).toEqual([
            { id: 3, dateText: "2026.10.02", content: "오늘은 다시…", emotion: "기대" },
            { id: 2, dateText: "2026.09.30", content: "오늘은 다시…", emotion: "기대" },
        ]);
    });

    it("감정이 null·빈 값·공백뿐·문자열이 아니면 emotion은 null이다(분석 없음/FAILED)", () => {
        [null, undefined, "", "   ", 5].forEach((emotionDetected) => {
            expect(normalizeEntries([{ ...entry, emotionDetected }])[0].emotion).toBeNull();
        });
    });

    it("감정의 앞뒤 공백은 지운다", () => {
        expect(normalizeEntries([{ ...entry, emotionDetected: " 불안 " }])[0].emotion).toBe("불안");
    });

    it("문자열 id도 받는다", () => {
        expect(normalizeEntries([{ ...entry, id: "e-1" }])[0].id).toBe("e-1");
    });

    it("날짜가 틀린 글도 카드는 만들되 날짜 문구만 비운다", () => {
        expect(normalizeEntries([{ ...entry, entryDate: "어제" }])[0].dateText).toBe("");
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
        expect(normalizeEntries([item])).toEqual([]);
    });

    it("깨진 항목만 걸러내고 나머지는 남긴다", () => {
        expect(normalizeEntries([null, entry, { id: 1 }])).toHaveLength(1);
    });

    it.each([null, undefined, {}, "목록"])("배열이 아니면(%s) 빈 배열이다", (value) => {
        expect(normalizeEntries(value)).toEqual([]);
    });

    it("빈 배열은 빈 배열이다", () => {
        expect(normalizeEntries([])).toEqual([]);
    });
});

describe("entriesPathForDate", () => {
    it("하루를 시작일=종료일인 조회 기간으로 만든다", () => {
        expect(entriesPathForDate("2026-10-12")).toBe("/entries?from=2026-10-12&to=2026-10-12");
    });

    it.each([null, undefined, "", "2026-10", "2026-10-2", "어제"])("날짜 형식이 틀리면(%s) 필터 없는 전체 목록이다", (value) => {
        expect(entriesPathForDate(value)).toBe("/entries");
    });
});

describe("entryDetailPath", () => {
    it("숫자·문자열 id로 상세 경로를 만든다", () => {
        expect(entryDetailPath(31)).toBe("/entries/31");
        expect(entryDetailPath("e-1")).toBe("/entries/e-1");
    });

    it("경로를 깨는 문자는 인코딩한다", () => {
        expect(entryDetailPath("a/b?c")).toBe("/entries/a%2Fb%3Fc");
    });

    it.each([null, undefined, "", NaN, Infinity, {}])("id가 올바르지 않으면(%s) null이다", (value) => {
        expect(entryDetailPath(value)).toBeNull();
    });
});
