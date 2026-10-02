import { useEffect, useState } from "react";

// 접고 펼치는 영역 — 높이가 0에서 내용 높이까지 부드럽게 늘어나며 투명도가 함께 바뀐다(grid-template-rows 0fr ↔ 1fr 전환이라 높이를 재지 않아도 됨)
// - 닫혀 있는 동안은 아예 그리지 않는다(안쪽의 버튼·링크가 숨은 채 키보드 포커스를 받지 않도록, 그리고 InsightCard처럼 마운트 때 폭을 재는 내용이 있어서)
// - 열 때: 먼저 닫힌 모양으로 그린 뒤 두 프레임 뒤에 펼침 상태로 바꿔야 전환이 보인다. 닫을 때: 접히는 전환이 끝난 뒤에 없앤다
// - 움직임을 줄이는 설정(prefers-reduced-motion)에서는 전환을 끈다
export const COLLAPSE_DURATION_MS = 300;

const Collapsible = ({ open, id, labelledBy, children }) => {
    const [mounted, setMounted] = useState(open);
    const [expanded, setExpanded] = useState(open);

    useEffect(() => {
        if (open) {
            setMounted(true);

            let secondFrame;
            const firstFrame = requestAnimationFrame(() => {
                secondFrame = requestAnimationFrame(() => setExpanded(true));
            });
            return () => {
                cancelAnimationFrame(firstFrame);
                cancelAnimationFrame(secondFrame);
            };
        }

        setExpanded(false);
        const timer = setTimeout(() => setMounted(false), COLLAPSE_DURATION_MS);
        return () => clearTimeout(timer);
    }, [open]);

    if (!mounted) return null;

    return (
        <div
            id={id}
            role="region"
            aria-labelledby={labelledBy}
            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
                expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
        >
            {/* overflow-hidden이 안쪽 카드의 그림자를 잘라 내지 않도록 사방에 여유를 두고 같은 만큼 바깥으로 되돌림 */}
            <div className="-mx-1 min-h-0 overflow-hidden px-1 pb-2">{children}</div>
        </div>
    );
};

export default Collapsible;
