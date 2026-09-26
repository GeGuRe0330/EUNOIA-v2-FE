// 봉투 없이 오는 에러(바디 없는 401, Spring 기본 403, 프록시/네트워크 에러)용 기본 문구
const DEFAULT_MESSAGES = {
    0: "서버에 연결할 수 없어요.",
    401: "로그인이 필요해요.",
    403: "권한이 없거나 요청이 만료됐어요. 새로고침 후 다시 시도해 주세요.",
    404: "요청한 리소스를 찾을 수 없어요.",
};

// 에러 응답(v2 ApiResponse: { success, data, error: { message, errors } })을 표준 에러 객체로 변환
export function normalizeApiError(error) {
    const status = error?.response?.status ?? 0;
    const apiError = error?.response?.data?.error;

    return {
        status,
        message: apiError?.message || DEFAULT_MESSAGES[status] || "요청 중 오류가 발생했어요.",
        fieldErrors: apiError?.errors ?? [],
    };
}
