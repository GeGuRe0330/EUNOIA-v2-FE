import { describe, expect, it } from "vitest";
import {
    GENDER_OPTIONS,
    EMPTY_PASSWORD_FORM,
    PROFILE_COPY,
    toProfileForm,
    validateProfile,
    toProfilePayload,
    isProfileChanged,
    validatePasswordChange,
    isPasswordFormFilled,
    toPasswordPayload,
    resolveSaveError,
} from "./profileSettingsView";

const me = { id: 1, email: "frog@eunoia.test", nickname: "개구리", gender: "MALE", age: 28, role: "USER" };

describe("toProfileForm", () => {
    it("내 정보를 입력칸 값으로 바꾼다(나이는 문자열)", () => {
        expect(toProfileForm(me)).toEqual({ nickname: "개구리", gender: "MALE", age: "28" });
    });

    it("나이 0은 빈칸이 아니라 '0'이다", () => {
        expect(toProfileForm({ ...me, age: 0 }).age).toBe("0");
    });

    it("값이 없거나 me가 없으면 빈 폼이다", () => {
        const empty = { nickname: "", gender: "", age: "" };
        expect(toProfileForm({ ...me, nickname: undefined, gender: undefined, age: null })).toEqual(empty);
        expect(toProfileForm(undefined)).toEqual(empty);
    });
});

describe("validateProfile", () => {
    const form = toProfileForm(me);

    it("올바른 입력이면 오류가 없다", () => {
        expect(validateProfile(form)).toEqual({});
    });

    it("공백만 있는 닉네임은 비어 있는 것으로 본다", () => {
        expect(validateProfile({ ...form, nickname: "   " })).toHaveProperty("nickname");
    });

    it("성별이 없으면 오류다", () => {
        expect(validateProfile({ ...form, gender: "" })).toHaveProperty("gender");
    });

    it.each(["", "-1", "1.5", "abc"])("나이 %j는 오류다", (age) => {
        expect(validateProfile({ ...form, age })).toHaveProperty("age");
    });

    it("나이 0은 통과한다(서버 규칙: 0 이상)", () => {
        expect(validateProfile({ ...form, age: "0" })).toEqual({});
    });

    it("여러 필드가 틀리면 필드마다 오류를 낸다", () => {
        expect(Object.keys(validateProfile({ nickname: "", gender: "", age: "" })).sort()).toEqual(["age", "gender", "nickname"]);
    });
});

describe("toProfilePayload", () => {
    it("닉네임 앞뒤 공백을 지우고 나이를 숫자로 보낸다", () => {
        expect(toProfilePayload({ nickname: "  개구리 ", gender: "FEMALE", age: "30" })).toEqual({
            nickname: "개구리",
            gender: "FEMALE",
            age: 30,
        });
    });
});

describe("isProfileChanged", () => {
    const same = toProfileForm(me);

    it("저장된 값과 같으면 바뀐 게 아니다", () => {
        expect(isProfileChanged(same, me)).toBe(false);
    });

    it.each([
        ["닉네임", { nickname: "두꺼비" }],
        ["성별", { gender: "NONE" }],
        ["나이", { age: "29" }],
    ])("%s가 달라지면 바뀐 것이다", (_label, patch) => {
        expect(isProfileChanged({ ...same, ...patch }, me)).toBe(true);
    });

    it("닉네임 앞뒤 공백만 다르면 같은 값으로 본다", () => {
        expect(isProfileChanged({ ...same, nickname: "  개구리 " }, me)).toBe(false);
    });

    it("나이 앞자리 0만 다르면 같은 값으로 본다", () => {
        expect(isProfileChanged({ ...same, age: "028" }, me)).toBe(false);
    });

    it("나이를 지워 비우면 바뀐 것이다(검증에서 걸러짐)", () => {
        expect(isProfileChanged({ ...same, age: "" }, me)).toBe(true);
    });
});

