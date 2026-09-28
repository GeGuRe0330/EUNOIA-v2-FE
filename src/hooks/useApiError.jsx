import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

const SESSION_EXPIRED_MESSAGE = "세션이 만료됐어요. 다시 로그인해 주세요.";

// 보호 화면 공통 에러 처리
export function useApiError() {
    const navigate = useNavigate();

    const handleApiError = useCallback((err) => {
        // 보호 화면의 401은 세션 만료뿐 (로그인 상태의 CSRF 실패는 403, 로그인 실패 401은 LoginPage가 직접 처리)
        if (err?.status === 401) {
            navigate("/login", { state: { message: SESSION_EXPIRED_MESSAGE } });
            return;
        }

        // 그 외에는 알리기만 하고 현재 화면에 머묾 (작성 중이던 입력을 잃지 않도록)
        alert(err?.message);
    }, [navigate]);

    return { handleApiError };
}
