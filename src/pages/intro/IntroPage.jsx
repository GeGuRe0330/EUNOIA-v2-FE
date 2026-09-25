import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const IntroPage = () => {
    const navigate = useNavigate();
    const [showIntro, setShowIntro] = useState(true);
    const [fadeOut, setFadeOut] = useState(false);

    // 클릭 시 페이드 아웃 후 대시보드 이동
    const handleClick = () => {
        setFadeOut(true);
        setTimeout(() => {
            setShowIntro(false);
            navigate('/login');
        }, 2000); // 페이드아웃 후 이동 타이밍
    };

    return (
        <div
            onClick={handleClick}
            className="h-screen w-full flex flex-col items-center justify-center text-textPrimary font-sans cursor-pointer"
        >
            <AnimatePresence>
                {showIntro && (
                    <>
                        {/* 1. EUNOIA 타이틀 */}
                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: fadeOut ? 0 : 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 0.8, duration: 1 }}
                            className="font-serif text-6xl md:text-7xl mb-6"
                        >
                            EUNOIA
                        </motion.h1>

                        {/* 2. 서브 문구 */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: fadeOut ? 0 : 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="px-6 py-3 rounded-lg text-lg md:text-xl text-black"
                        >
                            감정의 흐름을 따라 나를 마주하는 여정
                        </motion.div>

                        {/* 3. 하단 깜빡이는 문구 */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={
                                fadeOut
                                    ? { opacity: 0, transition: { duration: 0.5 } } // 클릭 시 빠르게 사라지기
                                    : { opacity: [0, 1, 0], transition: { repeat: Infinity, duration: 2, delay: 2 } } // 깜빡임
                            }
                            className="text-gray-400 text-base mt-20"
                        >
                            - 시작하려면 화면을 클릭하세요 -
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default IntroPage;
