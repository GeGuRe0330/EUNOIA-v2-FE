import { redirect } from "react-router-dom";
import { getMe } from "../api/authApi";

export const requireAuth = async () => {
    try {
        await getMe();
        return null;
    } catch (err) {
        const message = err?.message || "요청 중 오류가 발생했습니다.";
        alert(message);
        return redirect("/login");;
    }
};