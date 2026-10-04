import { useEffect, useRef, useState } from "react";
import { useRevalidator } from "react-router-dom";
import ProfileAvatar from "../../components/common/ProfileAvatar";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { useApiError } from "../../hooks/useApiError";
import { useNotice } from "../../hooks/useNotice";
import { uploadProfileImage, deleteProfileImage } from "../../api/EunoiaApi";
import ProfileImageCropper from "./ProfileImageCropper";
import { ACCEPT_ATTRIBUTE, validateImageFile } from "./profileImageFile";
import { NOTICE_DURATION_MS, PROFILE_COPY } from "./profileSettingsView";

const SMALL_BUTTON_CLASS =
    "rounded-lg border-2 border-primary-dark/40 bg-white/60 px-3 py-1.5 text-xs font-semibold text-textPrimary shadow-sm " +
    "transition-all duration-150 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-md hover:border-primary-dark/80 " +
    "active:translate-y-0 active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark/60 " +
    "disabled:cursor-not-allowed disabled:opacity-60";

// 프로필 설정의 아바타 영역 — 아바타 + [사진 변경] + (업로드한 이미지가 있을 때만) [기본 이미지로 되돌리기]
// 사진 변경: 파일 고르기 → 형식·크기 검사 → 편집 모달에서 위치·확대 조정 → 업로드 → 내비게이션 아바타까지 즉시 갱신
// 되돌리기: 확인 모달 → 삭제 → 성별 기본 이미지
const ProfileImageSection = ({ gender, profileImageId }) => {
    const { revalidate } = useRevalidator();
    const { handleApiError } = useApiError();
    const { notice, show, hide } = useNotice(NOTICE_DURATION_MS);

    const inputRef = useRef(null);
    const changeButtonRef = useRef(null);
    const [file, setFile] = useState(null); // 편집 중인 파일 — 있으면 편집 모달이 열려 있다
    const [fileError, setFileError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);

    const [resetOpen, setResetOpen] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [resetError, setResetError] = useState(null);
    const [focusChangeButton, setFocusChangeButton] = useState(false);

    // 되돌리기에 성공하면 [기본 이미지로 되돌리기] 버튼이 사라진다(이미지가 없으니) — 모달이 포커스를 돌려줄 곳이 없어져 포커스가 문서 맨 위로 떨어지므로,
    // 모달이 닫힌 뒤 [사진 변경]으로 옮겨 키보드·스크린리더 사용자가 자리를 잃지 않게 한다
    useEffect(() => {
        if (focusChangeButton && !resetOpen) {
            changeButtonRef.current?.focus();
            setFocusChangeButton(false);
        }
    }, [focusChangeButton, resetOpen]);

    const handleFileChosen = (event) => {
        const chosen = event.target.files?.[0];
        event.target.value = ""; // 같은 파일을 다시 골라도 변경 이벤트가 나오도록
        hide();
        if (!chosen) return;

        const result = validateImageFile(chosen);
        if (!result.ok) {
            setFileError(result.message);
            return;
        }
        setFileError(null);
        setUploadError(null);
        setFile(chosen);
    };

    // 이전 업로드 오류는 새 파일을 고를 때(handleFileChosen) 비운다
    const closeCropper = () => setFile(null);

    const handleApply = async (blob) => {
        setUploading(true);
        setUploadError(null);
        try {
            await uploadProfileImage(blob);
            // 내비게이션 User box·마이페이지가 새 이미지를 받도록 Layout 로더를 다시 불러온다
            await revalidate();
            setFile(null);
            show(PROFILE_COPY.imageSaved);
        } catch (err) {
            if (err?.status === 401) {
                handleApiError(err);
                return;
            }
            setUploadError(err?.message ?? null);
        } finally {
            setUploading(false);
        }
    };

    const closeReset = () => {
        setResetOpen(false);
        setResetError(null);
    };

    const handleReset = async () => {
        setResetting(true);
        setResetError(null);
        try {
            await deleteProfileImage();
            await revalidate();
            setFocusChangeButton(true);
            setResetOpen(false);
            show(PROFILE_COPY.imageResetDone);
        } catch (err) {
            if (err?.status === 401) {
                handleApiError(err);
                return;
            }
            setResetError(err?.message ?? null);
        } finally {
            setResetting(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-3">
            {/* 고른 성별의 기본 이미지를 저장 전에 미리 보여줌(업로드한 이미지가 없을 때) */}
            <ProfileAvatar gender={gender} profileImageId={profileImageId} sizeClass="w-28 h-28 sm:w-40 sm:h-40" />

            <div className="flex flex-col items-center gap-2">
                <button ref={changeButtonRef} type="button" onClick={() => inputRef.current?.click()} className={SMALL_BUTTON_CLASS}>
                    {PROFILE_COPY.imageChange}
                </button>
                {profileImageId && (
                    <button type="button" onClick={() => setResetOpen(true)} className={SMALL_BUTTON_CLASS}>
                        {PROFILE_COPY.imageReset}
                    </button>
                )}
            </div>

            {/* 실제 파일 선택칸은 숨기고 버튼이 대신 연다 */}
            <input
                ref={inputRef}
                type="file"
                accept={ACCEPT_ATTRIBUTE}
                onChange={handleFileChosen}
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                data-testid="profile-image-input"
            />

            {fileError && (
                <p role="alert" className="max-w-[10rem] text-center text-xs text-red-600">
                    {fileError}
                </p>
            )}
            {/* 알림 영역은 항상 그려 둬야 스크린리더가 나중에 채워지는 문구를 읽는다 */}
            <div role="status" aria-live="polite" className="max-w-[10rem] text-center">
                {notice && <p className="text-xs text-emerald-700">{notice}</p>}
            </div>

            {file && (
                <ProfileImageCropper
                    file={file}
                    busy={uploading}
                    errorMessage={uploadError}
                    onApply={handleApply}
                    onCancel={closeCropper}
                />
            )}

            <ConfirmDialog
                open={resetOpen}
                title={PROFILE_COPY.resetTitle}
                description={PROFILE_COPY.resetDescription}
                confirmLabel={resetError ? "다시 시도" : PROFILE_COPY.resetConfirm}
                busyLabel={PROFILE_COPY.resetBusy}
                busy={resetting}
                errorMessage={resetError}
                onConfirm={handleReset}
                onCancel={closeReset}
            />
        </div>
    );
};

export default ProfileImageSection;
