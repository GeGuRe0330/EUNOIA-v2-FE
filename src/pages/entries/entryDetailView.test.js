import { describe, expect, it } from "vitest";
import {
    NOT_FOUND_MESSAGE,
    FAILED_DEFAULT_REASON,
    parseEntryId,
    classifyEntryError,
    resolveEntryView,
    splitKeywords,
    resolveAnalysisView,
    describeAnalysisHint,
    ANALYSIS_HINTS,
    previewKeywords,
    KEYWORD_PREVIEW_COUNT,
} from "./entryDetailView";

describe("parseEntryId", () => {
    it.each([
        ["1", 1],
        ["31", 31],
        ["9007199254740991", 9007199254740991],
    ])("%s는 %s다", (param, id) => {
        expect(parseEntryId(param)).toBe(id);
    });

    it.each([
        ["빈 문자열", ""],
        ["null", null],
        ["undefined", undefined],
        ["0", "0"],
        ["음수", "-3"],
        ["앞자리 0", "007"],
        ["소수", "1.5"],
        ["글자가 섞임", "12abc"],
        ["글자뿐", "abc"],
        ["공백이 섞임", " 12"],
        ["안전하지 않은 큰 수", "9007199254740993"],
    ])("%s는 null이다", (_, param) => {
        expect(parseEntryId(param)).toBeNull();
    });
});

describe("classifyEntryError", () => {
    it("404는 없는 글, 서버 문구를 그대로 쓴다", () => {
        expect(classifyEntryError({ status: 404, message: NOT_FOUND_MESSAGE })).toEqual({
            kind: "notFound",
            message: NOT_FOUND_MESSAGE,
        });
    });

    it("403은 남의 글, 서버 문구를 그대로 쓴다", () => {
        expect(classifyEntryError({ status: 403, message: "해당 감정글에 대한 접근 권한이 없어요." })).toEqual({
            kind: "forbidden",
            message: "해당 감정글에 대한 접근 권한이 없어요.",
        });
    });

    it.each([[500], [0], [null], [undefined], [401]])("그 외(status %s)는 다시 시도하게 하는 오류다", (status) => {
        expect(classifyEntryError({ status, message: "서버에 오류가 발생했어요." }).kind).toBe("error");
    });

    it("문구가 비어 있으면 기본 문구를 쓴다", () => {
        expect(classifyEntryError({ status: 500, message: "" }).message).toBe("불러오지 못했어요.");
        expect(classifyEntryError({ status: 404 }).message).toBe("불러오지 못했어요.");
    });
});

describe("resolveEntryView", () => {
    it("원문 카드에 쓸 값으로 바꾼다(날짜는 점으로 구분)", () => {
        expect(resolveEntryView({ id: 3, memberId: 7, content: "오늘은 좋았다.", entryDate: "2026-10-12" })).toEqual({
            name: "ready",
            entry: { dateText: "2026.10.12", content: "오늘은 좋았다." },
        });
    });

    it("본문의 줄바꿈과 공백은 그대로 둔다(화면이 pre-wrap으로 보여줌)", () => {
        const content = "첫 줄\n\n  둘째 줄";
        expect(resolveEntryView({ content, entryDate: "2026-10-12" }).entry.content).toBe(content);
    });

    it("날짜 형식이 틀리면 날짜 문구만 비운다", () => {
        expect(resolveEntryView({ content: "글", entryDate: "어제" }).entry.dateText).toBe("");
    });

    it.each([
        ["null", null],
        ["undefined", undefined],
        ["본문 없음", { id: 1 }],
        ["본문이 문자열이 아님", { content: 3 }],
    ])("%s는 invalid다", (_, entry) => {
        expect(resolveEntryView(entry)).toEqual({ name: "invalid" });
    });
});

describe("splitKeywords", () => {
    it("쉼표로 나누고 앞뒤 공백을 지운다", () => {
        expect(splitKeywords("불안, 기대 ,막막함")).toEqual(["불안", "기대", "막막함"]);
    });

    it("전각 쉼표도 나눈다", () => {
        expect(splitKeywords("불안，기대")).toEqual(["불안", "기대"]);
    });

    it("빈 조각과 중복은 정리한다", () => {
        expect(splitKeywords("불안,, 불안 ,기대,")).toEqual(["불안", "기대"]);
    });

    it.each([null, undefined, "", "  ", ",,", 3, ["불안"]])("키워드가 없거나 문자열이 아니면(%s) 빈 배열이다", (value) => {
        expect(splitKeywords(value)).toEqual([]);
    });
});

