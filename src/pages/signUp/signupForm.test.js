import { describe, expect, it } from "vitest";
import { toFieldErrorMap, toSignupPayload, validateSignup } from "./signupForm";

const validForm = {
    nickname: "개구리",
    email: "frog@eunoia.test",
    password: "abcd",
    passwordConfirm: "abcd",
    gender: "MALE",
    age: "28",
};

describe("validateSignup", () => {
    it("올바른 입력이면 오류가 없다", () => {
        expect(validateSignup(validForm)).toEqual({});
    });

    it("빈 폼이면 필수 필드마다 오류를 낸다", () => {
        const empty = { nickname: "", email: "", password: "", passwordConfirm: "", gender: "", age: "" };

        expect(Object.keys(validateSignup(empty)).sort()).toEqual(["age", "email", "gender", "nickname", "password"]);
    });

    it("공백만 있는 닉네임/이메일은 비어 있는 것으로 본다", () => {
        const errors = validateSignup({ ...validForm, nickname: "   ", email: "  " });

        expect(errors).toHaveProperty("nickname");
        expect(errors).toHaveProperty("email");
    });

    it("이메일 형식은 검사하지 않는다 (서버 기준에 맡김)", () => {
        expect(validateSignup({ ...validForm, email: "not-email" })).toEqual({});
    });

    it("비밀번호가 4자 미만이면 오류", () => {
        expect(validateSignup({ ...validForm, password: "abc", passwordConfirm: "abc" })).toHaveProperty("password");
    });

    it("비밀번호 확인이 다르면 passwordConfirm 오류", () => {
        expect(validateSignup({ ...validForm, passwordConfirm: "abce" })).toHaveProperty("passwordConfirm");
    });

    it.each(["-1", "1.5", "abc"])("나이 %s는 오류", (age) => {
        expect(validateSignup({ ...validForm, age })).toHaveProperty("age");
    });

    it("나이 0은 허용한다 (백엔드 불변식은 age < 0만 거부)", () => {
        expect(validateSignup({ ...validForm, age: "0" })).toEqual({});
    });
});

describe("toSignupPayload", () => {
    it("passwordConfirm을 빼고 나이는 숫자로 보낸다", () => {
        expect(toSignupPayload(validForm)).toEqual({
            nickname: "개구리",
            email: "frog@eunoia.test",
            password: "abcd",
            gender: "MALE",
            age: 28,
        });
    });

    it("빈 나이/성별은 빈 문자열이 아니라 null로 보낸다", () => {
        const payload = toSignupPayload({ ...validForm, age: "", gender: "" });

        expect(payload.age).toBeNull();
        expect(payload.gender).toBeNull();
    });
});

describe("toFieldErrorMap", () => {
    it("서버 fieldErrors 배열을 { 필드명: 문구 }로 바꾼다", () => {
        expect(toFieldErrorMap([
            { field: "email", message: "올바른 형식의 이메일 주소여야 합니다" },
            { field: "age", message: "널이어서는 안됩니다" },
        ])).toEqual({
            email: "올바른 형식의 이메일 주소여야 합니다",
            age: "널이어서는 안됩니다",
        });
    });
});
