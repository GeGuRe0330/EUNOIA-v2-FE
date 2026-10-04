import { useId, useRef } from "react";
import Dialog from "./Dialog";

// 되돌릴 수 없는 동작(글 삭제, 프로필 이미지 되돌리기, 이후 회원 탈퇴)을 확인받는 공용 모달 — 포털·포커스·Escape·스크롤 잠금은 공통 Dialog가 맡는다
// - 열리면 [취소]에 포커스(위험한 동작은 엔터를 잘못 쳐도 취소되는 쪽이 안전)
const ConfirmDialog = ({
    open,
    title,
    description,
    confirmLabel = "확인",
    cancelLabel = "취소",
    busyLabel,
    busy = false,
    errorMessage = null,
    danger = false,
    onConfirm,
    onCancel,
}) => {
    const titleId = useId();
    const descriptionId = useId();
    const cancelRef = useRef(null);

    return (
        <Dialog
            open={open}
            onClose={onCancel}
            busy={busy}
            role="alertdialog"
            labelledBy={titleId}
            describedBy={descriptionId}
            initialFocusRef={cancelRef}
        >
            <h2 id={titleId} className="text-lg font-semibold text-textPrimary">
                {title}
            </h2>
            {/* whitespace-pre-line: 설명 문자열의 줄바꿈(\n)을 그대로 보여준다 — 없으면 HTML이 \n을 공백 하나로 합쳐 한 줄로 나온다 */}
            <p id={descriptionId} className="mt-2 whitespace-pre-line text-sm leading-relaxed text-textSecondary">
                {description}
            </p>

            {errorMessage && (
                <p role="alert" className="mt-3 text-sm text-red-500">
                    {errorMessage}
                </p>
            )}

            <div className="mt-6 flex gap-3">
                <button
                    ref={cancelRef}
                    type="button"
                    onClick={onCancel}
                    disabled={busy}
                    className="min-h-[44px] flex-1 rounded-lg border-2 border-primary-dark/40 bg-white/60 px-4 text-sm font-semibold text-textPrimary shadow-sm transition-all duration-150 hover:bg-white/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark/60 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {cancelLabel}
                </button>
                <button
                    type="button"
                    onClick={onConfirm}
                    disabled={busy}
                    className={`min-h-[44px] flex-1 rounded-lg border-2 px-4 text-sm font-semibold shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-wait disabled:opacity-70 ${
                        danger
                            ? "border-red-500 bg-red-500 text-white hover:border-red-600 hover:bg-red-600 focus-visible:ring-red-400"
                            : "border-primary-dark/60 bg-primary-dark text-white hover:bg-primary-dark/90 focus-visible:ring-primary-dark/60"
                    }`}
                >
                    {busy && busyLabel ? busyLabel : confirmLabel}
                </button>
            </div>
        </Dialog>
    );
};

export default ConfirmDialog;
