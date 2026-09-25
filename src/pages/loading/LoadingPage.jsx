import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getEmotionEntry, postWarmMessages, updateAnalysis } from '../../api/EunoiaApi';
import { motion, AnimatePresence } from 'framer-motion';
import { useApiError } from '../../hooks/useApiError';

const LoadingPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { handleApiError } = useApiError();
    const entryId = location.state?.entryId;

    const [warmMessages, setWarmMessages] = useState([]);
    const [visibleIndex, setVisibleIndex] = useState(0);

    // 체류 시간 (초)
    const MIN_STAY_MS = 18_500;

    // 분석 실행
    useEffect(() => {
        let cancelled = false;

        const minStay = new Promise((resolve) => setTimeout(resolve, MIN_STAY_MS));

        const run = async () => {
            try {
                if (!entryId) throw new Error("entryId 없음");

                // 1) 분석 실행
                const entry = await getEmotionEntry(entryId);
                const warm = await postWarmMessages(entryId, { content: entry.content });
                await updateAnalysis(entryId);

                if (!cancelled) {
                    setWarmMessages(warm.warmMessages);
                    setVisibleIndex(0);
                }

                await minStay;

                if (!cancelled) {
                    navigate("/dashboard", { replace: true });
                }
            } catch (err) {
                if (!cancelled) {
                    handleApiError(err);
                }
            }
        };

        run();

        return () => {
            cancelled = true;
        };
    }, [entryId, handleApiError, navigate]);


    // 메시지 순차 전환
    useEffect(() => {
        if (warmMessages.length === 0) return;

        const interval = setInterval(() => {
            setVisibleIndex((prev) => (prev + 1) % warmMessages.length);
        }, 5500);

        return () => clearInterval(interval);
    }, [warmMessages]);

    return (
        <div className="flex flex-col items-center justify-center h-full bg-[#fdfaf6] text-gray-800 rounded-xl">
            {/* 분석 문구 */}
            <div className="text-xl md:text-2xl font-semibold mb-4">
                EUNOIA가 당신의 글을 읽고 있어요...
            </div>
            <div className="text-sm mb-10 text-gray-500">
                여기까지 잘 걸어왔어요. 잠시만 기다려주세요 🤍
            </div>

            {/* 메시지 출력 */}
            <div className="h-12 min-h-[48px] flex items-center justify-center">
                {warmMessages.length > 0 ? (
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={visibleIndex}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.2 }}
                            className="text-gray-700 text-2xl font-semibold text-center px-4"
                        >
                            “{warmMessages[visibleIndex]}”
                        </motion.p>
                    </AnimatePresence>
                ) : (
                    <motion.p
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2 }}
                        className="text-gray-500 text-lg font-medium text-center"
                    >
                        EUNOIA가 당신에게 전할 말을 고르고 있어요.
                    </motion.p>
                )}
            </div>

            {/* 스피너 */}
            <div className="mt-10 w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );
};

export default LoadingPage;
