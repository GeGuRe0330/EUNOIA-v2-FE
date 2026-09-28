import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POLL_INTERVAL_MS, POLL_TIMEOUT_MS, UNKNOWN_STATUS_MESSAGE, pollAnalysis } from "./pollAnalysis";

const pending = { status: 404, message: "아직 분석 결과가 없어요.", fieldErrors: [] };
const success = { entryId: 1, status: "SUCCESS", reason: null, warmMessages: ["a", "b", "c"] };
const failed = { entryId: 1, status: "FAILED", reason: "감정 분석에 실패했어요.", warmMessages: null };

const INTERVAL = 2000;
const TIMEOUT = 10000;
const run = (fetchAnalysis, signal) =>
    pollAnalysis({ fetchAnalysis, intervalMs: INTERVAL, timeoutMs: TIMEOUT, signal });

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("pollAnalysis", () => {
    it("첫 조회에서 SUCCESS면 바로 끝난다", async () => {
        const fetchAnalysis = vi.fn().mockResolvedValue(success);

        await expect(run(fetchAnalysis)).resolves.toEqual({ kind: "success", analysis: success });
        expect(fetchAnalysis).toHaveBeenCalledTimes(1);
    });

    it("404(처리 중)는 interval마다 다시 조회하고, 결과가 나오면 끝난다", async () => {
        const fetchAnalysis = vi.fn()
            .mockRejectedValueOnce(pending)
            .mockRejectedValueOnce(pending)
            .mockResolvedValue(success);

        const promise = run(fetchAnalysis);
        await vi.advanceTimersByTimeAsync(0);
        expect(fetchAnalysis).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(INTERVAL - 1);
        expect(fetchAnalysis).toHaveBeenCalledTimes(1); // 아직 interval 전
        await vi.advanceTimersByTimeAsync(1);
        expect(fetchAnalysis).toHaveBeenCalledTimes(2);

        await vi.advanceTimersByTimeAsync(INTERVAL);
        await expect(promise).resolves.toEqual({ kind: "success", analysis: success });
        expect(fetchAnalysis).toHaveBeenCalledTimes(3);
    });

    it("FAILED 응답은 실패로 끝내고 서버의 reason을 그대로 담아 돌려준다", async () => {
        const fetchAnalysis = vi.fn().mockResolvedValue(failed);

        const result = await run(fetchAnalysis);

        expect(result.kind).toBe("failed");
        expect(result.analysis.reason).toBe("감정 분석에 실패했어요.");
        expect(fetchAnalysis).toHaveBeenCalledTimes(1); // FAILED는 종료 상태 — 더 기다리지 않음
    });

    it("상한까지 계속 404면 실패가 아니라 timeout으로 끝난다", async () => {
        const fetchAnalysis = vi.fn().mockRejectedValue(pending);

        const promise = run(fetchAnalysis);
        await vi.advanceTimersByTimeAsync(TIMEOUT);

        await expect(promise).resolves.toEqual({ kind: "timeout" });
        expect(fetchAnalysis).toHaveBeenCalledTimes(TIMEOUT / INTERVAL + 1); // 0, 2, 4, 6, 8, 10초
    });

    it.each([
        ["401 세션 만료", { status: 401, message: "로그인이 필요해요.", fieldErrors: [] }],
        ["403 남의 글", { status: 403, message: "해당 분석 결과에 대한 접근 권한이 없어요.", fieldErrors: [] }],
        ["500 서버 오류", { status: 500, message: "서버에 오류가 발생했어요.", fieldErrors: [] }],
        ["네트워크 단절(0)", { status: 0, message: "서버에 연결할 수 없어요.", fieldErrors: [] }],
    ])("%s는 처리 중이 아니라 진짜 오류라 기다리지 않고 그대로 throw한다", async (_, error) => {
        const fetchAnalysis = vi.fn().mockRejectedValue(error);

        await expect(run(fetchAnalysis)).rejects.toBe(error);
        expect(fetchAnalysis).toHaveBeenCalledTimes(1);
    });

    it("처리 중(404)을 기다리다 진짜 오류가 나면 거기서 throw한다", async () => {
        const serverError = { status: 500, message: "서버에 오류가 발생했어요.", fieldErrors: [] };
        const fetchAnalysis = vi.fn().mockRejectedValueOnce(pending).mockRejectedValue(serverError);

        const promise = run(fetchAnalysis);
        const assertion = expect(promise).rejects.toBe(serverError);
        await vi.advanceTimersByTimeAsync(INTERVAL);

        await assertion;
        expect(fetchAnalysis).toHaveBeenCalledTimes(2);
    });

    it.each([
        ["status 없음", { entryId: 1 }],
        ["PENDING(계약에 없는 값)", { entryId: 1, status: "PENDING" }],
        ["SOMETHING_NEW(새로 생긴 값)", { entryId: 1, status: "SOMETHING_NEW" }],
        ["응답 본문이 비어 있음(null)", null],
    ])("알려진 상태(SUCCESS/FAILED)만 인정한다 — %s는 성공으로 넘기지 않고 오류로 던진다", async (_, response) => {
        const fetchAnalysis = vi.fn().mockResolvedValue(response);

        await expect(run(fetchAnalysis)).rejects.toThrow(UNKNOWN_STATUS_MESSAGE);
        expect(fetchAnalysis).toHaveBeenCalledTimes(1); // 계약 위반은 다시 물어봐도 같으므로 기다리지 않음
    });

    it("대기 중 취소하면 다음 조회 없이 cancelled로 끝난다", async () => {
        const controller = new AbortController();
        const fetchAnalysis = vi.fn().mockRejectedValue(pending);

        const promise = run(fetchAnalysis, controller.signal);
        await vi.advanceTimersByTimeAsync(0);
        controller.abort();
        await vi.advanceTimersByTimeAsync(INTERVAL * 3);

        await expect(promise).resolves.toEqual({ kind: "cancelled" });
        expect(fetchAnalysis).toHaveBeenCalledTimes(1);
    });

    it("이미 취소된 signal이면 한 번도 조회하지 않는다", async () => {
        const controller = new AbortController();
        controller.abort();
        const fetchAnalysis = vi.fn();

        await expect(run(fetchAnalysis, controller.signal)).resolves.toEqual({ kind: "cancelled" });
        expect(fetchAnalysis).not.toHaveBeenCalled();
    });

    it("조회 도중 취소되면 그 결과는 버린다(화면 이탈 후 늦게 온 응답)", async () => {
        const controller = new AbortController();
        const fetchAnalysis = vi.fn().mockImplementation(async () => {
            controller.abort();
            return success;
        });

        await expect(run(fetchAnalysis, controller.signal)).resolves.toEqual({ kind: "cancelled" });
    });
});

