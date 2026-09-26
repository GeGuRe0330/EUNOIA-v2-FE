import { useEffect, useState } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

import { formatEntryDate } from './chartData';

function useIsMobile(breakpoint = 640) {
    const [isMobile, setIsMobile] = useState(
        window.matchMedia(`(max-width: ${breakpoint}px)`).matches
    );

    useEffect(() => {
        const media = window.matchMedia(`(max-width: ${breakpoint}px)`);
        const handler = () => setIsMobile(media.matches);
        media.addEventListener("change", handler);
        return () => media.removeEventListener("change", handler);
    }, [breakpoint]);

    return isMobile;
}

const EmotionScoreChart = ({ data }) => {
    const isMobile = useIsMobile();

    if (!data || !Array.isArray(data)) {
        return <div>감정 점수 데이터를 불러오는 중입니다...</div>;
    }

    // /analyses/scores: [{ entryId, entryDate, emotionScore }] — 최근 7건, SUCCESS만, entryDate 오름차순
    const formattedData = data.map(item => ({
        ...item,
        score: item.emotionScore
    }));
    // x축 라벨용: entryId → entryDate (모바일에서 라벨을 걸러 표시하면 tickFormatter의 index가 원본 순번이 아니라서 값으로 찾음)
    const dateByEntryId = new Map(data.map(item => [item.entryId, item.entryDate]));


    return (
        <div className="bg-surface p-3 md:p-4 rounded-xl shadow-sm h-full flex flex-col">
            <h2 className="text-textPrimary font-bold text-lg mb-4 shrink-0">
                감정 점수 흐름
            </h2>

            {/* 차트 영역: 남은 공간을 전부 차지 */}
            <div className="flex-1 min-h-auto">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={formattedData}
                        margin={{ top: 6, right: 20, left: 10, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="eunoiaFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#E6CFC1" stopOpacity={0.55} />
                                <stop offset="95%" stopColor="#E6CFC1" stopOpacity={0.05} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="10 5" stroke="rgba(92, 58, 33, 0.10)" />

                        {/* x축 키는 고유한 entryId — entryDate는 같은 날 일기 여러 건이 겹칠 수 있어 키로 쓰면 툴팁이 항상 첫 번째 점을 가리킴. 라벨(날짜)은 데이터에서 꺼냄 */}
                        <XAxis
                            dataKey="entryId"
                            interval={isMobile ? 1 : 0}
                            height={30}
                            tickFormatter={(entryId) => formatEntryDate(dateByEntryId.get(entryId))}
                        />

                        <YAxis
                            domain={[0, 100]}
                            ticks={[0, 25, 50, 75, 100]}
                            tickFormatter={(v) => ({ 25: "😰", 75: "😌" }[v] || "")}
                            width={22}
                        />

                        <Tooltip labelFormatter={(_, payload) => formatEntryDate(payload?.[0]?.payload?.entryDate)} />

                        <Area
                            type="monotone"
                            dataKey="score"
                            name="감정점수"
                            stroke="#B08968"
                            strokeWidth={2}
                            fill="url(#eunoiaFill)"
                            dot={{ r: isMobile ? 3 : 4 }}
                            activeDot={{ r: isMobile ? 4 : 6 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

};

export default EmotionScoreChart;
