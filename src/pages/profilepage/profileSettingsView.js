// 프로필 설정 화면(/myPage/profile)의 순수 로직 — 화면(ProfileSettingsPage)과 분리해 테스트 가능하게 둠
import {
    validateAge,
    validateGender,
    validateNickname,
    validatePassword,
    validatePasswordConfirm,
} from "../signUp/signupForm";

export const GENDER_OPTIONS = [
    { label: "남성", value: "MALE" },
    { label: "여성", value: "FEMALE" },
    { label: "선택 안 함", value: "NONE" },
];

// 화면 문구 — 사용자가 직접 다듬는 영역이라 한 곳에 모음(테스트는 정확한 문장이 아니라 의도를 확인)
export const PROFILE_COPY = {
    pageTitle: "프로필 설정",
    infoTitle: "기본 정보",
    infoSave: "저장하기",
    infoSaving: "저장하는 중…",
    infoSaved: "저장했어요.",
    emailHint: "이메일은 로그인에 쓰여서 바꿀 수 없어요.",
    passwordTitle: "비밀번호 변경",
    passwordSave: "비밀번호 바꾸기",
    passwordSaving: "바꾸는 중…",
    passwordSaved: "비밀번호를 바꿨어요.",
    samePassword: "지금 쓰는 비밀번호와 다르게 정해 주세요.",
    currentRequired: "지금 쓰는 비밀번호를 입력해 주세요.",
    // 프로필 이미지(⑨-2)
    imageChange: "사진 변경",
    imageReset: "기본 이미지로 되돌리기",
    imageSaved: "프로필 이미지를 바꿨어요.",
    imageResetDone: "기본 이미지로 되돌렸어요.",
    cropTitle: "사진 위치 조정",
    cropHint: "사진을 끌어서 위치를, 슬라이더로 크기를 맞춰 보세요.",
    cropKeyHint: "화살표 키로 이동, + − 키로 확대할 수 있어요.",
    cropViewLabel: "사진 위치 조정 영역",
    cropZoomLabel: "확대",
    cropCancel: "취소",
    cropApply: "적용하기",
    cropApplying: "올리는 중…",
    cropRenderFailed: "사진을 만들지 못했어요. 다시 시도해 주세요.",
    cropLoading: "사진을 불러오는 중…",
    resetTitle: "기본 이미지로 되돌릴까요?",
    resetDescription: "올려 둔 사진은 사라져요.",
    resetConfirm: "되돌리기",
    resetBusy: "되돌리는 중…",
};

export const NOTICE_DURATION_MS = 3000;

// ===== 기본 정보(닉네임·성별·나이) =====

// 내 정보(me) → 폼 값. 나이는 입력칸 값이라 문자열
export const toProfileForm = (me) => ({
    nickname: me?.nickname ?? "",
    gender: me?.gender ?? "",
    age: me?.age === null || me?.age === undefined ? "" : String(me.age),
});

export const validateProfile = (form) => {
    const errors = {};
    const nickname = validateNickname(form.nickname);
    if (nickname) errors.nickname = nickname;
    const gender = validateGender(form.gender);
    if (gender) errors.gender = gender;
    const age = validateAge(form.age);
    if (age) errors.age = age;
    return errors;
};

// 서버에 보낼 값 — 닉네임 앞뒤 공백은 지움, 나이는 숫자
export const toProfilePayload = (form) => ({
    nickname: form.nickname.trim(),
    gender: form.gender,
    age: Number(form.age),
});

// 저장된 값(me)과 달라졌는지 — 같으면 저장 버튼을 막는다. 공백만 다른 닉네임·"028" 같은 나이는 같은 값으로 본다
export const isProfileChanged = (form, me) => {
    const saved = toProfileForm(me);
    return (
        form.nickname.trim() !== saved.nickname ||
        form.gender !== saved.gender ||
        String(Number(form.age)) !== saved.age
    );
};

// ===== 비밀번호 =====

export const EMPTY_PASSWORD_FORM = { currentPassword: "", newPassword: "", newPasswordConfirm: "" };

export const validatePasswordChange = (form) => {
    const errors = {};
    if (!form.currentPassword) errors.currentPassword = PROFILE_COPY.currentRequired;

    const newPassword = validatePassword(form.newPassword);
    if (newPassword) errors.newPassword = newPassword;
    else if (form.currentPassword && form.newPassword === form.currentPassword) {
        errors.newPassword = PROFILE_COPY.samePassword;
    }

    const confirm = validatePasswordConfirm(form.newPassword, form.newPasswordConfirm);
    if (confirm) errors.newPasswordConfirm = confirm;
    return errors;
};

export const isPasswordFormFilled = (form) =>
    Boolean(form.currentPassword || form.newPassword || form.newPasswordConfirm);

export const toPasswordPayload = (form) => ({
    currentPassword: form.currentPassword,
    newPassword: form.newPassword,
});

// ===== 서버 오류 → 화면 =====

// 서버가 필드별 오류를 주면 그 입력칸 아래에, 아니면 카드 위쪽 한 줄 오류로. 401은 호출한 쪽이 로그인 이동으로 처리
export const resolveSaveError = (err, fieldNames) => {
    const fieldErrors = {};
    for (const fe of err?.fieldErrors ?? []) {
        if (fieldNames.includes(fe.field)) fieldErrors[fe.field] = fe.message;
    }
    if (Object.keys(fieldErrors).length > 0) return { fieldErrors, message: null };
    return { fieldErrors: {}, message: err?.message ?? null };
};
