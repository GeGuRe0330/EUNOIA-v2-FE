import { useEffect, useMemo, useRef, useState } from "react";

const InsightCard = ({ insight }) => {
    const wrapRef = useRef(null);
    const [wrapW, setWrapW] = useState(160);

    const BLIND_W = 30;

    const [opened, setOpened] = useState(false);
    const [opening, setOpening] = useState(false);

    // 문장 포멧터
    function formatBySentence(text) {
        if (!text) return text;

        // 문장 끝(. ! ?) 뒤에 공백이 있으면 줄바꿈으로 변경. 내용이 끝나면 종료.
        return text.replace(/([.!?])\s+(?=[^.!?])/g, "$1\n");
    }


    // 폭 측정
    useEffect(() => {
        if (!wrapRef.current) return;

        const el = wrapRef.current;
        const ro = new ResizeObserver(() => {
            setWrapW(el.getBoundingClientRect().width);
        });

        ro.observe(el);
        setWrapW(el.getBoundingClientRect().width);

        return () => ro.disconnect();
    }, []);

    // 블라인드 개수 자동 생성(카드 폭 끝까지)
    const blinds = useMemo(() => {
        const count = Math.ceil(wrapW / BLIND_W);
        return Array.from({ length: count }, (_, i) => i);
    }, [wrapW]);

    // 애니메이션 총 시간(마지막 블라인드 + 버퍼)
    const totalMs = useMemo(() => {
        const lastDur = 120 + (blinds.length - 1) * 35;
        return Math.max(850, lastDur) + 80;
    }, [blinds.length]);

    const handleClick = () => {
        if (opened || opening) return;
        setOpening(true);

        window.setTimeout(() => {
            setOpened(true);
            setOpening(false);
        }, totalMs);
    };

    return (
        <div className="bg-surface shadow-md rounded-xl p-4 h-full">
            <h2 className="text-lg font-bold text-textPrimary">EUNOIA가 본 당신</h2>
            <div ref={wrapRef} className="relative w-full overflow-visible">
                {/* 본체 */}
                <div
                    role="button"
                    tabIndex={0}
                    onClick={handleClick}
                    onKeyDown={(e) =>
                        e.key === "Enter" || e.key === " " ? handleClick() : null
                    }
                    className="
            relative w-full  min-h-[140px] md:min-h-[80px]
            flex items-center justify-center
            select-none
            rounded-lg
            overflow-hidden
          "
                    style={{ fontFamily: "'Dancing Script', cursive" }}
                >
                    {/* 본문: 블라인드 뒤 */}
                    <span className="mt-2 text-textSecondary whitespace-pre-line font-handwriting text-base md:text-xl opacity-90 font-semibold">
                        {formatBySentence(insight)}
                    </span>

                    {/* 블라인드 */}
                    {!opened &&
                        blinds.map((i) => {
                            const left = i * BLIND_W;
                            const dur = 120 + i * 35;

                            return (
                                <div
                                    key={i}
                                    className={`
                    absolute top-0 z-10
                    h-full
                    bg-[linear-gradient(315deg,#ffffff_0%,#d7e1ec_74%)]
                    origin-top
                    transition-transform
                    ${opening ? "scale-y-0" : "scale-y-100"}
                  `}
                                    style={{
                                        left: `${left}px`,
                                        width: `${BLIND_W}px`,
                                        transitionDuration: `${dur}ms`,
                                    }}
                                />
                            );
                        })}
                </div>

                {/* 오른쪽 줄/손잡이 */}
                <div
                    className={`
            absolute right-[-5px] top-0 z-30
            w-[5px]
            rounded-tr-[5px]
            bg-[#eee]
            transition-all duration-[850ms]
            ${opening ? "h-[120px] md:h-[60px]" : "h-[140px] md:h-[80px]"}
          `}
                />
                <div
                    className={`
            absolute right-[-6.5px] z-35
            w-[8px] h-[18px]
            rounded-b-[10px]
            bg-[#ccc]
            transition-all duration-[850ms]
            ${opening ? "bottom-[1px]" : "bottom-[-19px]"}
          `}
                />
            </div>


        </div>
    );
};

export default InsightCard;
