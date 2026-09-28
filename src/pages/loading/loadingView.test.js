import { describe, expect, it } from "vitest";
import { resolveLoadingView } from "./loadingView";

describe("resolveLoadingView", () => {
    it("SUCCESS는 따뜻한 말을 순서대로 보여주는 상태가 된다", () => {
        const analysis = { status: "SUCCESS", warmMessages: ["하나", "둘", "셋"] };

        expect(resolveLoadingView({ kind: "success", analysis })).toEqual({
            name: "messages",
            messages: ["하나", "둘", "셋"],
        });
    });

    it.each([
        ["null", null],
        ["빈 배열", []],
        ["빈 문자열뿐", ["", ""]],
    ])("SUCCESS인데 보여줄 메시지가 없으면(%s) 멈추지 않고 바로 대시보드로(done)", (_, warmMessages) => {
        expect(resolveLoadingView({ kind: "success", analysis: { status: "SUCCESS", warmMessages } })).toEqual({
            name: "done",
        });
    });

    it("빈 문자열 메시지는 걸러낸다", () => {
        const analysis = { status: "SUCCESS", warmMessages: ["하나", "", "셋"] };

        expect(resolveLoadingView({ kind: "success", analysis }).messages).toEqual(["하나", "셋"]);
    });

    it("FAILED는 서버가 준 reason을 그대로 담는다", () => {
        const analysis = { status: "FAILED", reason: "감정 분석에 실패했어요.", warmMessages: null };

        expect(resolveLoadingView({ kind: "failed", analysis })).toEqual({
            name: "failed",
            reason: "감정 분석에 실패했어요.",
        });
    });

    it("timeout은 실패와 다른 상태다", () => {
        expect(resolveLoadingView({ kind: "timeout" })).toEqual({ name: "timeout" });
    });

    it("취소는 cancelled — 화면이 아무것도 하지 않게 구분한다", () => {
        expect(resolveLoadingView({ kind: "cancelled" })).toEqual({ name: "cancelled" });
    });
});
