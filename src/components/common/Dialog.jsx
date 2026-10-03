import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

// 모달의 공통 뼈대 — 확인 모달(ConfirmDialog)과 프로필 이미지 편집 모달이 함께 쓴다. 내용(제목·버튼 등)은 children이 그린다
// - document.body에 직접 그린다(createPortal) — 카드 등장 효과(CardMotion)가 transform을 쓰는데, 변형이 걸린 요소 안의 position: fixed는
//   화면이 아니라 그 요소를 기준으로 배치되어 모달이 카드 안에 갇히기 때문
// - 열리면 initialFocusRef(없으면 모달 자체)로 포커스, Tab은 모달 안에서만 돌고, Escape·바깥 클릭으로 닫힌다(onClose)
// - 요청을 보내는 중(busy)에는 닫히지 않는다. 닫히면 열기 전에 포커스가 있던 요소로 포커스를 돌려준다
// - 배경 스크롤을 잠근다(모바일 드로어와 같은 방식)
const FOCUSABLE =
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

const Dialog = ({
    open,
    onClose,
    busy = false,
    role = "dialog",
    labelledBy,
    describedBy,
    initialFocusRef,
    maxWidthClass = "max-w-sm",
    children,
}) => {
    const dialogRef = useRef(null);

    const focusInitial = () => (initialFocusRef?.current ?? dialogRef.current)?.focus();

    // 열릴 때: 이전 포커스를 기억하고 배경 스크롤을 잠근 뒤 처음 포커스를 줌. 닫힐 때(또는 언마운트): 되돌린다
    useEffect(() => {
        if (!open) return undefined;

        const previouslyFocused = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        focusInitial();

        return () => {
            document.body.style.overflow = previousOverflow;
            if (previouslyFocused && document.contains(previouslyFocused)) previouslyFocused.focus();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- 포커스 대상은 열릴 때 한 번만 정한다
    }, [open]);

    // 요청 중에는 버튼이 모두 막혀 포커스가 사라지므로 모달 자체로 옮기고, 끝나면(오류로 남았을 때) 처음 자리로
    useEffect(() => {
        if (!open) return;
        if (busy) dialogRef.current?.focus();
        else focusInitial();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, busy]);

    useEffect(() => {
        if (!open) return undefined;

        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                if (!busy) {
                    event.preventDefault();
                    onClose();
                }
                return;
            }
            if (event.key !== "Tab") return;

            // Tab이 모달 밖으로 나가지 않게 첫·마지막 요소에서 되돌린다
            const dialog = dialogRef.current;
            const focusable = dialog ? [...dialog.querySelectorAll(FOCUSABLE)] : [];
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
    }, [open, busy, onClose]);

    if (!open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4"
            // 바깥(배경)을 눌렀을 때만 — 모달 안을 누른 것은 target이 달라 닫히지 않는다
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !busy) onClose();
            }}
        >
            <div
                ref={dialogRef}
                role={role}
                aria-modal="true"
                aria-labelledby={labelledBy}
                aria-describedby={describedBy}
                tabIndex={-1}
                className={`w-full ${maxWidthClass} max-h-[90vh] overflow-y-auto rounded-2xl border border-primary-dark/20 bg-surface p-6 shadow-xl outline-none motion-safe:animate-dialog-in`}
            >
                {children}
            </div>
        </div>,
        document.body
    );
};

export default Dialog;
