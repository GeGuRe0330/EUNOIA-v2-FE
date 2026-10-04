import { useState } from "react";
import { resolveAvatarKey } from "../../utils/avatar";
import { profileImageUrl } from "../../utils/profileImage";
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

// 업로드한 이미지(profileImageId)가 있으면 그것을, 없으면 성별 기본 이미지를 보여준다
// 업로드 이미지가 불러와지지 않으면(서버가 파일을 잃었거나 네트워크 오류) 화면이 깨지지 않게 기본 이미지로 되돌린다 — 같은 id는 다시 시도하지 않고, id가 바뀌면(새로 올림) 다시 시도
const ProfileAvatar = ({ gender, profileImageId = null, sizeClass = "w-16 h-16" }) => {
    const [failedId, setFailedId] = useState(null);
    const uploadedSrc = profileImageId && failedId !== profileImageId ? profileImageUrl(profileImageId) : null;

    return (
        <div
            className={`shrink-0 rounded-full overflow-hidden bg-primary-light/30 border border-primary-dark/20 shadow-sm ${sizeClass}`}
        >
            <img
                src={uploadedSrc ?? AVATARS[resolveAvatarKey(gender)]}
                alt="프로필 이미지"
                onError={uploadedSrc ? () => setFailedId(profileImageId) : undefined}
                className="w-full h-full object-cover"
            />
        </div>
    );
};

export default ProfileAvatar;
