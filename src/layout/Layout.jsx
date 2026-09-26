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
        } catch {
            // 로그아웃 요청이 실패해도 로그인 화면으로 보냄
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