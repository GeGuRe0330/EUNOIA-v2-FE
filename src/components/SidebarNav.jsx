import { Link, useLocation } from "react-router-dom";

const navItems = [
    { to: "/dashboard", label: "감정 대시보드" },
    { to: "/MetaAnalysisPage", label: "비춰지는 내모습[BETA]" },
    { to: "/write", label: "감정 기록하기" },
    { to: "/about", label: "유노이아란?" },
    { to: "/roadmap", label: "개발 로드맵" },
];

const SidebarNav = ({ me, onLogout }) => {
    const location = useLocation();

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path);

    const adminItems =
        me?.role === "ADMIN"
            ? [{ to: "/pendinglist", label: "관리자 승인" }]
            : [];

    const linkClass = (active) =>
        [
            "px-3 py-2 rounded-lg transition-all",
            "hover:bg-white/40",
            active
                ? "bg-white/60 font-semibold border-l-4 border-primary-dark"
                : "text-gray-800",
        ].join(" ");

    return (
        <aside className="fixed top-0 left-0 h-full w-52 bg-primary-light text-gray-800 shadow-md p-6 font-sans z-50 flex flex-col">
            {/* Logo */}
            <div className="mb-6 text-2xl font-bold text-center">
                <span className="font-serif text-primary-dark">EUNOIA</span>
            </div>

            {/* User box */}
            <div className="mb-6 rounded-lg bg-white/40 p-3 text-sm text-center border-2 border-primary-dark/40">
                <div className="font-semibold">
                    {me?.nickname ? `${me.nickname} 님` : "반가워요!"}
                </div>
                <div className="text-gray-600 truncate font-serif">{me?.email}</div>

                {me?.role === "ADMIN" && (
                    <div className="mt-2 inline-block rounded-md bg-primary-dark/90 px-2 py-0.5 text-xs font-semibold font-serif">
                        ADMIN
                    </div>
                )}
            </div>

            {/* 상단 메뉴 영역 */}
            <nav className="flex flex-col gap-2 flex-1 ">
                {navItems.map((item) => (
                    <Link key={item.to} to={item.to} className={linkClass(isActive(item.to))}>
                        {item.label}
                    </Link>
                ))}
            </nav>

            {/* 하단 섹션: 관리자 메뉴 + 로그아웃 */}
            <div className="pt-4 mt-4">
                {adminItems.length > 0 && (
                    <div className="flex flex-col gap-2 mb-4">
                        {adminItems.map((item) => (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={linkClass(isActive(item.to))}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                )}

                <button
                    type="button"
                    onClick={onLogout}
                    className="w-full rounded-lg bg-white/50 hover:bg-white/70 transition-all px-3 py-2 text-sm font-semibold border-2 border-primary-dark/40"
                >
                    로그아웃
                </button>
            </div>
        </aside>
    );
};

export default SidebarNav;
