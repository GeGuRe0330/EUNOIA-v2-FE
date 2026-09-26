import { useEffect, useState } from "react";
import MainDashboard from "../../components/Maindashboard/MainDashboard";
import { getLatestAnalysis, getEmotionScores } from "../../api/EunoiaApi";
import CardMotion from "../../components/motion/CardMotion";
import EunoiaPageLinkButton from "../../components/common/EunoiaPageLinkButton";
import { useApiError } from "../../hooks/useApiError";
import { resolveDashboardView } from "./dashboardView";

const MainPage = () => {
    const { handleApiError } = useApiError();
    const [data, setData] = useState(null); // /latest 응답 — 분석이 없으면 null
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
                setLoading(false);
            } catch (err) {
                // 401은 세션 만료 → 로그인으로(②번 정책). 이동하는 동안 "기록 없음"이 잠깐 비치지 않도록 로딩 상태 유지
                if (err?.status === 401) {
                    handleApiError(err);
                    return;
                }
                setError(err.message);
                setLoading(false);
            }
        };

        fetchData();
    }, [handleApiError]);

    if (loading) return <div className="text-center">불러오는 중...</div>;
    if (error) return <div className="text-red-500 text-center">{error}</div>;

    const view = resolveDashboardView(data);

    // 계약에 없는 status — 카드를 그리면 null 필드 때문에 2차 오류가 나므로 안내로 대신함
    if (view.name === "invalid") {
        return <div className="text-red-500 text-center">분석 결과를 불러오지 못했어요.</div>;
    }

    // 분석이 하나도 없음(신규 회원 등) — 에러가 아닌 정상 상황, 레거시 화면 그대로
    if (view.name === "empty") {
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

    // 가장 최근 분석이 실패 — 분석 카드는 그릴 수 없어(나머지 필드가 null) 안내로 대신함
    if (view.name === "failed") {
        return (
            <div className="flex flex-col items-center justify-center h-full px-4 text-center">
                <CardMotion index={0}>
                    <div className="bg-surface/80 backdrop-blur-sm rounded-2xl shadow-md p-6 max-w-md border border-primary-dark/20">
                        <h2 className="text-lg font-semibold text-textPrimary mb-2">{view.reason}</h2>
                        <p className="text-sm text-textSecondary leading-relaxed mb-4">
                            가장 최근에 작성한 기록의 분석을 마치지 못했어요.<br />
                            작성한 기록은 남아있어요.
                        </p>
                        <div className="mt-5 flex justify-center">
                            <EunoiaPageLinkButton to="/write" message={"새 글 쓰기"} />
                        </div>
                    </div>
                </CardMotion>
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans px-4 py-8">
            <MainDashboard data={view.analysis} scoreDate={scoreData} />
        </div>
    );
};

export default MainPage;
