import { describe, expect, it } from "vitest";
import {
    resolveGateStatus,
    isUsableGenerateResult,
    isSameResult,
    isGenerating,
    resolveGenerationOutcome,
    GENERATE_FAILED_MESSAGE,
    GENERATE_UNKNOWN_MESSAGE,
    formatDate,
    formatDateTime,
    excerptHistoryTitle,
} from "./metaView";

describe("resolveGateStatus", () => {
    it.each(["PREPARING", "READY"])("알려진 status(%s)는 그대로 인정한다", (status) => {
        expect(resolveGateStatus({ status })).toBe(status);
    });

    it.each([
        ["null", null],
        ["undefined", undefined],
        ["빈 객체", {}],
        ["알려지지 않은 status", { status: "PROCESSING" }],
        ["소문자(계약 위반)", { status: "ready" }],
    ])("%s는 UNKNOWN으로 fail-closed한다", (_, data) => {
        expect(resolveGateStatus(data)).toBe("UNKNOWN");
    });
});

describe("isUsableGenerateResult", () => {
    it("READY + content가 있으면 사용 가능하다", () => {
        expect(isUsableGenerateResult({ status: "READY", content: { outer: {} } })).toBe(true);
    });

    it("READY인데 content가 없으면(드문 방어 케이스) 사용 불가", () => {
        expect(isUsableGenerateResult({ status: "READY", content: null })).toBe(false);
    });

    it("PREPARING이면 content가 있어도 사용 불가", () => {
        expect(isUsableGenerateResult({ status: "PREPARING", content: { outer: {} } })).toBe(false);
    });

    it("알려지지 않은 status면 사용 불가", () => {
        expect(isUsableGenerateResult({ status: "WEIRD", content: { outer: {} } })).toBe(false);
    });
});

describe("isSameResult", () => {
    it("updatedAt이 같으면 재생성 가드로 이전 결과가 그대로 온 것", () => {
        const previous = { updatedAt: "2026-09-27T10:00:00" };
        const updated = { updatedAt: "2026-09-27T10:00:00" };
        expect(isSameResult(previous, updated)).toBe(true);
    });

    it("updatedAt이 다르면 새로 생성된 것", () => {
        const previous = { updatedAt: "2026-09-27T10:00:00" };
        const updated = { updatedAt: "2026-09-28T09:00:00" };
        expect(isSameResult(previous, updated)).toBe(false);
    });

    it.each([
        ["이전 결과가 없음(첫 생성)", null, { updatedAt: "2026-09-27T10:00:00" }],
        ["이전 updatedAt이 없음", {}, { updatedAt: "2026-09-27T10:00:00" }],
        ["새 updatedAt이 없음(방어)", { updatedAt: "2026-09-27T10:00:00" }, {}],
    ])("%s는 같다고 보지 않는다", (_, previous, updated) => {
        expect(isSameResult(previous, updated)).toBe(false);
    });
});

describe("formatDate", () => {
    it("YYYY-MM-DD를 YYYY.MM.DD로 바꾼다", () => {
        expect(formatDate("2026-09-27")).toBe("2026.09.27");
    });

    it("값이 없으면 빈 문자열", () => {
        expect(formatDate(null)).toBe("");
        expect(formatDate(undefined)).toBe("");
        expect(formatDate("")).toBe("");
    });

    it("날짜 문자열을 그대로 자르므로 타임존에 따라 하루가 밀리지 않는다", () => {
        const env = globalThis.process.env;
        const original = env.TZ;
        env.TZ = "America/Los_Angeles"; // UTC보다 늦은 시간대
        try {
            // Date를 거치면 UTC 자정이 로컬로 하루 전이 됨 — 이 테스트가 공허하지 않다는 확인(시간대가 실제로 바뀌었는지)
            expect(new Date("2026-09-27").getDate()).toBe(26);
            expect(formatDate("2026-09-27")).toBe("2026.09.27");
        } finally {
            if (original === undefined) delete env.TZ;
            else env.TZ = original;
        }
    });
});

describe("formatDateTime", () => {
    it("LocalDateTime 문자열을 YYYY.MM.DD HH:mm으로 바꾼다", () => {
        expect(formatDateTime("2026-09-27T10:15:30.123456")).toBe("2026.09.27 10:15");
    });

    it("초 단위가 없어도 동작한다", () => {
        expect(formatDateTime("2026-09-27T10:15")).toBe("2026.09.27 10:15");
    });

    it("시간 부분이 없으면 날짜만", () => {
        expect(formatDateTime("2026-09-27")).toBe("2026.09.27");
    });

    it("값이 없으면 빈 문자열", () => {
        expect(formatDateTime(null)).toBe("");
        expect(formatDateTime(undefined)).toBe("");
    });
});

