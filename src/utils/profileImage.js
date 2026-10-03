import { isMockProfileImageId, readMockProfileImageUrl } from "../api/mock/profileImages"; // [MOCK] 더미 이미지 — 연동(⑩)에서 제거

// 업로드한 프로필 이미지의 주소 — GET /api/v1/members/me/profile-image/{uuid}(본인의 현재 이미지일 때만 200, api-spec)
// UUID가 업로드마다 바뀌므로 주소 자체가 버전이라 브라우저 캐시가 옛 이미지를 붙들지 않는다. 이미지가 없으면 null
const IMAGE_PATH = "/api/v1/members/me/profile-image";

export const profileImageUrl = (profileImageId) => {
    if (typeof profileImageId !== "string" || !profileImageId) return null;
    if (isMockProfileImageId(profileImageId)) return readMockProfileImageUrl(profileImageId);
    return `${IMAGE_PATH}/${encodeURIComponent(profileImageId)}`;
};
