import { useEffect, useState } from 'react';
import { Frown, Smile } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

import { formatEntryDate, iconCenterY, SCORE_DOMAIN } from './chartData';

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

// Y축 눈금 — 점수 25(가라앉은 쪽)·75(편안한 쪽) 눈금에 찡그린·웃는 얼굴 아이콘을 그리고 나머지 눈금은 비운다
// 예전에는 컬러 이모지(😰😌)를 글자로 썼는데 차트의 갈색 톤과 따로 놀아서, 같은 의미를 단색 SVG(lucide)로 바꿨다
// 눈금 선(0·25·50·75·100)은 그대로 두고 아이콘만 가장자리 쪽으로 옮겼다 — 눈금 칸 기준으로 맨 아래 칸(0~25)과 맨 위 칸(75~100)의 한가운데(점수 12.5·87.5)에 놓아 너무 정갈하게 가운데 몰리지 않게 한다
const TICK_ICONS = {
    25: { Icon: Frown, at: 12.5 },
    75: { Icon: Smile, at: 87.5 },
};
const TICK_ICON_SIZE = 20;
// Y축 폭 = 아이콘 + 눈금 선과의 간격(4) + 여유 — 아이콘 크기를 바꿔도 잘리지 않게 크기에서 계산한다
const Y_AXIS_WIDTH = TICK_ICON_SIZE + 12;
const TICK_COLOR = '#7F5539'; // textSecondary

// recharts가 눈금마다 x·y(눈금 라벨의 오른쪽 끝)·height(축 길이)·payload(값)를 넘겨 준다. 차트 안은 SVG라 lucide 아이콘을 그대로 그릴 수 있다
export const ScoreTick = ({ x, y, height, payload }) => {
    const config = TICK_ICONS[payload?.value];
    if (!config) return null;

    const { Icon, at } = config;
    return (
        <Icon
            x={x - TICK_ICON_SIZE - 4}
            y={iconCenterY({ y, height, value: payload.value, at }) - TICK_ICON_SIZE / 2}
            size={TICK_ICON_SIZE}
            color={TICK_COLOR}
            aria-hidden="true"
        />
    );
};

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
                            domain={SCORE_DOMAIN}
                            ticks={[0, 25, 50, 75, 100]}
                            tick={(props) => <ScoreTick {...props} />}
                            width={Y_AXIS_WIDTH}
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
