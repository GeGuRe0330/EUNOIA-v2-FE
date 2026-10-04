import { redirect } from "react-router-dom";
import { getMe } from "../api/authApi";

// 보호 화면(Layout) 진입 시 세션 확인 + 내 정보 반환 (Layout이 useLoaderData로 사용)
export const requireAuth = async () => {
    try {
        return await getMe();
    } catch (err) {
        // 401만 "로그인 안 됨" — 조용히 로그인으로
        if (err?.status === 401) {
            return redirect("/login");
        }
        // 그 외(서버 장애, 네트워크)는 로그인 여부를 판단할 수 없음 → 라우트 errorElement가 처리
        throw err;
    }
};
