import { api, unwrap } from "./defaultApi";

// 내 정보 조회 — 세션 유효성 확인 겸용 (미인증이면 401)
export const getMe = async () => {
    const res = await api.get(`/members/me`);
    return unwrap(res);
};

// 로그인 (Spring Security formLogin: /api/v1/auth/login)
export const login = async ({ username, password }) => {
    const body = new URLSearchParams();
    body.append("username", username);
    body.append("password", password);

    const res = await api.post(`/auth/login`, body, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return unwrap(res);
};

// 로그아웃 (Spring Security logout: /api/v1/auth/logout)
export const logout = async () => {
    const res = await api.post(`/auth/logout`);
    return unwrap(res);
};

// 회원가입 요청
export const signUp = async (payload) => {
    const res = await api.post(`/members/signup`, payload);
    return unwrap(res);
};
