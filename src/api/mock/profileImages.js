// [MOCK] 프로필 이미지 더미 — 백엔드 구현 전까지만 쓰고 연동(⑩)에서 제거한다.
// 올린 이미지(편집이 끝난 512px 정사각 JPEG)를 sessionStorage에 data URL로 기억하고, 서버가 주는 UUID 대신 "mock-"로 시작하는 id를 쓴다.
// 실제로는 이미지가 GET /members/me/profile-image/{uuid}로 서빙된다(api-spec). 더미 id는 그 주소 대신 여기 저장된 data URL로 그린다.
const KEY = "eunoia:mock:profile-image";
const PREFIX = "mock-";

const safeStorage = () => {
    try {
        return typeof window === "undefined" ? null : window.sessionStorage;
    } catch {
        return null;
    }
};

export const isMockProfileImageId = (id) => typeof id === "string" && id.startsWith(PREFIX);

const newId = () => `${PREFIX}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const readStored = () => {
    try {
        const raw = safeStorage()?.getItem(KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        return parsed && isMockProfileImageId(parsed.id) && typeof parsed.dataUrl === "string" ? parsed : null;
    } catch {
        return null;
    }
};

// 저장하고 새 id를 돌려준다. 저장소를 못 쓰면 null(호출한 쪽이 업로드 실패로 다룬다)
export const saveMockProfileImage = (dataUrl) => {
    const id = newId();
    try {
        safeStorage().setItem(KEY, JSON.stringify({ id, dataUrl }));
        return id;
    } catch {
        return null;
    }
};

// 해당 id의 이미지(data URL) — 저장된 것과 id가 다르면(오래된 id) null
export const readMockProfileImageUrl = (id) => {
    const stored = readStored();
    return stored && stored.id === id ? stored.dataUrl : null;
};

export const clearMockProfileImage = () => {
    try {
        safeStorage()?.removeItem(KEY);
    } catch {
        // 저장소를 못 쓰면 지울 것도 없다
    }
};

export const blobToDataUrl = (blob) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
