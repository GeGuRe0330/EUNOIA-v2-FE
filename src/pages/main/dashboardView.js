// GET /analyses/latest 응답 → 대시보드에 그릴 상태 — 화면(MainPage)과 분리한 순수 로직
//  empty:  분석이 하나도 없음(200 + data: null) — 신규 회원 등 정상 상황, 에러 아님
//  failed: 가장 최근 분석이 FAILED — 서버가 확정한 종료 상태. 나머지 필드가 전부 null이라 카드를 그리면 안 됨
//  ready:  SUCCESS — 기존 카드로 표시
export const resolveDashboardView = (latest) => {
    if (latest == null) return { name: "empty" };
    if (latest.status === "FAILED") return { name: "failed", reason: latest.reason };
    return { name: "ready", analysis: latest };
};
