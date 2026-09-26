import { Outlet, useLoaderData, useNavigate } from "react-router-dom";
import SidebarNav from "../components/SidebarNav";
import { useState } from "react";
import { logout } from "../api/authApi";
import MobileHeader from "../components/mobile/MobileHeader";
import MobileDrawer from "../components/mobile/MobileDrawer";

const Layout = () => {
    // 라우트 loader(requireAuth)가 세션 확인과 함께 반환한 내 정보
    const me = useLoaderData();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (err) {
            // 401은 로그인 안 한 상태의 CSRF 거부 — 끝낼 세션이 없으므로 로그인 화면으로
            // 그 외(네트워크/403/5xx)는 서버 세션이 살아 있을 수 있으므로 현재 화면에 머묾
            if (err?.status !== 401) {
                alert("로그아웃에 실패했어요. 잠시 후 다시 시도해 주세요.");
                return;
            }
        }
        navigate("/login");
    };
    return (
        <div className="flex min-h-screen">
            <aside className="hidden md:block w-52 shrink-0">
                <SidebarNav me={me} onLogout={handleLogout} />
            </aside>
            {/* Mobile Header + Drawer */}
            <MobileHeader onOpen={() => setDrawerOpen(true)} />
            <MobileDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                me={me}
                onLogout={handleLogout}
            />

            {/* Main */}
            <main className="flex-1 p-1 md:p-6 pt-16 md:pt-6 md:ml-0">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;