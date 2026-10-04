import { beforeEach, describe, expect, it, vi } from "vitest";

// 실제 호출 함수가 올바른 메서드·경로·쿼리·바디로 요청하고 봉투에서 data만 꺼내는지 확인한다 — axios 인스턴스(api)와 getMe만 가짜로 대체
vi.mock("./defaultApi", () => ({
    api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
    unwrap: (res) => res.data.data,
}));
vi.mock("./authApi", () => ({ getMe: vi.fn() }));

import { api } from "./defaultApi";
import { getMe } from "./authApi";
import {
    getMyProfile,
    getMyRecordSummary,
    getEmotionCalendar,
    getEmotionEntries,
    getRecentEntries,
    getEmotionEntry,
    getAnalysisByEntry,
    deleteEmotionEntry,
    updateMyProfile,
    changeMyPassword,
    uploadProfileImage,
    deleteProfileImage,
} from "./EunoiaApi";

const ok = (data) => ({ data: { success: true, data, error: null } });

beforeEach(() => {
    for (const fn of Object.values(api)) fn.mockReset();
    vi.mocked(getMe).mockReset();
});

describe("getMyProfile", () => {
    it("GET /members/me(getMe)의 응답을 그대로 돌려준다 — createdAt·profileImageId는 서버가 준다", async () => {
        const me = { id: 7, nickname: "개구리", createdAt: "2026-08-15T10:30:00.123456", profileImageId: null };
        vi.mocked(getMe).mockResolvedValue(me);

        await expect(getMyProfile()).resolves.toBe(me);
    });

    it("오류는 그대로 던진다", async () => {
        vi.mocked(getMe).mockRejectedValue({ status: 401, message: "로그인이 필요해요.", fieldErrors: [] });
        await expect(getMyProfile()).rejects.toMatchObject({ status: 401 });
    });
});

describe("getMyRecordSummary", () => {
    it("GET /emotion-entries/summary의 data를 돌려준다", async () => {
        api.get.mockResolvedValue(ok({ totalEntryCount: 12, monthEntryCount: 3 }));

        await expect(getMyRecordSummary()).resolves.toEqual({ totalEntryCount: 12, monthEntryCount: 3 });
        expect(api.get).toHaveBeenCalledWith("/emotion-entries/summary");
    });
});

describe("getEmotionCalendar", () => {
    it("GET /emotion-entries/calendar?yearMonth=", async () => {
        const body = { yearMonth: "2026-10", days: [{ date: "2026-10-02", entryCount: 2, averageScore: 36.5 }] };
        api.get.mockResolvedValue(ok(body));

        await expect(getEmotionCalendar("2026-10")).resolves.toEqual(body);
        expect(api.get).toHaveBeenCalledWith("/emotion-entries/calendar", { params: { yearMonth: "2026-10" } });
    });
});

describe("getEmotionEntries", () => {
    const page = { items: [], page: 0, size: 10, hasNext: false };

    beforeEach(() => api.get.mockResolvedValue(ok(page)));

    it("GET /emotion-entries에 기간·페이지·크기를 쿼리로 보내고 페이지 객체를 돌려준다", async () => {
        await expect(getEmotionEntries({ from: "2026-10-01", to: "2026-10-12", page: 2, size: 20 })).resolves.toBe(page);
        expect(api.get).toHaveBeenCalledWith("/emotion-entries", {
            params: { from: "2026-10-01", to: "2026-10-12", page: 2, size: 20 },
        });
    });

    it("기본값은 0페이지·10개", async () => {
        await getEmotionEntries();
        expect(api.get).toHaveBeenCalledWith("/emotion-entries", { params: { page: 0, size: 10 } });
    });

    it("비어 있는 from·to는 보내지 않는다 — 빈 문자열이나 null이 가면 서버가 날짜 형식 오류(400)로 처리", async () => {
        await getEmotionEntries({ from: "", to: null, page: 0, size: 10 });
        expect(api.get).toHaveBeenCalledWith("/emotion-entries", { params: { page: 0, size: 10 } });

        await getEmotionEntries({ from: undefined, to: "2026-10-12" });
        expect(api.get).toHaveBeenLastCalledWith("/emotion-entries", { params: { to: "2026-10-12", page: 0, size: 10 } });
    });

    it("페이지 0은 보낸다(0도 값이다)", async () => {
        await getEmotionEntries({ page: 0 });
        expect(api.get.mock.calls[0][1].params.page).toBe(0);
    });
});

