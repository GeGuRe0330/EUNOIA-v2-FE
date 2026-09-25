import { useEffect, useState } from "react";
import MainDashboard from "../../components/Maindashboard/MainDashboard";
import { getLatestAnalysis, getEmotionScores } from "../../api/EunoiaApi";
import CardMotion from "../../components/motion/CardMotion";
import EunoiaPageLinkButton from "../../components/common/EunoiaPageLinkButton";

const MainPage = () => {
    const [data, setData] = useState(null);
    const [scoreData, setScoreData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [latest, scores] = await Promise.all([
                    getLatestAnalysis(),
                    getEmotionScores()
                ]);
                setData(latest);
                setScoreData(scores);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="text-center">불러오는 중...</div>;
    if (!data && error === "아직 분석 결과가 없습니다.") {
        return (
            <div className="flex flex-col items-center justify-center h-full px-4 text-center">
                <CardMotion index={0}>
                    <div className="bg-surface/80 backdrop-blur-sm rounded-2xl shadow-md p-6 max-w-md border border-primary-dark/20">
                        <h2 className="text-lg font-semibold text-textPrimary mb-2">
                            아직 기록된 감정이 없어요.
                        </h2>

                        <p className="text-sm text-textSecondary leading-relaxed mb-4">
                            괜찮다면...<br />
                            가볍게 오늘 하루는 어땠는지 저에게 얘기해줄래요?
                        </p>

                        <p className="text-xs text-textSecondary/80 italic">
                            무의식적으로 지나갔을 당신의 감정 흐름을 거울처럼 비춰드릴게요.
                        </p>
                        <div className="mt-5 flex justify-center">
                            <EunoiaPageLinkButton to="/write" message={"감정글 작성"} />
                        </div>
                    </div>
                </CardMotion>
            </div>
        );
    }
    if (error) return <div className="text-red-500 text-center">{error}</div>;

    return (
        <div className="min-h-screen font-sans px-4 py-8">
            <MainDashboard data={data} scoreDate={scoreData} />
        </div>
    );
};

export default MainPage;
