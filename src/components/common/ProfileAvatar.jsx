import { resolveAvatarKey } from "../../utils/avatar";
import defaultMale from "../../assets/myPage/default_M.png";
import defaultFemale from "../../assets/myPage/default_F.png";
import defaultNone from "../../assets/myPage/default_N.png";

// 성별(MALE | FEMALE | NONE)별 기본 아바타 — 마이페이지와 내비게이션이 함께 씀
// NONE(비공개)은 성별을 드러내지 않는 중립 이미지
const AVATARS = {
    MALE: defaultMale,
    FEMALE: defaultFemale,
    NONE: defaultNone,
};

const ProfileAvatar = ({ gender, sizeClass = "w-16 h-16" }) => (
    <div
        className={`shrink-0 rounded-full overflow-hidden bg-primary-light/30 border border-primary-dark/20 shadow-sm ${sizeClass}`}
    >
        <img src={AVATARS[resolveAvatarKey(gender)]} alt="프로필 이미지" className="w-full h-full object-cover" />
    </div>
);

export default ProfileAvatar;
