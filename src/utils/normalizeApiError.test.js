import { describe, expect, it } from "vitest";
import { normalizeApiError } from "./normalizeApiError";

const withResponse = (status, data) => ({ response: { status, data } });

describe("normalizeApiError", () => {
    it("v2 봉투에서 message와 fieldErrors를 꺼낸다", () => {
        const error = withResponse(400, {
            success: false,
            data: null,
            error: { message: "잘못된 요청입니다.", errors: [{ field: "email", message: "형식 오류" }] },
        });

        expect(normalizeApiError(error)).toEqual({
            status: 400,
            message: "잘못된 요청입니다.",
            fieldErrors: [{ field: "email", message: "형식 오류" }],
        });
    });

    it("errors가 null이어도 fieldErrors는 항상 배열이다 (로그인 실패 401)", () => {
        const error = withResponse(401, {
            success: false,
            data: null,
            error: { message: "이메일 또는 비밀번호가 일치하지 않습니다.", errors: null },
        });

        expect(normalizeApiError(error)).toEqual({
            status: 401,
            message: "이메일 또는 비밀번호가 일치하지 않습니다.",
            fieldErrors: [],
        });
    });

    it("바디 없는 401은 기본 문구로 대체한다", () => {
        expect(normalizeApiError(withResponse(401, "")).message).toBe("로그인이 필요해요.");
    });

    it("봉투가 아닌 403(Spring 기본 JSON)은 기본 문구로 대체한다", () => {
        const error = withResponse(403, { timestamp: "t", status: 403, error: "Forbidden", path: "/api/v1/x" });

        expect(normalizeApiError(error).message).toBe("권한이 없거나 요청이 만료됐어요. 새로고침 후 다시 시도해 주세요.");
    });

    it("봉투가 아닌 5xx(프록시 HTML)는 범용 문구로 대체한다", () => {
        expect(normalizeApiError(withResponse(502, "<html>Bad Gateway</html>"))).toEqual({
            status: 502,
            message: "요청 중 오류가 발생했어요.",
            fieldErrors: [],
        });
    });

    it("응답이 없으면(네트워크 단절) status 0과 연결 실패 문구", () => {
        expect(normalizeApiError({ message: "Network Error" })).toEqual({
            status: 0,
            message: "서버에 연결할 수 없어요.",
            fieldErrors: [],
        });
    });
});