describe("getRecentEntries", () => {
    it("/recent가 없으므로 목록(page 0, size=limit)의 items를 돌려준다", async () => {
        const items = [{ id: 84, entryDate: "2026-10-25", content: "…", emotionDetected: null }];
        api.get.mockResolvedValue(ok({ items, page: 0, size: 5, hasNext: true }));

        await expect(getRecentEntries(5)).resolves.toBe(items);
        expect(api.get).toHaveBeenCalledWith("/emotion-entries", { params: { page: 0, size: 5 } });
    });

    it("limit을 생략하면 5개", async () => {
        api.get.mockResolvedValue(ok({ items: [], page: 0, size: 5, hasNext: false }));
        await getRecentEntries();
        expect(api.get.mock.calls[0][1].params.size).toBe(5);
    });

    it("글이 없으면 빈 배열", async () => {
        api.get.mockResolvedValue(ok({ items: [], page: 0, size: 5, hasNext: false }));
        await expect(getRecentEntries()).resolves.toEqual([]);
    });
});

describe("getEmotionEntry·getAnalysisByEntry", () => {
    it("단건 조회 GET /emotion-entries/{id}", async () => {
        api.get.mockResolvedValue(ok({ id: 1, content: "…" }));
        await expect(getEmotionEntry(1)).resolves.toEqual({ id: 1, content: "…" });
        expect(api.get).toHaveBeenCalledWith("/emotion-entries/1");
    });

    it("분석 조회 GET /analyses/by-entry/{id}", async () => {
        api.get.mockResolvedValue(ok({ status: "SUCCESS" }));
        await expect(getAnalysisByEntry(1)).resolves.toEqual({ status: "SUCCESS" });
        expect(api.get).toHaveBeenCalledWith("/analyses/by-entry/1");
    });

    it("더미 글 id(900001~)도 이제 서버로 간다 — 더미 분기가 없다", async () => {
        api.get.mockResolvedValue(ok({ id: 900001 }));
        await getEmotionEntry(900001);
        await getAnalysisByEntry(900001);
        expect(api.get).toHaveBeenCalledWith("/emotion-entries/900001");
        expect(api.get).toHaveBeenCalledWith("/analyses/by-entry/900001");
    });

    it("서버 오류(404 등)는 그대로 던진다", async () => {
        api.get.mockRejectedValue({ status: 404, message: "존재하지 않는 감정글이에요.", fieldErrors: [] });
        await expect(getEmotionEntry(5)).rejects.toMatchObject({ status: 404, message: "존재하지 않는 감정글이에요." });
    });
});

describe("deleteEmotionEntry", () => {
    it("DELETE /emotion-entries/{id}, 바디 없는 성공은 null", async () => {
        api.delete.mockResolvedValue(ok(null));
        await expect(deleteEmotionEntry(84)).resolves.toBeNull();
        expect(api.delete).toHaveBeenCalledWith("/emotion-entries/84");
    });

    it("이미 지운 글의 404는 그대로 던진다(호출한 쪽이 '이미 지워진 글'로 다룸)", async () => {
        api.delete.mockRejectedValue({ status: 404, message: "존재하지 않는 감정글이에요.", fieldErrors: [] });
        await expect(deleteEmotionEntry(84)).rejects.toMatchObject({ status: 404 });
    });
});

