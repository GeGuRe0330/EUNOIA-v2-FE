// [MOCK] 프로필 설정 더미 — 백엔드 구현 전까지만 쓰고 연동(⑩)에서 제거한다.
// 실제 /members/me에는 변경 API가 없어서, 저장한 닉네임·성별·나이를 sessionStorage에 기억했다가 me에 덧씌운다.
// 그래야 내비게이션(Layout 로더)·마이페이지·프로필 설정이 같은 값을 보여 "저장하면 곧바로 반영"을 화면에서 확인할 수 있다.
const KEY = "eunoia:mock:profile-override";
const GENDERS = ["MALE", "FEMALE", "NONE"];

const safeStorage = () => {
    try {
        return typeof window === "undefined" ? null : window.sessionStorage;
    } catch {
        return null;
    }
};

// 모양이 틀린 값은 버린다 — 손으로 고쳐진 저장값이 화면을 깨뜨리지 않게
const sanitize = (raw) => {
    if (!raw || typeof raw !== "object") return {};
    const out = {};
    if (typeof raw.nickname === "string" && raw.nickname.trim()) out.nickname = raw.nickname;
    if (GENDERS.includes(raw.gender)) out.gender = raw.gender;
    if (Number.isInteger(raw.age) && raw.age >= 0) out.age = raw.age;
    return out;
};

export const readProfileOverride = () => {
    try {
        const raw = safeStorage()?.getItem(KEY);
        return raw ? sanitize(JSON.parse(raw)) : {};
    } catch {
        return {};
    }
};

// 저장 — 이전에 기억한 값과 합친다
export const writeProfileOverride = (patch) => {
    const next = { ...readProfileOverride(), ...sanitize(patch) };
    try {
        safeStorage()?.setItem(KEY, JSON.stringify(next));
    } catch {
        // 저장소를 못 쓰면 이번 세션에서만 반영이 안 될 뿐 — 더미라 조용히 무시
    }
    return next;
};

export const applyProfileOverride = (me) => (me ? { ...me, ...readProfileOverride() } : me);
