import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { signUp } from '../../api/authApi';

const SignupPage = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: '',
        password: '',
        passwordConfirm: '',
        nickname: '',
        age: '',
        gender: '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        if (!form.nickname.trim()) return '닉네임(표시 이름)을 입력해주세요.';
        if (!form.password) return '비밀번호를 입력해주세요.';
        if (form.password.length < 4) return '비밀번호는 4자 이상이면 좋아요.';
        if (form.password !== form.passwordConfirm) return '비밀번호 확인이 일치하지 않아요.';
        if (!form.email.trim()) return '이메일을 입력해주세요.';
        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');


        const v = validate();
        if (v) {
            setErrorMsg(v);
            return;
        }

        setIsLoading(true);

        try {
            const { passwordConfirm, ...payload } = form;
            await signUp(payload);

            setSuccessMsg('가입 신청이 완료됐어요. 관리자 승인 후 로그인할 수 있어요!');
            setTimeout(() => navigate('/login'), 2600);
        } catch (err) {
            setErrorMsg(err?.message || '가입신청에 실패했어요...');
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
                        나를 이해할 수 있는 거울. EUNOIA
                    </p>
                </motion.div>

                {/* 카드 */}
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.6 }}
                    className="rounded-2xl bg-white/70 backdrop-blur shadow-sm border border-black/5 p-6 md:p-7"
                >
                    <form onSubmit={handleSubmit} className="space-y-4">


                        {/* 닉네임 */}
                        <div>
                            <label className="block text-sm mb-1 text-gray-600">닉네임</label>
                            <input
                                name="nickname"
                                value={form.nickname}
                                onChange={handleChange}
                                placeholder='개구리'
                                className="w-full rounded-xl border border-black/10 bg-white/80 px-4 py-3 outline-none focus:ring-2 focus:ring-black/10"
                                autoComplete="nickname"
                            />
                        </div>

                        {/* 이메일 */}
                        <div>
                            <label className="block text-sm mb-1 text-gray-600">이메일</label>
                            <input
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="example@email.com"
                                className="w-full rounded-xl border border-black/10 bg-white/80 px-4 py-3 outline-none focus:ring-2 focus:ring-black/10"
                                autoComplete="email"
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
                                autoComplete="new-password"
                            />
                        </div>

                        {/* 비밀번호 확인 */}
                        <div>
                            <label className="block text-sm mb-1 text-gray-600">비밀번호 확인</label>
                            <input
                                type="password"
                                name="passwordConfirm"
                                value={form.passwordConfirm}
                                onChange={handleChange}
                                placeholder="비밀번호 확인"
                                className="w-full rounded-xl border border-black/10 bg-white/80 px-4 py-3 outline-none focus:ring-2 focus:ring-black/10"
                                autoComplete="new-password"
                            />
                        </div>
                        {/* 성별 선택 버튼 */}
                        <div>
                            <label className="block text-sm mb-2 text-gray-600">성별</label>

                            <div className="flex gap-2">
                                {[
                                    { label: '남성', value: 'MALE' },
                                    { label: '여성', value: 'FEMALE' },
                                    { label: '선택 안 함', value: 'NONE' },
                                ].map((g) => (
                                    <button
                                        key={g.value}
                                        type="button"
                                        onClick={() => setForm((prev) => ({ ...prev, gender: g.value }))}
                                        className={`flex-1 rounded-xl px-4 py-2 text-sm transition
                                          ${form.gender === g.value
                                                ? 'bg-black text-white'
                                                : 'bg-white/70 border border-black/10 text-gray-600 hover:bg-black/5'
                                            }
                                        `}
                                    >
                                        {g.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 나이 입력창 */}
                        <div>
                            <label className="block text-sm mb-1 text-gray-600">나이</label>
                            <input
                                type="number"
                                name="age"
                                value={form.age}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, age: e.target.value }))
                                }
                                placeholder="숫자만입력해주세요"
                                className="w-full rounded-xl border border-black/10 bg-white/80 px-4 py-3 outline-none focus:ring-2 focus:ring-black/10"
                                min={0}
                            />
                        </div>



                        {/* 안내/에러/성공 메시지 */}
                        {errorMsg && (
                            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                                {errorMsg}
                            </div>
                        )}

                        ️            {successMsg && (
                            <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">
                                {successMsg}
                            </div>
                        )}

                        {/* 가입 버튼 */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full rounded-xl py-3 text-sm font-medium bg-black text-white hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition"
                        >
                            {isLoading ? '요청 중...' : '회원가입 요청'}
                        </button>

                        {/* 하단 링크 */}
                        <div className="flex items-center justify-between pt-2 text-sm text-gray-500">
                            <Link to="/login" className="hover:text-gray-700 transition">
                                ← 로그인
                            </Link>

                            {/* <Link to="/" className="hover:text-gray-700 transition">
                                인트로로 →
                            </Link> */}
                        </div>
                    </form>
                </motion.div>

                {/* 하단 문구 */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35, duration: 0.8 }}
                    className="text-center text-xs text-gray-400 mt-6"
                >
                    가입은 요청 & 승인 형태로 진행됩니다.
                </motion.p>
            </div>
        </div>
    );
};

export default SignupPage;
