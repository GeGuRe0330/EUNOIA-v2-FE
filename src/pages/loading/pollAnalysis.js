// 분석 결과 폴링 — 화면(LoadingPage)과 분리한 순수 로직(테스트 가능)
// 서버는 일기 작성 이벤트로 분석을 자동 시작하고, 프론트는 끝날 때까지 조회만 한다.
// 계약(백엔드 ㉑): 처리 중도 200 + status PROCESSING, 끝나면 SUCCESS | FAILED(멈춘 처리는 서버가 5분 뒤 FAILED로 확정).
//   404는 "처리 중"이 아니라 진짜 없음(없는 글·삭제된 글)이라 기다리지 않고 오류로 던진다.
// 알려진 상태(PROCESSING/SUCCESS/FAILED)만 인정 — 그 밖의 값은 계약 위반이라 성공으로 넘기지 않고 오류로 던짐
import { POLL_INITIAL_MS, pollUntil } from "../../utils/pollUntil";

// 계약에 없는 status가 왔을 때 화면에 보일 문구(프론트 담당 — 서버가 만든 메시지가 아님)
export const UNKNOWN_STATUS_MESSAGE = "결과를 해석하지 못했어요.";

export const POLL_INTERVAL_MS = POLL_INITIAL_MS;
// 서버가 5분 뒤 FAILED로 확정하지만 사용자가 기다릴 만한 시점은 그보다 이르다. 넘겨도 실패가 아님(분석은 서버에서 계속)
export const POLL_TIMEOUT_MS = 90_000;

/**
 * fetchAnalysis()가 종료 상태를 돌려줄 때까지 백오프+지터 간격으로 조회한다.
 * @returns {Promise<{ kind: "success" | "failed" | "timeout" | "cancelled", analysis?: object }>}
 *  - success: 분석 완료(SUCCESS)
 *  - failed: 분석 실패(FAILED) — 서버가 종료 상태로 확정한 것, analysis.reason에 사용자용 문구
 *  - timeout: 상한을 넘김 — 실패가 아님(분석은 서버에서 계속 진행)
 *  - cancelled: signal로 취소됨(화면 이탈 등)
 * 오류(401/403/404/5xx/네트워크)는 그대로 throw — 404도 진짜 없음이라 처리 중으로 보지 않는다
 * 알려지지 않은 status(계약 위반)도 throw — 불완전한 데이터가 화면으로 넘어가 2차 오류를 만드는 것을 막음
 */
export const pollAnalysis = async ({
    fetchAnalysis,
    intervalMs = POLL_INTERVAL_MS,
    timeoutMs = POLL_TIMEOUT_MS,
    ...options // maxMs·factor·jitter·random·signal — 테스트 주입용
}) => {
    const result = await pollUntil({
        fetcher: fetchAnalysis,
        isDone: (analysis) => analysis?.status !== "PROCESSING",
        initialMs: intervalMs,
        timeoutMs,
        ...options,
    });
    if (result.kind !== "done") return { kind: result.kind };

    const analysis = result.value;
    if (analysis?.status === "SUCCESS") return { kind: "success", analysis };
    if (analysis?.status === "FAILED") return { kind: "failed", analysis };
    throw new Error(UNKNOWN_STATUS_MESSAGE);
};
