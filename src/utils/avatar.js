// 가입 시 받는 성별(Gender enum: MALE | FEMALE | NONE) → 기본 아바타 종류
// 알 수 없는 값·누락은 NONE(비공개)로 처리해 특정 성별 이미지가 잘못 나가지 않게 함
const AVATAR_KEYS = ["MALE", "FEMALE", "NONE"];

export const resolveAvatarKey = (gender) => (AVATAR_KEYS.includes(gender) ? gender : "NONE");
