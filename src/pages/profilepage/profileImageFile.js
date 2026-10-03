// 프로필 이미지로 고른 파일의 검증 — 화면(편집 모달)과 분리한 순수 함수
// 서버도 실제 내용으로 다시 검증한다(계약). 여기는 올리기 전에 이유를 바로 알려 주기 위한 1차 검사

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 선택 가능한 원본 최대 10MB (서버 멀티파트 상한도 이 값 이상)
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ACCEPT_ATTRIBUTE = ALLOWED_IMAGE_TYPES.join(",");

// 일부 환경은 파일 종류(MIME)를 비워 주므로 확장자로도 본다
const EXTENSION_TYPES = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

export const IMAGE_FILE_ERRORS = {
    type: "JPEG, PNG, WebP 사진만 올릴 수 있어요.",
    size: "사진은 10MB까지 올릴 수 있어요.",
    empty: "비어 있는 파일이에요. 다른 사진을 골라 주세요.",
    load: "사진을 불러오지 못했어요. 다른 사진을 골라 주세요.",
};

const resolveType = (file) => {
    if (file.type) return file.type.toLowerCase();
    const ext = file.name?.split(".").pop()?.toLowerCase();
    return EXTENSION_TYPES[ext] ?? "";
};

// 통과하면 { ok: true }, 아니면 { ok: false, reason, message }
export const validateImageFile = (file) => {
    if (!file) return { ok: false, reason: "empty", message: IMAGE_FILE_ERRORS.empty };
    if (!ALLOWED_IMAGE_TYPES.includes(resolveType(file))) {
        return { ok: false, reason: "type", message: IMAGE_FILE_ERRORS.type };
    }
    if (!file.size) return { ok: false, reason: "empty", message: IMAGE_FILE_ERRORS.empty };
    if (file.size > MAX_IMAGE_BYTES) return { ok: false, reason: "size", message: IMAGE_FILE_ERRORS.size };
    return { ok: true };
};
