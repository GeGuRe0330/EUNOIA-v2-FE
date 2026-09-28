// 관리자 여부 — 화면 접근 제어용(UX), 실제 권한 검사는 백엔드 hasRole("ADMIN")
export const isAdmin = (me) => me?.role === "ADMIN";