// 화면(LoadingPage)은 intervalMs/timeoutMs를 넘기지 않고 기본값에 맡긴다 — 위 테스트는 값을 매번 명시하므로 이 호출 형태를 따로 검증
describe("pollAnalysis — 화면과 같은 호출 형태(interval/timeout 생략)", () => {
    it("기본 상수는 2초 / 90초다", () => {
        expect(POLL_INTERVAL_MS).toBe(2_000);
        expect(POLL_TIMEOUT_MS).toBe(90_000);
    });

    it("첫 조회는 즉시, 2초 전까지는 추가 조회가 없고, 2초에 두 번째 조회를 한다", async () => {
        const fetchAnalysis = vi.fn().mockRejectedValue(pending);

        const promise = pollAnalysis({ fetchAnalysis }); // interval/timeout 생략
        await vi.advanceTimersByTimeAsync(0);
        expect(fetchAnalysis).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS - 1);
        expect(fetchAnalysis).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(1);
        expect(fetchAnalysis).toHaveBeenCalledTimes(2);

        await vi.advanceTimersByTimeAsync(POLL_TIMEOUT_MS); // 정리: 상한까지 흘려 종료
        await promise;
    });

    it("계속 처리 중이면 90초에 timeout — 조회는 0, 2, 4 ... 90초로 46번", async () => {
        const fetchAnalysis = vi.fn().mockRejectedValue(pending);

        const promise = pollAnalysis({ fetchAnalysis }); // interval/timeout 생략
        await vi.advanceTimersByTimeAsync(POLL_TIMEOUT_MS - 1);
        let settled = false;
        promise.then(() => { settled = true; });
        await vi.advanceTimersByTimeAsync(0);
        expect(settled).toBe(false); // 89.999초까지는 계속 기다림

        await vi.advanceTimersByTimeAsync(1);
        await expect(promise).resolves.toEqual({ kind: "timeout" });
        expect(fetchAnalysis).toHaveBeenCalledTimes(POLL_TIMEOUT_MS / POLL_INTERVAL_MS + 1);
    });
});
