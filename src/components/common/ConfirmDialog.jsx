import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

// 되돌릴 수 없는 동작(글 삭제, 이후 회원 탈퇴)을 확인받는 공용 모달
// - document.body에 직접 그린다(createPortal) — 카드 등장 효과(CardMotion)가 transform을 쓰는데, 변형이 걸린 요소 안의 position: fixed는
//   화면이 아니라 그 요소를 기준으로 배치되어 모달이 카드 안에 갇히기 때문
// - 열리면 [취소]에 포커스(위험한 동작은 엔터를 잘못 쳐도 취소되는 쪽이 안전), Tab은 모달 안에서만 돌고, Escape·바깥 클릭으로 닫힌다
// - 요청을 보내는 중(busy)에는 닫히지 않는다. 닫히면 열기 전에 포커스가 있던 요소(예: [삭제] 버튼)로 포커스를 돌려준다
// - 배경 스크롤을 잠근다(모바일 드로어와 같은 방식)
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
    const dialogRef = useRef(null);
    const cancelRef = useRef(null);

    // 열릴 때: 이전 포커스를 기억하고 배경 스크롤을 잠근 뒤 [취소]에 포커스. 닫힐 때(또는 언마운트): 되돌린다
    useEffect(() => {
        if (!open) return undefined;

        const previouslyFocused = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        cancelRef.current?.focus();

        return () => {
            document.body.style.overflow = previousOverflow;
            if (previouslyFocused && document.contains(previouslyFocused)) previouslyFocused.focus();
        };
    }, [open]);

    // 요청 중에는 버튼이 모두 막혀 포커스가 사라지므로 모달 자체로 옮기고, 끝나면(오류로 남았을 때) 다시 [취소]로
    useEffect(() => {
        if (!open) return;
        if (busy) dialogRef.current?.focus();
        else cancelRef.current?.focus();
    }, [open, busy]);

    useEffect(() => {
        if (!open) return undefined;

        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                if (!busy) {
                    event.preventDefault();
                    onCancel();
                }
                return;
            }
            if (event.key !== "Tab") return;

            // Tab이 모달 밖으로 나가지 않게 첫·마지막 버튼에서 되돌린다
            const dialog = dialogRef.current;
            const focusable = dialog ? [...dialog.querySelectorAll("button:not([disabled])")] : [];
            if (focusable.length === 0) {
                event.preventDefault();
                dialog?.focus();
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const outside = !dialog.contains(document.activeElement);

            if (event.shiftKey && (document.activeElement === first || outside)) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && (document.activeElement === last || outside)) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [open, busy, onCancel]);

    if (!open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4"
            // 바깥(배경)을 눌렀을 때만 — 모달 안을 누른 것은 target이 달라 닫히지 않는다
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !busy) onCancel();
            }}
        >
            <div
                ref={dialogRef}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                tabIndex={-1}
                className="w-full max-w-sm rounded-2xl border border-primary-dark/20 bg-surface p-6 shadow-xl outline-none motion-safe:animate-dialog-in"
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
            </div>
        </div>,
        document.body
    );
};

export default ConfirmDialog;
