import { describe, expect, it } from "vitest";
import { resolveDashboardView } from "./dashboardView";

describe("resolveDashboardView", () => {
    it("분석이 하나도 없으면(data: null) 에러가 아니라 빈 상태", () => {
        expect(resolveDashboardView(null)).toEqual({ name: "empty" });
    });

    it("응답이 아직 없는 상태(undefined)도 빈 상태로 다룬다", () => {
        expect(resolveDashboardView(undefined)).toEqual({ name: "empty" });
    });

    it("가장 최근 분석이 FAILED면 서버 reason을 그대로 담은 실패 상태 — 나머지 필드가 null이어도 카드로 가지 않는다", () => {
        const latest = {
            entryId: 1,
            status: "FAILED",
            reason: "감정 분석에 실패했어요.",
            emotionSummary: null,
            flowHint: null,
            insightSummary: null,
            warmMessages: null,
        };

        expect(resolveDashboardView(latest)).toEqual({ name: "failed", reason: "감정 분석에 실패했어요." });
    });

    it("SUCCESS는 분석을 그대로 담은 ready 상태", () => {
        const latest = { entryId: 4, status: "SUCCESS", warmMessages: ["a", "b", "c"], emotionScore: 68 };

        expect(resolveDashboardView(latest)).toEqual({ name: "ready", analysis: latest });
    });

    it("FAILED가 아니면(status 없음 포함) 기존 카드 대상으로 본다", () => {
        expect(resolveDashboardView({ entryId: 9 }).name).toBe("ready");
    });
});