describe("excerptHistoryTitle", () => {
    it("summary의 첫 문장만 발췌한다", () => {
        const content = { outer: { summary: "첫 문장이에요. 둘째 문장은 길게 이어져요." } };
        expect(excerptHistoryTitle(content, "fallback")).toBe("첫 문장이에요.");
    });

    it("문장 부호가 없으면 전체를 하나의 문장으로 본다", () => {
        const content = { outer: { summary: "마침표 없이 쭉 이어지는 요약" } };
        expect(excerptHistoryTitle(content, "fallback")).toBe("마침표 없이 쭉 이어지는 요약");
    });

    it("첫 문장이 너무 길면 잘라내고 말줄임표를 붙인다", () => {
        const longSentence = "가".repeat(50) + ".";
        const content = { outer: { summary: longSentence } };
        const result = excerptHistoryTitle(content, "fallback");
        expect(result).toBe("가".repeat(40) + "…");
    });

    it.each([
        ["summary가 빈 문자열", { outer: { summary: "" } }],
        ["outer가 없음", {}],
        ["content가 없음", null],
        ["content가 undefined", undefined],
    ])("%s면 fallbackText를 쓴다", (_, content) => {
        expect(excerptHistoryTitle(content, "2026.08.30 ~ 2026.09.28")).toBe("2026.08.30 ~ 2026.09.28");
    });
});

describe("isGenerating", () => {
    it("generationStatus가 PROCESSING일 때만 참이다(status PREPARING/READY와 별개 축)", () => {
        expect(isGenerating({ status: "READY", generationStatus: "PROCESSING" })).toBe(true);
        expect(isGenerating({ status: "READY", generationStatus: "FAILED" })).toBe(false);
        expect(isGenerating({ status: "READY", generationStatus: null })).toBe(false);
        expect(isGenerating({ status: "READY" })).toBe(false);
        expect(isGenerating(null)).toBe(false);
    });
});

describe("resolveGenerationOutcome", () => {
    const content = { outer: { summary: "요약" } };
    const previous = { status: "READY", content, updatedAt: "2026-10-05T10:00:00", generationStatus: null };

    it("새 결과(updatedAt이 다름)면 ready, sameResult false", () => {
        const latest = { status: "READY", content, updatedAt: "2026-10-06T09:00:00", generationStatus: null };
        expect(resolveGenerationOutcome(previous, latest)).toEqual({ name: "ready", sameResult: false });
    });

    it("같은 행이 그대로 돌아오면(updatedAt 동일) ready, sameResult true", () => {
        expect(resolveGenerationOutcome(previous, { ...previous })).toEqual({ name: "ready", sameResult: true });
    });

    it("오늘 첫 생성(이전 결과 없음)도 ready — 같은 결과가 아니다", () => {
        const latest = { status: "READY", content, updatedAt: "2026-10-06T09:00:00", generationStatus: null };
        expect(resolveGenerationOutcome({ status: "READY", content: null, updatedAt: null }, latest)).toEqual({
            name: "ready",
            sameResult: false,
        });
    });

    it("FAILED는 서버 고정 문구를 그대로 담아 failed로 — 이전 결과(content)가 있어도 성공으로 보지 않는다", () => {
        const latest = { ...previous, generationStatus: "FAILED", generationReason: "메타분석 생성에 실패했어요." };
        expect(resolveGenerationOutcome(previous, latest)).toEqual({ name: "failed", message: "메타분석 생성에 실패했어요." });
    });

    it("FAILED인데 문구가 비어 있으면 기본 문구", () => {
        const latest = { ...previous, generationStatus: "FAILED", generationReason: null };
        expect(resolveGenerationOutcome(previous, latest)).toEqual({ name: "failed", message: GENERATE_FAILED_MESSAGE });
    });

    it("READY인데 content가 없으면(생성이 끝났다는데 결과 없음) 계약 위반으로 invalid", () => {
        const latest = { status: "READY", content: null, updatedAt: null, generationStatus: null };
        expect(resolveGenerationOutcome(previous, latest)).toEqual({ name: "invalid", message: GENERATE_FAILED_MESSAGE });
    });

    it.each([
        ["알려지지 않은 status", { status: "SOMETHING", generationStatus: null }],
        ["null", null],
    ])("%s는 invalid(fail-closed)", (_, latest) => {
        expect(resolveGenerationOutcome(previous, latest)).toEqual({ name: "invalid", message: GENERATE_UNKNOWN_MESSAGE });
    });
});
