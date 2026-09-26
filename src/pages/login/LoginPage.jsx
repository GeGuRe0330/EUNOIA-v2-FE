import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { login } from '../../api/authApi';


const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // 폼 상태
    const [form, setForm] = useState({
        username: '',
        password: '',
    });

    // UI 상태
    const [isLoading, setIsLoading] = useState(false);
    // 로그인 실패 메시지 자리 — 세션 만료로 넘어온 경우(useApiError) 그 안내로 시작
    const [errorMsg, setErrorMsg] = useState(location.state?.message ?? '');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setIsLoading(true);

        try {
            await login({ username: form.username, password: form.password });
            navigate('/dashboard');

        } catch (err) {
            const message = err.message || '로그인에 실패했어요. 잠시 후 다시 시도해주세요.';
            setErrorMsg(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center font-sans text-textPrimary px-4">
            <div className="w-full max-w-md">
                {/* 상단 타이틀 */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-5xl md:text-6xl font-serif mb-3">EUNOIA</h1>
                    <p className="text-sm md:text-base text-gray-500">
                        다시 돌아온 당신을 환영합니다.
                    </p>
                </motion.div>

                {/* 카드 */}
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.6 }}
                    className="rounded-2xl bg-white/70 backdrop-blur shadow-sm border border-black/5 p-6 md:p-7"
                >
                    <form onSubmit={handleSubmit} action="#" className="space-y-4">
                        {/* 아이디 */}
                        <div>
                            <label className="block text-sm mb-1 text-gray-600">이메일</label>
                            <input
                                name="username"
                                value={form.username}
                                onChange={handleChange}
                                placeholder="아이디"
                                className="w-full rounded-xl border border-black/10 bg-white/80 px-4 py-3 outline-none focus:ring-2 focus:ring-black/10"
                                autoComplete="username"
                            />
                        </div>

                        {/* 비밀번호 */}
                        <div>
                            <label className="block text-sm mb-1 text-gray-600">비밀번호</label>
                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="비밀번호"
                                className="w-full rounded-xl border border-black/10 bg-white/80 px-4 py-3 outline-none focus:ring-2 focus:ring-black/10"
                                autoComplete="current-password"
                            />
                        </div>

                        {/* 에러 메시지 */}
                        {errorMsg && (
                            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                                {errorMsg}
                            </div>
                        )}

                        {/* 로그인 버튼 */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full rounded-xl py-3 text-sm font-medium bg-black text-white hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition"
                        >
                            {isLoading ? '로그인 중...' : '로그인'}
                        </button>

                        {/* 하단 링크 */}
                        <div className="flex items-center justify-between pt-2 text-sm text-gray-500">
                            <Link to="/" className="hover:text-gray-700 transition">
                                ← 뒤로가기
                            </Link>

                            <Link to="/signup" className="hover:text-gray-700 transition">
                                회원가입 →
                            </Link>
                        </div>
                    </form>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35, duration: 0.8 }}
                    className="text-center text-xs text-gray-400 mt-6"
                >
                    당신의 기록은 당신만 볼 수 있어요. EUNOIA는 그저 조용히 비춰줄게요.
                </motion.p>
            </div>
        </div>
    );
};

export default LoginPage;
