import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/authApi", () => ({ getMe: vi.fn() }));

import { getMe } from "../api/authApi";
import { requireAuth } from "./requireAuth";

beforeEach(() => {
    vi.mocked(getMe).mockReset();
});

describe("requireAuth", () => {
    it("세션이 유효하면 내 정보를 반환한다 (Layout이 useLoaderData로 사용)", async () => {
        const me = { id: 1, email: "a@b.c", nickname: "n", role: "USER" };
        vi.mocked(getMe).mockResolvedValue(me);

        await expect(requireAuth()).resolves.toEqual(me);
    });

    it("401이면 /login으로 redirect한다", async () => {
        vi.mocked(getMe).mockRejectedValue({ status: 401, message: "로그인이 필요해요.", fieldErrors: [] });

        const result = await requireAuth();

        expect(result).toBeInstanceOf(Response);
        expect(result.status).toBe(302);
        expect(result.headers.get("Location")).toBe("/login");
    });

    it.each([
        ["서버 오류(500)", { status: 500, message: "요청 중 오류가 발생했어요.", fieldErrors: [] }],
        ["네트워크 단절(0)", { status: 0, message: "서버에 연결할 수 없어요.", fieldErrors: [] }],
    ])("%s는 로그인 여부를 판단할 수 없으므로 redirect하지 않고 그대로 throw한다", async (_, error) => {
        vi.mocked(getMe).mockRejectedValue(error);

        await expect(requireAuth()).rejects.toBe(error);
    });
});
