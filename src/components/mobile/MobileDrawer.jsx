import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
    { to: "/dashboard", label: "감정 대시보드" },
    { to: "/MetaAnalysisPage", label: "비춰지는 내모습 [BETA]" },
    { to: "/write", label: "감정 기록하기" },
    { to: "/about", label: "유노이아란?" },
    { to: "/roadmap", label: "개발 로드맵" },
];

const ANIM_MS = 650;

const MobileDrawer = ({ open, onClose, me, onLogout }) => {
    const location = useLocation();

    // DOM 유지
    const [mounted, setMounted] = useState(open);
    // 애니메이션 상태(열림/닫힘)
    const [visible, setVisible] = useState(false);

    const isActive = (path) =>
        location.pathname === path || location.pathname.startsWith(path);

    const adminItems = useMemo(
        () => (me?.role === "ADMIN" ? [{ to: "/pendinglist", label: "관리자 승인" }] : []),
        [me?.role]
    );

    const linkClass = (active) =>
        [
            "px-4 py-3 rounded-xl text-base",
            "transition-all duration-200",
            "hover:bg-white/40",
            active
                ? "bg-white/60 font-semibold border-l-4 border-primary-dark"
                : "text-gray-800",
            visible ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0",
        ].join(" ");

    // open -> mounted/visible 제어
    useEffect(() => {
        if (open) {
            setMounted(true);
            setVisible(false);

            // 미리 닫아둔 체로 렌더하고 안전핀으로 2프레임 미리 렌더
            const raf1 = requestAnimationFrame(() => {
                const raf2 = requestAnimationFrame(() => {
                    setVisible(true);
                });
                return () => cancelAnimationFrame(raf2);
            });

            return () => cancelAnimationFrame(raf1);
        }

        setVisible(false);
        const t = setTimeout(() => setMounted(false), ANIM_MS);
        return () => clearTimeout(t);
    }, [open]);


    // 스크롤 잠금은 open 기준(원래대로 유지)
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    // ESC 닫기 (테블릿PC의 경우)
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    if (!mounted) return null;

    return (
        <div className="md:hidden fixed inset-0 z-50">
            {/* Dim */}
            <div
                className={`
          absolute inset-0 bg-black/30
          transition-opacity duration-650
          ${visible ? "opacity-100" : "opacity-0"}
        `}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel */}
            <aside
                className={`
          absolute top-0 right-0 h-full w-72
          bg-primary-light shadow-2xl p-6 font-handwriting
          transform transition-transform duration-650
          ease-[cubic-bezier(0.22,1,0.36,1)]
          ${visible ? "translate-x-0" : "translate-x-full"}
        `}
                role="dialog"
                aria-modal="true"
                aria-label="모바일 네비게이션"
            >
                {/* 상단 */}
                <div className="flex items-center justify-between">
                    <div className="text-xl font-bold text-primary-dark font-serif">EUNOIA</div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl bg-white/50 hover:bg-white/70 transition px-3 py-2 text-sm font-semibold shadow-sm border-[1px] border-primary/70"
                        aria-label="메뉴 닫기"
                    >
                        ✕
                    </button>
                </div>

                {/* 유저 박스 */}
                <div className="mt-6 rounded-2xl bg-white/45 p-4 text-center border-2 border-primary-dark/40">
                    <div className="font-sans font-semibold text-textPrimary">
                        {me?.nickname ? `${me.nickname} 님` : "반가워요!"}
                    </div>
                    <div className="font-serif mt-1 text-sm text-textSecondary truncate">
                        {me?.email}
                    </div>

                    {me?.role === "ADMIN" && (
                        <div className="font-serif mt-2 inline-block rounded-md bg-primary-dark/90 px-2 py-0.5 text-xs font-semibold text-white">
                            ADMIN
                        </div>
                    )}
                </div>

                {/* 메뉴 */}
                <nav className="mt-6 flex flex-col gap-2 font-sans">
                    {navItems.map((item, idx) => (
                        <Link
                            key={item.to}
                            to={item.to}
                            onClick={onClose}
                            className={linkClass(isActive(item.to))}
                            style={{ transitionDelay: visible ? `${idx * 85}ms` : "0ms" }}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* 하단 */}
                <div className="mt-6 pt-4 border-t border-white/40">
                    {adminItems.length > 0 && (
                        <div className="flex flex-col gap-2 mb-4 font-sans">
                            {adminItems.map((item, idx) => (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    onClick={onClose}
                                    className={linkClass(isActive(item.to))}
                                    style={{
                                        transitionDelay: visible
                                            ? `${(navItems.length + idx) * 85}ms`
                                            : "0ms",
                                    }}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            onLogout();
                        }}
                        className="w-full rounded-xl bg-white/50 hover:bg-white/70 transition px-4 py-3 text-sm font-sans border-2 border-primary-dark/40"
                    >
                        로그아웃
                    </button>
                </div>
            </aside>
        </div>
    );
};

export default MobileDrawer;
