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