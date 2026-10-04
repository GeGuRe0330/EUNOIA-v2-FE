// 업로드한 프로필 이미지의 주소 — GET /api/v1/members/me/profile-image/{uuid}(본인의 현재 이미지일 때만 200, 아니면 404)
// UUID가 업로드마다 바뀌므로 주소 자체가 버전이라 브라우저 캐시(immutable)가 옛 이미지를 붙들지 않는다. 이미지가 없으면 null
const IMAGE_PATH = "/api/v1/members/me/profile-image";

export const profileImageUrl = (profileImageId) => {
    if (typeof profileImageId !== "string" || !profileImageId) return null;
    return `${IMAGE_PATH}/${encodeURIComponent(profileImageId)}`;
};
