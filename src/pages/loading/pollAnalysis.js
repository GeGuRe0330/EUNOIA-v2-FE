// 분석 결과 폴링 — 화면(LoadingPage)과 분리한 순수 로직(테스트 가능)
// 서버는 일기 작성 이벤트로 분석을 자동 시작하고, 프론트는 결과가 생길 때까지 조회만 한다.
// 계약: 처리 중이면 404("행 없음 = 처리 중"), 완료되면 200 + status SUCCESS | FAILED
// 알려진 상태(SUCCESS/FAILED)만 인정 — 그 밖의 값은 계약 위반이라 성공으로 넘기지 않고 오류로 던짐

// 계약에 없는 status가 왔을 때 화면에 보일 문구(프론트 담당 — 서버가 만든 메시지가 아님)
export const UNKNOWN_STATUS_MESSAGE = "분석 결과를 해석하지 못했어요.";

export const POLL_INTERVAL_MS = 2_000;
// 전송 실패는 재시도 포함 ≈61초 만에 FAILED가 되므로 그 시점을 덮는 값. 넘겨도 실패가 아님(분석은 서버에서 계속)
export const POLL_TIMEOUT_MS = 90_000;

// 취소되면 바로 깨어나는 대기
const sleep = (ms, signal) =>
    new Promise((resolve) => {
        const timer = setTimeout(resolve, ms);
        signal?.addEventListener(
            "abort",
            () => {
                clearTimeout(timer);
                resolve();
            },
            { once: true }
        );
    });

/**
 * fetchAnalysis()가 결과를 돌려줄 때까지 interval마다 조회한다.
 * @returns {Promise<{ kind: "success" | "failed" | "timeout" | "cancelled", analysis?: object }>}
 *  - success: 분석 완료(SUCCESS)
 *  - failed: 분석 실패(FAILED) — 서버가 종료 상태로 확정한 것, analysis.reason에 사용자용 문구
 *  - timeout: 상한을 넘김 — 실패가 아님(분석은 서버에서 계속 진행)
 *  - cancelled: signal로 취소됨(화면 이탈 등)
 * 404 이외의 오류(401/403/5xx/네트워크)는 그대로 throw — 처리 중과 구분되지 않는 진짜 오류
 * 알려지지 않은 status(계약 위반)도 throw — 불완전한 데이터가 화면으로 넘어가 2차 오류를 만드는 것을 막음
 */
export const pollAnalysis = async ({
    fetchAnalysis,
    intervalMs = POLL_INTERVAL_MS,
    timeoutMs = POLL_TIMEOUT_MS,
    signal,
}) => {
    const startedAt = Date.now();

    while (!signal?.aborted) {
        try {
            const analysis = await fetchAnalysis();
            if (signal?.aborted) break;
            if (analysis?.status === "SUCCESS") return { kind: "success", analysis };
            if (analysis?.status === "FAILED") return { kind: "failed", analysis };
            throw new Error(UNKNOWN_STATUS_MESSAGE);
        } catch (err) {
            if (signal?.aborted) break;
            if (err?.status !== 404) throw err; // 404는 "아직 처리 중"
        }

        if (Date.now() - startedAt >= timeoutMs) return { kind: "timeout" };
        await sleep(intervalMs, signal);
    }

    return { kind: "cancelled" };
};
