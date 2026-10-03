import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import ProfileAvatar from "./ProfileAvatar";
import { saveMockProfileImage, clearMockProfileImage } from "../../api/mock/profileImages";

// 아바타가 업로드한 이미지를 우선하고, 불러오지 못하면 성별 기본 이미지로 되돌리는지 — 서버가 파일을 잃어도 화면이 깨지면 안 된다
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("ProfileAvatar", () => {
    let container;
    let root;

    const render = (props) => act(() => root.render(createElement(ProfileAvatar, props)));
    const img = () => container.querySelector("img");

    beforeEach(() => {
        sessionStorage.clear();
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
    });

    it("업로드한 이미지가 없으면 성별 기본 이미지를 보여준다(성별마다 다르다)", () => {
        render({ gender: "MALE" });
        const male = img().getAttribute("src");
        render({ gender: "FEMALE" });
        const female = img().getAttribute("src");
        render({ gender: "NONE" });
        const none = img().getAttribute("src");

        expect(new Set([male, female, none]).size).toBe(3);
    });

    it("profileImageId가 null이거나 비어 있으면 기본 이미지다", () => {
        render({ gender: "NONE" });
        const fallback = img().getAttribute("src");

        render({ gender: "NONE", profileImageId: null });
        expect(img().getAttribute("src")).toBe(fallback);
        render({ gender: "NONE", profileImageId: "" });
        expect(img().getAttribute("src")).toBe(fallback);
    });

    it("업로드한 이미지가 있으면 그 주소(본인 이미지 API)를 보여준다", () => {
        render({ gender: "NONE", profileImageId: "3f1c2d9e-aaaa-4bbb-8ccc-0123456789ab" });
        expect(img().getAttribute("src")).toBe("/api/v1/members/me/profile-image/3f1c2d9e-aaaa-4bbb-8ccc-0123456789ab");
    });

    it("이미지를 불러오지 못하면 기본 이미지로 되돌린다", () => {
        render({ gender: "FEMALE" });
        const fallback = img().getAttribute("src");

        render({ gender: "FEMALE", profileImageId: "abc" });
        expect(img().getAttribute("src")).not.toBe(fallback);

        act(() => {
            img().dispatchEvent(new Event("error"));
        });
        expect(img().getAttribute("src")).toBe(fallback);
    });

    it("실패한 id는 다시 시도하지 않지만 새 id가 오면(새로 올림) 다시 시도한다", () => {
        render({ gender: "FEMALE", profileImageId: "old" });
        act(() => {
            img().dispatchEvent(new Event("error"));
        });
        const fallback = img().getAttribute("src");

        render({ gender: "FEMALE", profileImageId: "old" }); // 같은 id로 다시 그려도 기본 이미지 유지
        expect(img().getAttribute("src")).toBe(fallback);

        render({ gender: "FEMALE", profileImageId: "new" });
        expect(img().getAttribute("src")).toBe("/api/v1/members/me/profile-image/new");
    });

    it("업로드 이미지 id가 있어도 기본 이미지의 로드 오류에는 반응하지 않는다(무한 되풀이 방지)", () => {
        render({ gender: "FEMALE" });
        const fallback = img().getAttribute("src");
        act(() => {
            img().dispatchEvent(new Event("error"));
        });
        expect(img().getAttribute("src")).toBe(fallback);
    });

    it("[MOCK] 더미 이미지 id는 저장된 data URL로 그리고, 저장된 것이 없으면 기본 이미지", () => {
        const id = saveMockProfileImage("data:image/jpeg;base64,AAAA");
        render({ gender: "NONE", profileImageId: id });
        expect(img().getAttribute("src")).toBe("data:image/jpeg;base64,AAAA");

        clearMockProfileImage();
        render({ gender: "NONE" });
        const fallback = img().getAttribute("src");
        render({ gender: "NONE", profileImageId: id });
        expect(img().getAttribute("src")).toBe(fallback);
    });
});
