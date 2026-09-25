import { api } from "./defultApi";

// 로그인확인용 요청 (컨트롤러: /api/members/user/me 라고 했으니 리소스만)
export const getMe = async () => {
    const res = await api.get(`/members/user/me`);
    return res.data;
};

// 로그인 (Spring Security: /api/auth/login)
export const login = async ({ username, password }) => {
    const body = new URLSearchParams();
    body.append("username", username);
    body.append("password", password);

    const res = await api.post(`/auth/login`, body, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    return res.data;
};

// 회원가입 요청 (컨트롤러: /api/members/signup)
export const signUp = async (payload) => {
    const res = await api.post(`/members/signup`, payload);
    return res.data.data;
};
