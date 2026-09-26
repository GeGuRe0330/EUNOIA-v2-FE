import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useRouteLoaderData } from 'react-router-dom';
import { approveMember, getPendingMembers } from '../../api/admin';
import { useApiError } from '../../hooks/useApiError';
import { isAdmin } from '../../utils/role';

// 관리자 전용 — 메뉴는 role로 이미 숨겨져 있어, URL로 직접 들어온 경우 안내 (실제 권한은 백엔드 hasRole("ADMIN"))
const AdminPendingPage = () => {
    const me = useRouteLoaderData('layout');
    return isAdmin(me) ? <PendingMemberList /> : <AdminOnlyNotice />;
};

const AdminOnlyNotice = () => (
    <div className="min-h-[60vh] w-full flex items-center justify-center font-sans text-textPrimary px-4">
        <div className="w-full max-w-md rounded-2xl bg-white/70 backdrop-blur shadow-sm border border-black/5 p-6 md:p-7 text-center">
            <h1 className="text-lg font-semibold mb-2">관리자만 접근할 수 있어요.</h1>
            <p className="text-sm text-gray-600 mb-6">관리자 계정으로 로그인한 경우에만 이 화면을 볼 수 있어요.</p>
            <Link
                to="/dashboard"
                className="block w-full rounded-xl py-3 text-sm font-medium bg-black text-white hover:opacity-90 transition"
            >
                대시보드로
            </Link>
        </div>
    </div>
);

const PendingMemberList = () => {
    const navigate = useNavigate();
    const { handleApiError } = useApiError();
    const [pending, setPending] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    // 승인 성공 안내(레거시에 없던 UX) — { id, text }로 두어 같은 문구가 연달아 와도 타이머가 새로 시작되게
    const [approvedNotice, setApprovedNotice] = useState(null);

    const count = useMemo(() => pending.length, [pending]);

    const fetchPending = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await getPendingMembers();
            setPending(res ?? []);
        } catch (err) {
            handleApiError(err);

        } finally {
            setIsLoading(false);
        }
    }, [handleApiError]);

    const handleApprove = async (id) => {
        if (!id) return;
        setActionLoadingId(id);
        const target = pending.find((m) => m.id === id);

        try {
            await approveMember(id);
            setPending((prev) => prev.filter((m) => m.id !== id));
            setApprovedNotice({ id, text: `${target?.nickname ?? '회원'} 님을 승인했어요.` });
        } catch (err) {
            setApprovedNotice(null);
            handleApiError(err);
        } finally {
            setActionLoadingId(null);
        }
    };

    useEffect(() => {
        fetchPending();
    }, [fetchPending]);

    // 승인 안내는 3초 뒤 사라짐
    useEffect(() => {
        if (!approvedNotice) return;
        const timer = setTimeout(() => setApprovedNotice(null), 3000);
        return () => clearTimeout(timer);
    }, [approvedNotice]);

    return (
        <div className="min-h-screen w-full flex justify-center text-textPrimary font-sans">
            <div className="w-full max-w-4xl px-4 sm:px-6 py-6 sm:py-10">
                {/* 헤더 */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                    <div className="min-w-0">
                        <h1 className="text-3xl md:text-4xl font-handwriting">Admin · 승인 대기</h1>
                        <p className="text-sm text-gray-500 mt-2">
                            현재까지 승인 대기중인 회원 목록입니다.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:justify-end">
                        <button
                            onClick={fetchPending}
                            className="w-full sm:w-auto rounded-xl border border-black/10 bg-white/70 px-4 py-2 text-sm hover:bg-white transition whitespace-nowrap"
                            disabled={isLoading}
                        >
                            새로고침
                        </button>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full sm:w-auto rounded-xl border border-black/10 bg-white/70 px-4 py-2 text-sm hover:bg-white transition whitespace-nowrap"
                        >
                            대시보드로
                        </button>
                    </div>
                </div>


                {/* 상태 */}
                <div className="mb-4 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        현재 대기 인원: <span className="font-semibold">{count}</span> 명
                    </div>
                </div>

                {/* 승인 안내 */}
                {approvedNotice && (
                    <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">
                        {approvedNotice.text}
                    </div>
                )}

                {/* 로딩 */}
                {isLoading ? (
                    <div className="rounded-2xl border border-black/10 bg-white/70 p-8">
                        <div className="text-sm text-gray-500">대기 목록 불러오는 중...</div>
                    </div>
                ) : pending.length === 0 ? (
                    <div className="rounded-2xl border border-black/10 bg-white/70 p-10 text-center">
                        <div className="text-lg font-semibold">대기 중인 회원이 없어요 🎉</div>
                        <div className="text-sm text-gray-500 mt-2">
                            새로운 가입 요청이 들어오면 이 곳에서 확인할 수 있어요.
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pending.map((m) => (
                            <div
                                key={m.id}
                                className="rounded-2xl border border-black/10 bg-white/75 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                            >
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-base font-semibold truncate">{m.nickname ?? '(닉네임 없음)'}</span>
                                        <span className="text-xs rounded-full bg-black/5 px-2 py-1">
                                            #{m.id}
                                        </span>
                                        <span className="text-xs rounded-full bg-black/5 px-2 py-1">
                                            {m.status ?? 'PENDING'}
                                        </span>
                                        <span className="text-xs rounded-full bg-black/5 px-2 py-1">
                                            {m.role ?? 'USER'}
                                        </span>
                                    </div>

                                    <div className="text-sm text-gray-600 mt-2 break-all">
                                        {m.email}
                                    </div>

                                    <div className="text-xs text-gray-500 mt-2 flex flex-wrap gap-3">
                                        <span>나이: {m.age ?? '-'}</span>
                                        <span>성별: {m.gender ?? '-'}</span>
                                        <span>
                                            가입일: {m.createdAt ? new Date(m.createdAt).toLocaleString() : '-'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleApprove(m.id)}
                                        disabled={actionLoadingId === m.id}
                                        className="rounded-xl bg-black text-white px-4 py-2 text-sm hover:opacity-90 transition disabled:opacity-50"
                                    >
                                        {actionLoadingId === m.id ? '승인 중...' : '승인'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 푸터 도움말 */}
                <div className="mt-10 text-xs text-gray-400">
                    승인을 누르면 해당 계정은 <span className="font-semibold text-black">즉시 로그인 가능</span>.
                </div>
            </div>
        </div>
    );
};

export default AdminPendingPage;
