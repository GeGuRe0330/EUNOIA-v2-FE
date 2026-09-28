import axios from "axios";
import { normalizeApiError } from "../utils/normalizeApiError";

const BASE_URL = "/api/v1";

// 세션쿠키 ( JSESSIONID ) 자동 포함
export const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

// CSRF: 백엔드가 내려주는 XSRF-TOKEN 쿠키를 axios가 X-XSRF-TOKEN 헤더로 자동 첨부함(same-origin 요청)
// 쿠키가 없으면(최초 진입, 로그아웃 직후) 상태변경 요청 전에 GET 한 번으로 먼저 발급받음
const XSRF_COOKIE_NAME = "XSRF-TOKEN";
const UNSAFE_METHODS = ["post", "put", "patch", "delete"];

const hasXsrfCookie = () =>
    document.cookie.split("; ").some((c) => c.startsWith(`${XSRF_COOKIE_NAME}=`));

// 동시에 여러 요청이 와도 발급용 GET은 한 번만 보냄
let pendingTokenRequest = null;

const ensureXsrfToken = async () => {
    if (hasXsrfCookie()) return;

    // 인터셉터를 타지 않는 별도 호출 — 미인증이면 401이지만 응답에 쿠키는 실려오므로 결과는 무시
    pendingTokenRequest ??= axios
        .get(`${BASE_URL}/members/me`, { withCredentials: true, validateStatus: () => true })
        .catch(() => {})
        .finally(() => {
            pendingTokenRequest = null;
        });

    await pendingTokenRequest;
};

const attachInterceptors = (client) => {
    //  요청 인터셉터
    client.interceptors.request.use(async (config) => {
        if (UNSAFE_METHODS.includes(config.method)) {
            await ensureXsrfToken();
        }
        return config;
    });

    //  응답 인터셉터
    client.interceptors.response.use(
        (response) => response,
        (error) => Promise.reject(normalizeApiError(error))
    );
};

attachInterceptors(api);

// v2 ApiResponse 봉투({ success, data, error })에서 data만 꺼냄
// 실패는 에러 status로 이미 reject되고, data: null은 정상 응답(예: 분석 0건)이라 따로 검사하지 않음
export const unwrap = (res) => res.data.data;
