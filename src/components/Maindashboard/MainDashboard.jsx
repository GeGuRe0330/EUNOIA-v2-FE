import EmotionSummaryCard from "./dashboard/EmotionSummaryCard";
import EmotionFlowCard from "./dashboard/EmotionFlowCard";
import WarmMessageCard from "./dashboard/WarmMessageCard";
import InsightCard from "./dashboard/InsightCard";
import EmotionScoreChart from "./dashboard/EmotionScoreChart";
import CardMotion from "../motion/CardMotion";

const MainDashboard = ({ data, scoreDate }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 items-stretch">
            {/* 1) 감정 점수 흐름 (모바일 1st / 데스크탑 좌측 상단) */}
            <CardMotion index={0} className="order-1 h-full md:row-span-2">
                <div className="h-[260px] sm:h-[320px] md:h-full">
                    <EmotionScoreChart data={scoreDate} />
                </div>
            </CardMotion>

            {/* 2) 오늘의 감정 요약 (모바일 2nd / 데스크탑 우측 상단) */}
            <CardMotion index={1} className="order-2">
                <div className="h-auto">
                    <EmotionSummaryCard summary={data.emotionSummary} />
                </div>
            </CardMotion>

            {/* 3) 이번 분석에서 당신의 감정은 (모바일 3rd / 데스크탑 우측 영역 확장) */}
            <CardMotion
                index={2}
                className="
                        order-3
                        h-full
                        md:col-start-2
                        md:row-span-2
                        md:min-h-[380px]
                        "
            >
                <div className="h-full">
                    <EmotionFlowCard flowHint={data.flowHint} />
                </div>
            </CardMotion>

            {/* 4) 지금의 감정을 비춰보는 말 (모바일 4th / 데스크탑 좌측 하단) */}
            <CardMotion index={3} className="order-4 h-full md:col-start-1">
                <div className="h-full">
                    <WarmMessageCard messages={data.warmMessages} />
                </div>
            </CardMotion>

            {/* 5) EUNOIA가 본 당신 (모바일 5th / 데스크탑 하단 전체 span 크게) */}
            <CardMotion index={4} className="order-5 h-full md:col-span-2">
                <div className="h-full">
                    <InsightCard insight={data.insightSummary} />
                </div>
            </CardMotion>
        </div>
    );
};

export default MainDashboard;
