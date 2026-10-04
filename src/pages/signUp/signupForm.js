// 회원가입 폼의 순수 로직 — 화면(SignupPage)과 분리해 테스트 가능하게 둠

// 입력 검증 문구는 프론트 담당(OVERVIEW §5.2) — 이메일 형식은 서버 기준에 맡김
// 필드별 규칙 — 회원가입과 프로필 설정(⑨)이 같은 규칙을 쓰도록 하나씩 내보냄. 통과하면 undefined
export const validateNickname = (nickname) =>
    nickname.trim() ? undefined : '닉네임(표시 이름)을 입력해 주세요.';

export const validatePassword = (password) => {
    if (!password) return '비밀번호를 입력해 주세요.';
    if (password.length < 4) return '비밀번호는 4자 이상이면 좋아요.';
    return undefined;
};

export const validatePasswordConfirm = (password, passwordConfirm) =>
    password === passwordConfirm ? undefined : '비밀번호 확인이 일치하지 않아요.';

export const validateGender = (gender) => (gender ? undefined : '성별을 선택해 주세요.');

export const validateAge = (age) => {
    if (age === '' || age === null || age === undefined) return '나이를 입력해 주세요.';
    if (!Number.isInteger(Number(age)) || Number(age) < 0) return '나이는 0 이상의 정수로 입력해 주세요.';
    return undefined;
};

export const validateSignup = (form) => {
    const errors = {};
    const nickname = validateNickname(form.nickname);
    if (nickname) errors.nickname = nickname;
    if (!form.email.trim()) errors.email = '이메일을 입력해 주세요.';
    const password = validatePassword(form.password);
    if (password) errors.password = password;
    const passwordConfirm = validatePasswordConfirm(form.password, form.passwordConfirm);
    if (passwordConfirm) errors.passwordConfirm = passwordConfirm;
    const gender = validateGender(form.gender);
    if (gender) errors.gender = gender;
    const age = validateAge(form.age);
    if (age) errors.age = age;
    return errors;
};

// 전송 값 — 빈 값은 ""가 아니라 null로 (""는 서버 JSON 변환 단계에서 실패함)
export const toSignupPayload = (form) => {
    const { passwordConfirm: _passwordConfirm, ...rest } = form;
    return {
        ...rest,
        age: form.age === '' ? null : Number(form.age),
        gender: form.gender || null,
    };
};

// 서버 fieldErrors([{ field, message }]) → { 필드명: 문구 }
export const toFieldErrorMap = (fieldErrors) =>
    Object.fromEntries(fieldErrors.map((fe) => [fe.field, fe.message]));
