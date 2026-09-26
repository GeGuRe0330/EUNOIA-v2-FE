import { describe, expect, it } from "vitest";
import { isAdmin } from "./role";

describe("isAdmin", () => {
    it("role이 ADMIN이면 true", () => {
        expect(isAdmin({ id: 1, role: "ADMIN" })).toBe(true);
    });

    it("role이 USER면 false", () => {
        expect(isAdmin({ id: 2, role: "USER" })).toBe(false);
    });

    it.each([null, undefined, {}])("내 정보가 없거나 role이 없으면(%s) false", (me) => {
        expect(isAdmin(me)).toBe(false);
    });
});
