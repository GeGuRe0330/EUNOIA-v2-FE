import { describe, expect, it } from "vitest";
import {
    ACCEPT_ATTRIBUTE,
    ALLOWED_IMAGE_TYPES,
    IMAGE_FILE_ERRORS,
    MAX_IMAGE_BYTES,
    validateImageFile,
} from "./profileImageFile";

const file = (type, size = 1000, name = "photo") => ({ type, size, name });

describe("validateImageFile", () => {
    it.each(ALLOWED_IMAGE_TYPES)("%s는 통과한다", (type) => {
        expect(validateImageFile(file(type))).toEqual({ ok: true });
    });

    it.each(["image/svg+xml", "image/gif", "application/pdf", "text/plain", "image/heic"])("%s는 형식 오류다", (type) => {
        expect(validateImageFile(file(type))).toEqual({ ok: false, reason: "type", message: IMAGE_FILE_ERRORS.type });
    });

    it("정확히 10MB는 통과하고 1바이트라도 넘으면 크기 오류다(경계)", () => {
        expect(validateImageFile(file("image/jpeg", MAX_IMAGE_BYTES)).ok).toBe(true);
        expect(validateImageFile(file("image/jpeg", MAX_IMAGE_BYTES + 1))).toEqual({
            ok: false,
            reason: "size",
            message: IMAGE_FILE_ERRORS.size,
        });
    });

    it("크기가 0인 파일은 비어 있다는 오류다", () => {
        expect(validateImageFile(file("image/png", 0))).toMatchObject({ ok: false, reason: "empty" });
    });

    it("파일이 없으면(선택 취소 등) 비어 있다는 오류다", () => {
        expect(validateImageFile(undefined)).toMatchObject({ ok: false, reason: "empty" });
        expect(validateImageFile(null)).toMatchObject({ ok: false, reason: "empty" });
    });

    it("형식을 비워 주는 환경은 확장자로 판단한다(대소문자 무관)", () => {
        expect(validateImageFile(file("", 1000, "IMG_0001.JPG")).ok).toBe(true);
        expect(validateImageFile(file("", 1000, "a.webp")).ok).toBe(true);
        expect(validateImageFile(file("", 1000, "a.gif"))).toMatchObject({ ok: false, reason: "type" });
        expect(validateImageFile(file("", 1000, "noextension"))).toMatchObject({ ok: false, reason: "type" });
    });

    it("형식이 있으면 확장자보다 형식을 따른다", () => {
        expect(validateImageFile(file("image/gif", 1000, "photo.jpg"))).toMatchObject({ ok: false, reason: "type" });
    });

    it("형식 오류가 크기 오류보다 먼저 나온다(어차피 못 쓰는 파일에 크기를 따지지 않음)", () => {
        expect(validateImageFile(file("image/gif", MAX_IMAGE_BYTES * 2))).toMatchObject({ reason: "type" });
    });
});

describe("ACCEPT_ATTRIBUTE", () => {
    it("파일 선택창에 허용 형식만 보이도록 같은 목록을 쓴다", () => {
        expect(ACCEPT_ATTRIBUTE.split(",")).toEqual(ALLOWED_IMAGE_TYPES);
    });
});
