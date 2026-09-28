import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getAnalysisByEntry } from '../../api/EunoiaApi';
import { useApiError } from '../../hooks/useApiError';
import { pollAnalysis } from './pollAnalysis';
import { resolveLoadingView } from './loadingView';

// 따뜻한 말 한 문장이 화면에 머무는 시간(ms, 페이드 인·아웃 포함)
const MESSAGE_MS = 5_500;
// 문구 전환은 CSS 키프레임(tailwind.config.js의 fade-in / fade-out / message-fade)으로 처리.
// 한 문장 = 하나의 애니메이션(0 → 1 → 유지 → 0)이라 끝나는 시점에 이미 투명해 다음 문장으로 바뀔 때 튀지 않음.
// (AnimatePresence의 exit로 교체하거나 JS 애니메이션으로 0 → 1을 끝내면 전환 순간 한 프레임 깜빡이는 현상이 있었음)
const MESSAGE_ANIMATION_STYLE = { animationDuration: `${MESSAGE_MS - 100}ms` }; // 타이머보다 살짝 먼저 끝나 교체 시점엔 확실히 투명

const primaryButton = 'block w-full rounded-xl py-3 text-sm font-medium bg-black text-white hover:opacity-90 transition text-center';
const secondaryButton = 'block w-full rounded-xl py-3 text-sm font-medium border border-black/10 bg-white/70 hover:bg-white transition text-center';

// 결과 안내 카드(상한 초과 / 실패 / 오류)
const NoticeCard = ({ title, message, children }) => (
    <div className="w-full max-w-md rounded-2xl bg-white/70 backdrop-blur shadow-sm border border-black/5 p-6 md:p-7 text-center">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p className="text-sm text-gray-600 mb-6 whitespace-pre-line">{message}</p>
        <div className="space-y-2">{children}</div>
    </div>
);

const AnalysisProgress = ({ entryId }) => {
    const navigate = useNavigate();
    const { handleApiError } = useApiError();
    const [view, setView] = useState({ name: 'waiting' });
    const [messageIndex, setMessageIndex] = useState(0);
    const [attempt, setAttempt] = useState(0); // "다시 확인하기"로 폴링을 다시 시작할 때 증가

    // 분석 결과가 나올 때까지 폴링 — 서버가 일기 작성 이벤트로 분석을 자동 진행함
    useEffect(() => {
        const controller = new AbortController();

        pollAnalysis({ fetchAnalysis: () => getAnalysisByEntry(entryId), signal: controller.signal })
            .then((result) => {
                const next = resolveLoadingView(result);
                if (next.name === 'cancelled') return;
                if (next.name === 'done') {
                    navigate('/dashboard', { replace: true });
                    return;
                }
                setMessageIndex(0);
                setView(next);
            })
            .catch((err) => {
                if (controller.signal.aborted) return;
                // 401은 세션 만료 → 로그인으로, 그 외(403/5xx/네트워크)는 이 화면에서 안내
                if (err?.status === 401) handleApiError(err);
                else setView({ name: 'error', message: err?.message });
            });

        return () => controller.abort();
    }, [entryId, attempt, navigate, handleApiError]);

    // 따뜻한 말을 한 문장씩 보여주고, 마지막 문장 뒤 대시보드로
    useEffect(() => {
        if (view.name !== 'messages') return;

        const timer = setTimeout(() => {
            if (messageIndex < view.messages.length - 1) setMessageIndex((i) => i + 1);
            else navigate('/dashboard', { replace: true });
        }, MESSAGE_MS);

        return () => clearTimeout(timer);
    }, [view, messageIndex, navigate]);

    const retry = () => {
        setView({ name: 'waiting' });
        setAttempt((n) => n + 1);
    };

    if (view.name === 'timeout') {
        return (
            <div className="flex flex-col items-center justify-center h-full px-4">
                <NoticeCard
                    title="분석이 오래 걸리고 있어요."
                    message={'기록은 저장됐어요.\n분석이 끝나면 대시보드에 나타나요.'}
                >
                    <Link to="/dashboard" replace className={primaryButton}>대시보드로</Link>
                </NoticeCard>
            </div>
        );
    }

    if (view.name === 'failed') {
        return (
            <div className="flex flex-col items-center justify-center h-full px-4">
                <NoticeCard title={view.reason} message="작성한 기록은 저장돼 있어요.">
                    <Link to="/write" replace className={primaryButton}>새 글 쓰기</Link>
                    <Link to="/dashboard" replace className={secondaryButton}>대시보드로</Link>
                </NoticeCard>
            </div>
        );
    }

    if (view.name === 'error') {
        return (
            <div className="flex flex-col items-center justify-center h-full px-4">
                <NoticeCard title="분석 결과를 확인하지 못했어요." message={view.message}>
                    <button type="button" onClick={retry} className={primaryButton}>다시 확인하기</button>
                    <Link to="/dashboard" replace className={secondaryButton}>대시보드로</Link>
                </NoticeCard>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full bg-[#fdfaf6] text-gray-800 rounded-xl">
            {/* 분석 문구 */}
            <div className="text-xl md:text-2xl font-semibold mb-4">
                EUNOIA가 당신의 글을 읽고 있어요...
            </div>
            <div className="text-sm mb-10 text-gray-500">
                여기까지 잘 걸어왔어요. 잠시만 기다려주세요 🤍
            </div>

            {/* 문구 자리 — 대기 문구와 따뜻한 말을 같은 자리에 겹쳐 두고 크로스페이드 */}
            <div className="relative w-full h-12 min-h-[48px]">
                <p
                    className={`absolute inset-0 flex items-center justify-center text-gray-500 text-lg font-medium text-center ${
                        view.name === 'waiting' ? 'animate-fade-in' : 'animate-fade-out'
                    }`}
                    aria-hidden={view.name !== 'waiting'}
                >
                    EUNOIA가 당신에게 전할 말을 고르고 있어요.
                </p>

                {view.name === 'messages' && (
                    <p
                        key={messageIndex}
                        style={MESSAGE_ANIMATION_STYLE}
                        className="absolute inset-0 flex items-center justify-center text-gray-700 text-2xl font-semibold text-center px-4 opacity-0 animate-message-fade"
                    >
                        “{view.messages[messageIndex]}”
                    </p>
                )}
            </div>

            {/* 스피너 */}
            <div className="mt-10 w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );
};

const LoadingPage = () => {
    const entryId = useLocation().state?.entryId;

    // entryId state 없이 들어온 경우(주소 직접 입력·북마크·새 탭) — 이어서 보여줄 분석 정보가 없으므로 조용히 대시보드로.
    // (새로고침은 history state가 유지돼 여기로 오지 않고 폴링이 재개됨. 분석은 서버에서 계속 진행되므로 대시보드에서 확인 가능)
    if (!entryId) return <Navigate to="/dashboard" replace />;

    return <AnalysisProgress entryId={entryId} />;
};

export default LoadingPage;
