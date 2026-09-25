// 에러 응답(ApiResponse)을 표준 에러 객체로 변환
export function normalizeApiError(error) {
    const status = error?.response?.status ?? 0;
    const body = error?.response?.data;

    const code = body?.code ?? "UNKNOWN";
    const message =
        body?.message ||
        (status === 401
            ? "로그인이 필요합니다."
            : status === 403
                ? "권한이 없습니다."
                : status === 404
                    ? "요청한 리소스를 찾을 수 없습니다."
                    : "요청 중 오류가 발생했습니다.");

    return { status, code, message };
}