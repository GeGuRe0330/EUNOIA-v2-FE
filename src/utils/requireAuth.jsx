import { redirect } from "react-router-dom";
import { getMe } from "../api/authApi";

// 보호 화면(Layout) 진입 시 세션 확인 + 내 정보 반환 (Layout이 useLoaderData로 사용)
export const requireAuth = async () => {
    try {
        return await getMe();
    } catch (err) {
        // 401(미인증/세션 만료)은 조용히 로그인으로, 그 외(서버 다운 등)는 알린 뒤 로그인으로
        if (err?.status !== 401) {
            alert(err?.message);
        }
        return redirect("/login");
    }
};
