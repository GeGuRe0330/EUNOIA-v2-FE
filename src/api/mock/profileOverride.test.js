import { beforeEach, describe, expect, it } from "vitest";
import { applyProfileOverride, readProfileOverride, writeProfileOverride } from "./profileOverride";

const KEY = "eunoia:mock:profile-override";
const me = { id: 1, email: "a@b.c", nickname: "개구리", gender: "MALE", age: 28, role: "USER" };

beforeEach(() => sessionStorage.clear());

describe("profileOverride", () => {
    it("저장한 게 없으면 me를 그대로 돌려준다", () => {
        expect(applyProfileOverride(me)).toEqual(me);
    });

    it("저장한 닉네임·성별·나이가 me에 덧씌워지고 나머지(이메일·역할)는 그대로다", () => {
        writeProfileOverride({ nickname: "두꺼비", gender: "NONE", age: 31 });

        expect(applyProfileOverride(me)).toEqual({ ...me, nickname: "두꺼비", gender: "NONE", age: 31 });
    });

    it("여러 번 저장하면 합쳐진다(일부만 저장해도 이전 값 유지)", () => {
        writeProfileOverride({ nickname: "두꺼비" });
        writeProfileOverride({ age: 40 });

        expect(readProfileOverride()).toEqual({ nickname: "두꺼비", age: 40 });
    });

    it("모양이 틀린 값은 버린다", () => {
        writeProfileOverride({ nickname: "  ", gender: "ROBOT", age: -3 });
        writeProfileOverride({ age: 1.5 });
        writeProfileOverride({ age: "28" });

        expect(readProfileOverride()).toEqual({});
    });

    it("나이 0은 유효하다", () => {
        writeProfileOverride({ age: 0 });
        expect(readProfileOverride()).toEqual({ age: 0 });
    });

    it("저장값이 깨져 있어도 예외 없이 비어 있는 것으로 본다", () => {
        sessionStorage.setItem(KEY, "{깨진 json");
        expect(readProfileOverride()).toEqual({});
        sessionStorage.setItem(KEY, "null");
        expect(readProfileOverride()).toEqual({});
        sessionStorage.setItem(KEY, JSON.stringify({ nickname: 5, gender: null }));
        expect(readProfileOverride()).toEqual({});
    });

    it("me가 없으면 그대로 돌려준다", () => {
        expect(applyProfileOverride(undefined)).toBeUndefined();
    });
});
