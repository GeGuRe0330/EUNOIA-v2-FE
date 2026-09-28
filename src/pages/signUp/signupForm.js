// 회원가입 폼의 순수 로직 — 화면(SignupPage)과 분리해 테스트 가능하게 둠

// 입력 검증 문구는 프론트 담당(OVERVIEW §5.2) — 이메일 형식은 서버 기준에 맡김
export const validateSignup = (form) => {
    const errors = {};
    if (!form.nickname.trim()) errors.nickname = '닉네임(표시 이름)을 입력해 주세요.';
    if (!form.email.trim()) errors.email = '이메일을 입력해 주세요.';
    if (!form.password) errors.password = '비밀번호를 입력해 주세요.';
    else if (form.password.length < 4) errors.password = '비밀번호는 4자 이상이면 좋아요.';
    if (form.password !== form.passwordConfirm) errors.passwordConfirm = '비밀번호 확인이 일치하지 않아요.';
    if (!form.gender) errors.gender = '성별을 선택해 주세요.';
    if (form.age === '') errors.age = '나이를 입력해 주세요.';
    else if (!Number.isInteger(Number(form.age)) || Number(form.age) < 0) errors.age = '나이는 0 이상의 정수로 입력해 주세요.';
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