describe("updateMyProfile", () => {
    it("PATCH /members/me에 닉네임·성별·나이 세 필드만 보내고 갱신된 회원 정보를 돌려준다", async () => {
        const updated = { id: 7, nickname: "두꺼비", gender: "FEMALE", age: 30 };
        api.patch.mockResolvedValue(ok(updated));

        await expect(updateMyProfile({ nickname: "두꺼비", gender: "FEMALE", age: 30, extra: "무시" })).resolves.toBe(updated);
        expect(api.patch).toHaveBeenCalledWith("/members/me", { nickname: "두꺼비", gender: "FEMALE", age: 30 });
    });

    it("서버의 필드 오류(fieldErrors)는 그대로 던진다", async () => {
        const error = { status: 400, message: "잘못된 요청이에요.", fieldErrors: [{ field: "age", message: "x" }] };
        api.patch.mockRejectedValue(error);
        await expect(updateMyProfile({ nickname: "a", gender: "NONE", age: -1 })).rejects.toBe(error);
    });
});

describe("changeMyPassword", () => {
    it("PUT /members/me/password에 현재·새 비밀번호만 보낸다(확인 칸은 서버에 보내지 않음)", async () => {
        api.put.mockResolvedValue(ok(null));

        await expect(
            changeMyPassword({ currentPassword: "oldpw", newPassword: "newpw", newPasswordConfirm: "newpw" })
        ).resolves.toBeNull();
        expect(api.put).toHaveBeenCalledWith("/members/me/password", { currentPassword: "oldpw", newPassword: "newpw" });
    });

    it("현재 비밀번호 불일치(400)는 그대로 던진다", async () => {
        api.put.mockRejectedValue({ status: 400, message: "지금 쓰는 비밀번호가 맞지 않아요.", fieldErrors: [] });
        await expect(changeMyPassword({ currentPassword: "x", newPassword: "yyyy" })).rejects.toMatchObject({ status: 400 });
    });
});

describe("프로필 이미지", () => {
    it("업로드는 PUT /members/me/profile-image에 FormData(파트 이름 file)로 보낸다", async () => {
        const updated = { id: 7, profileImageId: "3f1c2d9e-5a4b-4c1d-9e0f-1a2b3c4d5e6f" };
        api.put.mockResolvedValue(ok(updated));
        const blob = new Blob(["jpeg"], { type: "image/jpeg" });

        await expect(uploadProfileImage(blob)).resolves.toBe(updated);

        const [url, body] = api.put.mock.calls[0];
        expect(url).toBe("/members/me/profile-image");
        expect(body).toBeInstanceOf(FormData);
        expect([...body.keys()]).toEqual(["file"]);
        expect(body.get("file")).toBeInstanceOf(Blob);
        expect(body.get("file").type).toBe("image/jpeg");
    });

    it("Content-Type 헤더를 직접 지정하지 않는다 — boundary는 브라우저가 만들어야 한다", async () => {
        api.put.mockResolvedValue(ok({}));
        await uploadProfileImage(new Blob(["jpeg"], { type: "image/jpeg" }));

        const config = api.put.mock.calls[0][2];
        const headers = Object.keys(config?.headers ?? {}).map((name) => name.toLowerCase());
        expect(headers).not.toContain("content-type");
    });

    it("업로드 실패(400 올릴 수 없는 사진)는 그대로 던진다", async () => {
        api.put.mockRejectedValue({ status: 400, message: "올릴 수 없는 사진이에요.", fieldErrors: [] });
        await expect(uploadProfileImage(new Blob(["x"]))).rejects.toMatchObject({ message: "올릴 수 없는 사진이에요." });
    });

    it("되돌리기는 DELETE /members/me/profile-image, 갱신된 회원 정보를 돌려준다", async () => {
        api.delete.mockResolvedValue(ok({ id: 7, profileImageId: null }));
        await expect(deleteProfileImage()).resolves.toEqual({ id: 7, profileImageId: null });
        expect(api.delete).toHaveBeenCalledWith("/members/me/profile-image");
    });
});
