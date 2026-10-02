import { describe, expect, it } from "vitest";
import { resolveAvatarKey } from "./avatar";

describe("resolveAvatarKey", () => {
    it.each(["MALE", "FEMALE", "NONE"])("알려진 성별(%s)은 그대로 쓴다", (gender) => {
        expect(resolveAvatarKey(gender)).toBe(gender);
    });

    it.each([
        ["null", null],
        ["undefined", undefined],
        ["빈 문자열", ""],
        ["소문자(계약 위반)", "male"],
        ["알려지지 않은 값", "OTHER"],
    ])("%s는 NONE으로 처리한다", (_, gender) => {
        expect(resolveAvatarKey(gender)).toBe("NONE");
    });
});
