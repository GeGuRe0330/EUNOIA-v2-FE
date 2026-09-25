import { useEffect, useState } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

function formatDate(isoString) {
    const date = new Date(isoString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}/${day}`;
}
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

    const formattedData = data.map(item => ({
        ...item,
        createdAt: item.createdAt,
        score: item.emotionScore
    }));


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

                        <XAxis dataKey="createdAt" interval={isMobile ? 1 : 0} height={30} tickFormatter={(iso) => formatDate(iso)} />

                        <YAxis
                            domain={[0, 100]}
                            ticks={[0, 25, 50, 75, 100]}
                            tickFormatter={(v) => ({ 25: "😰", 75: "😌" }[v] || "")}
                            width={22}
                        />

                        <Tooltip labelFormatter={(iso) => formatDate(iso)} />

                        <Area
                            type="monotone"
                            dataKey="score"
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
