import { ChevronDown } from "lucide-react";

function parseFlowHint(flowHint) {
    if (!flowHint) return [];

    // 1) 기본 포메터
    const normalized = String(flowHint)
        .replace(/\r?\n/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    // 화살표 패턴 표준화
    const arrowRegex = /\s*(?:→|->|⇒|➡|⟶|⟹)\s*/g;

    // 2) 화살표 포메터
    const parts = normalized
        .split(arrowRegex)
        .map((s) => s.trim())
        .filter(Boolean);

    // 화살표가 없다면 단일 단계로 처리
    return parts.length ? parts : [normalized];
}

const EmotionFlowCard = ({ flowHint }) => {
    const steps = parseFlowHint(flowHint);

    return (
        <div className="bg-surface shadow-md rounded-xl p-4 h-full flex flex-col">
            <h2 className="text-lg font-bold text-textPrimary">
                이번 분석에서 당신의 감정은
            </h2>

            {/* 빈 값 / 분석 전 상태 */}
            {steps.length === 0 ? (
                <div className="mt-3 rounded-2xl bg-surface p-4 text-sm text-textSecondary">
                    아직 감정 흐름이 준비되지 않았어요.
                </div>
            ) : (
                <div className="mt-3 flex-1 rounded-2xl bg-surface">
                    <ol className="flex flex-col">
                        {steps.map((step, idx) => (
                            <li key={`${step}-${idx}`} className="flex flex-col items-center">
                                {/* 단계 박스 */}
                                <div className="w-full rounded-xl bg-white/60 border border-primary-dark/25 px-4 py-3 text-sm text-textSecondary leading-relaxed shadow-sm text-center">
                                    {step}
                                </div>

                                {/* 아래 화살표 */}
                                {idx !== steps.length - 1 && (
                                    <div className="my-2 flex items-center justify-center text-primary-dark/60">
                                        <ChevronDown className="w-5 h-5" />
                                    </div>
                                )}
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
};

export default EmotionFlowCard;
