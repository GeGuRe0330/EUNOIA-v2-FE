// 범용 폴링 — 서버가 "처리 중"을 상태 필드로 알려 주는 조회(감정 분석 ㉑, 메타분석 생성 ㉒)가 함께 쓴다.
// 간격은 initialMs에서 시작해 factor배씩 늘리고(상한 maxMs), 매번 ±jitter 비율로 흔들어 여러 탭·사용자의 요청이 겹치지 않게 한다.
// 최대 대기(timeoutMs)는 서버 상태가 아니라 사용자 경험상 포기 시점 — 넘겨도 서버 작업은 계속된다.

export const POLL_INITIAL_MS = 2_000;
export const POLL_FACTOR = 1.5;
export const POLL_MAX_MS = 5_000;
export const POLL_JITTER = 0.2;

// attempt번째(0부터) 대기 시간 — random은 테스트 주입용
export const nextDelay = (attempt, { initialMs, factor, maxMs, jitter, random }) => {
    const base = Math.min(initialMs * factor ** attempt, maxMs);
    return Math.round(base * (1 + jitter * (2 * random() - 1)));
};

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
 * fetcher()를 isDone(value)이 true가 될 때까지 반복 조회한다.
 * @returns {Promise<{ kind: "done", value } | { kind: "timeout" } | { kind: "cancelled" }>}
 * fetcher가 던진 오류는 그대로 throw — 처리 중과 구분되지 않는 진짜 오류(401/403/404/5xx/네트워크)이므로 기다리지 않는다.
 */
export const pollUntil = async ({
    fetcher,
    isDone,
    initialMs = POLL_INITIAL_MS,
    factor = POLL_FACTOR,
    maxMs = POLL_MAX_MS,
    jitter = POLL_JITTER,
    timeoutMs,
    signal,
    random = Math.random,
}) => {
    const startedAt = Date.now();

    for (let attempt = 0; !signal?.aborted; attempt += 1) {
        const value = await fetcher();
        if (signal?.aborted) break;
        if (isDone(value)) return { kind: "done", value };

        if (Date.now() - startedAt >= timeoutMs) return { kind: "timeout" };
        await sleep(nextDelay(attempt, { initialMs, factor, maxMs, jitter, random }), signal);
    }

    return { kind: "cancelled" };
};
