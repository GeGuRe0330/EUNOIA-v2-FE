import { beforeEach, describe, expect, it } from "vitest";
import { applyProfileOverride, writeProfileOverride, readProfileOverride } from "./profileOverride";
import {
    blobToDataUrl,
    clearMockProfileImage,
    isMockProfileImageId,
    readMockProfileImageUrl,
    saveMockProfileImage,
} from "./profileImages";
import { profileImageUrl } from "../../utils/profileImage";

beforeEach(() => sessionStorage.clear());

describe("더미 프로필 이미지 저장", () => {
    it("저장하면 mock- id를 돌려주고 그 id로 이미지를 읽는다", () => {
        const id = saveMockProfileImage("data:image/jpeg;base64,AAAA");
        expect(isMockProfileImageId(id)).toBe(true);
        expect(readMockProfileImageUrl(id)).toBe("data:image/jpeg;base64,AAAA");
    });

    it("새로 저장하면 이전 id는 더 이상 읽히지 않는다(실제 서버의 '옛 UUID는 404'와 같음)", () => {
        const first = saveMockProfileImage("data:a");
        const second = saveMockProfileImage("data:b");
        expect(second).not.toBe(first);
        expect(readMockProfileImageUrl(first)).toBeNull();
        expect(readMockProfileImageUrl(second)).toBe("data:b");
    });

    it("지우면 읽히지 않는다", () => {
        const id = saveMockProfileImage("data:a");
        clearMockProfileImage();
        expect(readMockProfileImageUrl(id)).toBeNull();
    });

    it("저장값이 깨져 있어도 예외 없이 없는 것으로 본다", () => {
        sessionStorage.setItem("eunoia:mock:profile-image", "{깨짐");
        expect(readMockProfileImageUrl("mock-x")).toBeNull();
        sessionStorage.setItem("eunoia:mock:profile-image", JSON.stringify({ id: "real-uuid", dataUrl: "data:a" }));
        expect(readMockProfileImageUrl("real-uuid")).toBeNull();
    });

    it("isMockProfileImageId는 mock- 접두어 문자열만 인정한다", () => {
        expect(isMockProfileImageId("mock-1")).toBe(true);
        expect(isMockProfileImageId("3f1c2d9e-aaaa")).toBe(false);
        expect(isMockProfileImageId(null)).toBe(false);
        expect(isMockProfileImageId(123)).toBe(false);
    });

    it("Blob을 data URL로 바꾼다", async () => {
        const url = await blobToDataUrl(new Blob(["hi"], { type: "image/jpeg" }));
        expect(url.startsWith("data:image/jpeg;base64,")).toBe(true);
    });
});

describe("profileImageUrl", () => {
    it("없거나 문자열이 아니면 null", () => {
        expect(profileImageUrl(null)).toBeNull();
        expect(profileImageUrl(undefined)).toBeNull();
        expect(profileImageUrl("")).toBeNull();
        expect(profileImageUrl(5)).toBeNull();
    });

    it("실제 UUID는 본인 이미지 API 주소(인코딩됨)", () => {
        expect(profileImageUrl("3f1c-uuid")).toBe("/api/v1/members/me/profile-image/3f1c-uuid");
        expect(profileImageUrl("a/b")).toBe("/api/v1/members/me/profile-image/a%2Fb");
    });
});

describe("profileImageId 덧씌움", () => {
    const me = { id: 1, nickname: "개구리", gender: "MALE", profileImageId: "server-uuid" };

    it("저장한 id가 서버 값을 덮는다", () => {
        writeProfileOverride({ profileImageId: "mock-1" });
        expect(applyProfileOverride(me).profileImageId).toBe("mock-1");
    });

    it("null(기본 이미지로 되돌림)도 서버 값을 덮는다", () => {
        writeProfileOverride({ profileImageId: null });
        expect(readProfileOverride()).toEqual({ profileImageId: null });
        expect(applyProfileOverride(me).profileImageId).toBeNull();
    });

    it("다른 프로필 값을 저장해도 이미지 id는 유지된다", () => {
        writeProfileOverride({ profileImageId: "mock-1" });
        writeProfileOverride({ nickname: "두꺼비" });
        expect(readProfileOverride()).toEqual({ profileImageId: "mock-1", nickname: "두꺼비" });
    });

    it("빈 문자열·숫자 등 모양이 틀린 값은 버린다", () => {
        writeProfileOverride({ profileImageId: "  " });
        writeProfileOverride({ profileImageId: 5 });
        expect(readProfileOverride()).toEqual({});
    });
});
