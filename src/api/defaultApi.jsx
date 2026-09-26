import axios from "axios";
import { normalizeApiError } from "../utils/normalizeApiError";

// 세션쿠키 ( JSESSIONID ) 자동 포함
export const api = axios.create({
    baseURL: "/api",
    withCredentials: true,
});

//  응답 인터셉터
const attachInterceptors = (client) => {
    client.interceptors.response.use(
        (response) => response,
        (error) => Promise.reject(normalizeApiError(error))
    );
};

attachInterceptors(api);

// v2 ApiResponse 봉투({ success, data, error })에서 data만 꺼냄
// 실패는 에러 status로 이미 reject되고, data: null은 정상 응답(예: 분석 0건)이라 따로 검사하지 않음
export const unwrap = (res) => res.data.data;