describe("resolveAnalysisView", () => {
    const success = {
        entryId: 3,
        status: "SUCCESS",
        reason: null,
        emotionDetected: " 불안 ",
        keywords: "불안, 기대",
        insightSummary: "인사이트",
        flowHint: "불안 → 기대",
        emotionSummary: "요약",
        emotionScore: 40,
        warmMessages: ["하나", "둘", "셋"],
    };

    it("404(처리 중)는 processing이다", () => {
        expect(resolveAnalysisView({ kind: "processing" })).toEqual({ name: "processing" });
    });

    it("SUCCESS는 카드에 쓸 값으로 정리한다", () => {
        expect(resolveAnalysisView({ kind: "ready", analysis: success })).toEqual({
            name: "ready",
            analysis: {
                emotion: "불안",
                keywords: ["불안", "기대"],
                emotionSummary: "요약",
                flowHint: "불안 → 기대",
                warmMessages: ["하나", "둘", "셋"],
                insightSummary: "인사이트",
            },
        });
    });

    it("SUCCESS여도 비어 있는 값은 null·빈 배열이라 그 카드를 그리지 않는다", () => {
        const view = resolveAnalysisView({
            kind: "ready",
            analysis: {
                status: "SUCCESS",
                emotionDetected: "",
                keywords: null,
                emotionSummary: "   ",
                flowHint: undefined,
                warmMessages: null,
                insightSummary: 5,
            },
        });
        expect(view.analysis).toEqual({
            emotion: null,
            keywords: [],
            emotionSummary: null,
            flowHint: null,
            warmMessages: [],
            insightSummary: null,
        });
    });

    it("warmMessages에서 문자열이 아니거나 빈 항목은 걸러낸다", () => {
        const view = resolveAnalysisView({
            kind: "ready",
            analysis: { ...success, warmMessages: ["하나", "", "  ", null, 3, "둘"] },
        });
        expect(view.analysis.warmMessages).toEqual(["하나", "둘"]);
    });

    it("FAILED는 서버의 reason을 보여주고, 카드를 그리지 않는다(나머지 필드가 전부 null이어도 안전)", () => {
        const failed = {
            status: "FAILED",
            reason: "감정 분석에 실패했어요.",
            emotionDetected: null,
            keywords: null,
            warmMessages: null,
        };
        expect(resolveAnalysisView({ kind: "ready", analysis: failed })).toEqual({
            name: "failed",
            reason: "감정 분석에 실패했어요.",
        });
    });

    it("FAILED인데 reason이 비어 있으면 기본 문구를 쓴다", () => {
        expect(resolveAnalysisView({ kind: "ready", analysis: { status: "FAILED", reason: null } })).toEqual({
            name: "failed",
            reason: FAILED_DEFAULT_REASON,
        });
    });

    it.each([
        ["알려지지 않은 status", { kind: "ready", analysis: { status: "PROCESSING" } }],
        ["소문자 status(계약 위반)", { kind: "ready", analysis: { status: "success" } }],
        ["status 없음", { kind: "ready", analysis: {} }],
        ["분석 본문이 null", { kind: "ready", analysis: null }],
        ["알 수 없는 kind", { kind: "other" }],
        ["null", null],
        ["undefined", undefined],
    ])("%s는 invalid로 fail-closed한다", (_, result) => {
        expect(resolveAnalysisView(result)).toEqual({ name: "invalid" });
    });
});

describe("describeAnalysisHint", () => {
    // 문구는 화면을 보며 다듬는 부분이라 정확한 말이 아니라 "어떤 상태가 어떤 안내가 되는가"를 확인한다(문구는 ANALYSIS_HINTS 한 곳)
    it("조회 중이면 불러오는 중 안내다", () => {
        expect(describeAnalysisHint("loading", null)).toBe(ANALYSIS_HINTS.loading);
    });

    it("조회 오류면 오류 안내다(분석 결과가 있어도 오류가 우선)", () => {
        expect(describeAnalysisHint("error", null)).toBe(ANALYSIS_HINTS.error);
        expect(describeAnalysisHint("error", { name: "ready" })).toBe(ANALYSIS_HINTS.error);
    });

    it.each([
        ["처리 중", { name: "processing" }, "processing"],
        ["FAILED", { name: "failed", reason: "x" }, "failed"],
        ["성공", { name: "ready" }, "ready"],
        ["계약 위반", { name: "invalid" }, "invalid"],
    ])("조회가 끝난 뒤 %s면 그 상태의 안내다", (_, view, key) => {
        expect(describeAnalysisHint("ready", view)).toBe(ANALYSIS_HINTS[key]);
    });

    it("결과를 알 수 없으면(null·모르는 이름) 계약 위반 안내다", () => {
        expect(describeAnalysisHint("ready", null)).toBe(ANALYSIS_HINTS.invalid);
        expect(describeAnalysisHint("ready", { name: "other" })).toBe(ANALYSIS_HINTS.invalid);
    });

    it("모든 상태의 안내가 비어 있지 않고 서로 다르다(같은 말이면 접힌 머리글만 봐서는 상태를 구별할 수 없음)", () => {
        const texts = Object.values(ANALYSIS_HINTS);
        expect(texts.every((text) => typeof text === "string" && text.trim() !== "")).toBe(true);
        expect(new Set(texts).size).toBe(texts.length);
    });

    it("상태별 안내가 정확히 여섯 가지다", () => {
        expect(Object.keys(ANALYSIS_HINTS).sort()).toEqual(["error", "failed", "invalid", "loading", "processing", "ready"]);
    });
});

describe("previewKeywords", () => {
    it("앞에서 두 개만 돌려준다(나머지 개수는 알리지 않음)", () => {
        expect(previewKeywords(["불안", "기대", "막막함", "설렘"])).toEqual(["불안", "기대"]);
    });

    it("기본 개수는 2개다", () => {
        expect(KEYWORD_PREVIEW_COUNT).toBe(2);
    });

    it("두 개 이하면 전부 돌려준다", () => {
        expect(previewKeywords(["불안", "기대"])).toEqual(["불안", "기대"]);
        expect(previewKeywords(["불안"])).toEqual(["불안"]);
    });

    it("개수를 바꿀 수 있다", () => {
        expect(previewKeywords(["a", "b", "c", "d"], 3)).toEqual(["a", "b", "c"]);
    });

    it.each([[[]], [null], [undefined], ["불안"], [{}]])("키워드가 없거나 배열이 아니면(%s) 빈 배열이다", (value) => {
        expect(previewKeywords(value)).toEqual([]);
    });

    it("받은 배열을 바꾸지 않는다", () => {
        const keywords = ["a", "b", "c"];
        previewKeywords(keywords);
        expect(keywords).toEqual(["a", "b", "c"]);
    });
});
