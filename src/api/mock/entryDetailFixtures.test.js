import { describe, expect, it } from "vitest";
import { buildAllEntries } from "./entryListFixtures";
import { buildMockEntryDetail, buildMockAnalysis } from "./entryDetailFixtures";
import { resolveAnalysisView, resolveEntryView } from "../../pages/entries/entryDetailView";

// 더미 글의 상세·분석이 실제 화면 로직(resolveEntryView·resolveAnalysisView)을 그대로 통과하는지 — 더미가 화면이 기대하는 모양을 어기면 안 됨
const now = new Date("2026-10-25T12:00:00");
const all = buildAllEntries(now);

describe("더미 글의 상세·분석", () => {
    it("상세는 실제 응답 모양이고 화면 로직이 읽을 수 있다", () => {
        const detail = buildMockEntryDetail(all[0]);
        expect(detail).toEqual({ id: all[0].id, memberId: 1, content: all[0].content, entryDate: all[0].entryDate });
        expect(resolveEntryView(detail).name).toBe("ready");
    });

    it("감정이 있는 글은 성공 분석이고 화면 로직이 모든 카드를 그릴 수 있다", () => {
        const entry = all.find((e) => e.emotionDetected !== null);
        const view = resolveAnalysisView({ kind: "ready", analysis: buildMockAnalysis(entry) });

        expect(view.name).toBe("ready");
        expect(view.analysis.emotion).toBe(entry.emotionDetected);
        expect(view.analysis.keywords.length).toBeGreaterThan(0);
        expect(view.analysis.emotionSummary).toBeTruthy();
        expect(view.analysis.flowHint).toContain("→");
        expect(view.analysis.warmMessages).toHaveLength(3);
        expect(view.analysis.insightSummary).toBeTruthy();
    });

    it("감정이 없는 글은 id에 따라 FAILED(짝수)이거나 처리 중(홀수, 서버라면 404)이다", () => {
        const noEmotion = all.filter((e) => e.emotionDetected === null);
        const even = noEmotion.find((e) => e.id % 2 === 0);
        const odd = noEmotion.find((e) => e.id % 2 !== 0);
        expect(even && odd).toBeTruthy(); // 더미에 두 경우가 모두 있어 화면에서 실제로 볼 수 있다

        const failed = resolveAnalysisView({ kind: "ready", analysis: buildMockAnalysis(even) });
        expect(failed).toEqual({ name: "failed", reason: "감정 분석에 실패했어요." });

        expect(buildMockAnalysis(odd)).toBeNull();
        expect(resolveAnalysisView({ kind: "processing" }).name).toBe("processing");
    });

    it("성공·실패·처리 중이 더미 목록 안에 모두 있다", () => {
        const kinds = new Set(
            all.map((e) => {
                if (e.emotionDetected !== null) return "success";
                return buildMockAnalysis(e) === null ? "processing" : "failed";
            })
        );
        expect(kinds).toEqual(new Set(["success", "failed", "processing"]));
    });
});
