// 폴링 결과(pollAnalysis) → 로딩 화면에 그릴 상태로 변환 — 화면과 분리한 순수 로직
//  messages: 따뜻한 말을 순서대로 보여준 뒤 대시보드로 (SUCCESS)
//  failed:   서버가 확정한 실패 — reason은 서버의 사용자용 문구
//  timeout:  상한 초과 — 실패가 아님(분석은 서버에서 계속 진행)
//  done:     보여줄 메시지가 없어 바로 대시보드로
//  cancelled: 화면 이탈 등으로 취소 — 아무것도 하지 않음
export const resolveLoadingView = (result) => {
    switch (result.kind) {
        case "success": {
            // 정상이면 항상 3개(백엔드 도메인 검증)지만, 비어 있어도 화면이 멈추지 않게 방어
            const messages = (result.analysis.warmMessages ?? []).filter(Boolean);
            return messages.length > 0 ? { name: "messages", messages } : { name: "done" };
        }
        case "failed":
            return { name: "failed", reason: result.analysis.reason };
        case "timeout":
            return { name: "timeout" };
        default:
            return { name: "cancelled" };
    }
};
