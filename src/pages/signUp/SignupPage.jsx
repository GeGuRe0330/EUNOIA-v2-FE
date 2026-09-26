import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { signUp } from '../../api/authApi';

// 입력칸 아래 필드별 오류 문구
const FieldError = ({ message }) =>
    message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null;

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
    const [errorMsg, setErrorMsg] = useState(''); // 필드가 아닌 오류(중복 이메일, 네트워크 등)
    const [fieldErrors, setFieldErrors] = useState({}); // { 필드명: 문구 } — 클라이언트 검증 + 서버 fieldErrors
    const [successMsg, setSuccessMsg] = useState('');

    // 값을 바꾸면 해당 필드 오류는 지움
    const updateField = (name, value) => {
        setForm((prev) => ({ ...prev, [name]: value }));
        setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const handleChange = (e) => updateField(e.target.name, e.target.value);

    // 입력 검증 문구는 프론트 담당(OVERVIEW §5.2) — 이메일 형식은 서버 기준에 맡김
    const validate = () => {
        const errors = {};
        if (!form.nickname.trim()) errors.nickname = '닉네임(표시 이름)을 입력해 주세요.';
        if (!form.email.trim()) errors.email = '이메일을 입력해 주세요.';
        if (!form.password) errors.password = '비밀번호를 입력해 주세요.';
        else if (form.password.length < 4) errors.password = '비밀번호는 4자 이상이면 좋아요.';
        if (form.password !== form.passwordConfirm) errors.passwordConfirm = '비밀번호 확인이 일치하지 않아요.';
        if (!form.gender) errors.gender = '성별을 선택해 주세요.';
        if (form.age === '') errors.age = '나이를 입력해 주세요.';
        else if (!Number.isInteger(Number(form.age)) || Number(form.age) < 0) errors.age = '나이는 0 이상의 정수로 입력해 주세요.';
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        const errors = validate();
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setIsLoading(true);

        try {
            const { passwordConfirm: _passwordConfirm, ...rest } = form;
            // 빈 값은 ""가 아니라 null로 — ""는 서버 JSON 변환 단계에서 실패함
            await signUp({
                ...rest,
                age: form.age === '' ? null : Number(form.age),
                gender: form.gender || null,
            });

            setSuccessMsg('가입 신청이 완료됐어요. 관리자 승인 후 로그인할 수 있어요!');
            setTimeout(() => navigate('/login'), 2600);
        } catch (err) {
            // 서버 fieldErrors는 해당 입력칸 아래에, 그 외 오류는 상단 박스에
            if (err.fieldErrors.length > 0) {
                setFieldErrors(Object.fromEntries(err.fieldErrors.map((fe) => [fe.field, fe.message])));
            } else {
                setErrorMsg(err.message);
            }
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
                            <FieldError message={fieldErrors.nickname} />
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
                            <FieldError message={fieldErrors.email} />
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
                            <FieldError message={fieldErrors.password} />
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
                            <FieldError message={fieldErrors.passwordConfirm} />
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
                                        onClick={() => updateField('gender', g.value)}
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
                            <FieldError message={fieldErrors.gender} />
                        </div>

                        {/* 나이 입력창 */}
                        <div>
                            <label className="block text-sm mb-1 text-gray-600">나이</label>
                            <input
                                type="number"
                                name="age"
                                value={form.age}
                                onChange={handleChange}
                                placeholder="숫자만입력해주세요"
                                className="w-full rounded-xl border border-black/10 bg-white/80 px-4 py-3 outline-none focus:ring-2 focus:ring-black/10"
                                min={0}
                            />
                            <FieldError message={fieldErrors.age} />
                        </div>



                        {/* 안내/에러/성공 메시지 */}
                        {errorMsg && (
                            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                                {errorMsg}
                            </div>
                        )}

                        {successMsg && (
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
