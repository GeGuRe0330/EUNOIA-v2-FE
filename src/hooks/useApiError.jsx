import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export function useApiError() {
    const navigate = useNavigate();

    const handleApiError = useCallback((err, options = {}) => {
        const { silent = false } = options;

        if (err?.status === 401) {
            if (!silent) {
                alert(err.message || "로그인이 필요합니다.(fromReact)")
            };
            navigate("/login");
            return;
        }

        if (!silent) {
            alert(err?.message || "요청 중 오류가 발생했습니다.(fromReact)");
            navigate("/dashboard");
            return;
        }

    }, [navigate]);
    return { handleApiError };
}
