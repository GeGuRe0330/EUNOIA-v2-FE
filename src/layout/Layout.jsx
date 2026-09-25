import { Outlet, useNavigate } from "react-router-dom";
import SidebarNav from "../components/SidebarNav";
import { useEffect, useState } from "react";
import { getMe } from "../api/authApi";
import { api } from "../api/defultApi";
import { useApiError } from "../hooks/useApiError";
import MobileHeader from "../components/mobile/MobileHeader";
import MobileDrawer from "../components/mobile/MobileDrawer";

const Layout = () => {
    const [me, setMe] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { handleApiError } = useApiError();
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                const data = await getMe();
                setMe(data.data);
            } catch (e) {
                setMe(null);
                handleApiError(e);
            }
        })();
    }, [handleApiError]);

    const handleLogout = async () => {
        try {
            await api.post("/auth/logout");
            setMe(null);
            navigate("/login");
        } catch (e) {
            setMe(null);
            navigate("/login");
        }
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