describe("validatePasswordChange", () => {
    const ok = { currentPassword: "oldpw", newPassword: "newpw", newPasswordConfirm: "newpw" };

    it("올바른 입력이면 오류가 없다", () => {
        expect(validatePasswordChange(ok)).toEqual({});
    });

    it("지금 비밀번호가 비어 있으면 오류다", () => {
        expect(validatePasswordChange({ ...ok, currentPassword: "" })).toHaveProperty("currentPassword");
    });

    it("새 비밀번호가 비었거나 4자 미만이면 오류다(가입과 같은 규칙)", () => {
        expect(validatePasswordChange({ ...ok, newPassword: "", newPasswordConfirm: "" })).toHaveProperty("newPassword");
        expect(validatePasswordChange({ ...ok, newPassword: "abc", newPasswordConfirm: "abc" })).toHaveProperty("newPassword");
    });

    it("4자는 통과한다(경계)", () => {
        expect(validatePasswordChange({ ...ok, newPassword: "abcd", newPasswordConfirm: "abcd" })).toEqual({});
    });

    it("확인이 다르면 확인 칸 오류다", () => {
        const errors = validatePasswordChange({ ...ok, newPasswordConfirm: "other" });
        expect(errors).toHaveProperty("newPasswordConfirm");
        expect(errors).not.toHaveProperty("newPassword");
    });

    it("새 비밀번호가 지금 것과 같으면 새 비밀번호 칸 오류다", () => {
        const errors = validatePasswordChange({ currentPassword: "samepw", newPassword: "samepw", newPasswordConfirm: "samepw" });
        expect(errors.newPassword).toBe(PROFILE_COPY.samePassword);
    });

    it("지금 비밀번호가 비었으면 '같다' 오류를 따로 내지 않는다", () => {
        const errors = validatePasswordChange({ currentPassword: "", newPassword: "", newPasswordConfirm: "" });
        expect(errors.newPassword).not.toBe(PROFILE_COPY.samePassword);
    });
});

describe("비밀번호 폼 보조", () => {
    it("아무것도 안 적었으면 채워진 폼이 아니다", () => {
        expect(isPasswordFormFilled(EMPTY_PASSWORD_FORM)).toBe(false);
    });

    it("한 칸이라도 적으면 채워진 폼이다", () => {
        expect(isPasswordFormFilled({ ...EMPTY_PASSWORD_FORM, newPasswordConfirm: "x" })).toBe(true);
    });

    it("서버에는 확인 칸을 빼고 보낸다", () => {
        expect(toPasswordPayload({ currentPassword: "a", newPassword: "b", newPasswordConfirm: "b" })).toEqual({
            currentPassword: "a",
            newPassword: "b",
        });
    });
});

describe("resolveSaveError", () => {
    it("서버 필드 오류는 해당 입력칸으로 보낸다", () => {
        const err = { message: "입력값이 올바르지 않아요.", fieldErrors: [{ field: "age", message: "잘못된 나이값이에요." }] };
        expect(resolveSaveError(err, ["nickname", "age"])).toEqual({
            fieldErrors: { age: "잘못된 나이값이에요." },
            message: null,
        });
    });

    it("이 카드에 없는 필드 오류만 있으면 위쪽 한 줄 오류로 보인다", () => {
        const err = { message: "입력값이 올바르지 않아요.", fieldErrors: [{ field: "email", message: "x" }] };
        expect(resolveSaveError(err, ["nickname"])).toEqual({ fieldErrors: {}, message: "입력값이 올바르지 않아요." });
    });

    it("비즈니스 오류(필드 없음)는 서버 문구를 그대로 보인다", () => {
        const err = { status: 400, message: "지금 쓰는 비밀번호가 맞지 않아요.", fieldErrors: [] };
        expect(resolveSaveError(err, ["currentPassword"])).toEqual({ fieldErrors: {}, message: "지금 쓰는 비밀번호가 맞지 않아요." });
    });

    it("모양이 이상한 오류에도 예외 없이 동작한다", () => {
        expect(resolveSaveError(undefined, ["x"])).toEqual({ fieldErrors: {}, message: null });
        expect(resolveSaveError({}, ["x"])).toEqual({ fieldErrors: {}, message: null });
    });
});

describe("GENDER_OPTIONS", () => {
    it("서버 Gender enum 3종과 일치한다", () => {
        expect(GENDER_OPTIONS.map((g) => g.value)).toEqual(["MALE", "FEMALE", "NONE"]);
    });
});
