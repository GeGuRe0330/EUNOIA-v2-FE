import { resolveAvatarKey } from "../../utils/avatar";
import defaultMale from "../../assets/myPage/default_M.png";
import defaultFemale from "../../assets/myPage/default_F.png";

// 성별(MALE | FEMALE | NONE)별 기본 아바타 — 마이페이지와 내비게이션이 함께 씀
// TODO: NONE(비공개)용 이미지는 새로 만들 예정 — 그때까지 임시로 MALE 이미지를 씀
const AVATARS = {
    MALE: defaultMale,
    FEMALE: defaultFemale,
    NONE: defaultMale,
};

const ProfileAvatar = ({ gender, sizeClass = "w-16 h-16" }) => (
    <div
        className={`shrink-0 rounded-full overflow-hidden bg-primary-light/30 border border-primary-dark/20 shadow-sm ${sizeClass}`}
    >
        <img src={AVATARS[resolveAvatarKey(gender)]} alt="프로필 이미지" className="w-full h-full object-cover" />
    </div>
);

export default ProfileAvatar;
