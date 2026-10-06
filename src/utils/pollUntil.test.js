import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextDelay, pollUntil } from "./pollUntil";

const opts = { initialMs: 2000, factor: 1.5, maxMs: 5000, jitter: 0.2, random: () => 0.5 };

describe("nextDelay", () => {
    it("지터가 0이 되는 값(random 0.5)이면 2초에서 시작해 1.5배씩 늘다가 상한에서 멈춘다", () => {
        expect([0, 1, 2, 3, 10].map((n) => nextDelay(n, opts))).toEqual([2000, 3000, 4500, 5000, 5000]);
    });

    it("지터는 ±20% 범위 안이다(상한에 걸린 뒤에도 적용)", () => {
        expect(nextDelay(0, { ...opts, random: () => 0 })).toBe(1600);
        expect(nextDelay(0, { ...opts, random: () => 1 })).toBe(2400);
        expect(nextDelay(10, { ...opts, random: () => 0 })).toBe(4000);
        expect(nextDelay(10, { ...opts, random: () => 1 })).toBe(6000);
    });
});

describe("pollUntil", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    const base = { isDone: (v) => v === "done", timeoutMs: 60_000, jitter: 0 };

    it("조회 간격이 실제로 2초 → 3초 → 4.5초로 늘어난다", async () => {
        const fetcher = vi.fn().mockResolvedValue("wait");
        const promise = pollUntil({ ...base, fetcher });

        await vi.advanceTimersByTimeAsync(0);
        expect(fetcher).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(2000); // 2초
        expect(fetcher).toHaveBeenCalledTimes(2);
        await vi.advanceTimersByTimeAsync(2999);
        expect(fetcher).toHaveBeenCalledTimes(2);
        await vi.advanceTimersByTimeAsync(1); // +3초
        expect(fetcher).toHaveBeenCalledTimes(3);
        await vi.advanceTimersByTimeAsync(4500); // +4.5초
        expect(fetcher).toHaveBeenCalledTimes(4);

        await vi.advanceTimersByTimeAsync(60_000);
        await promise;
    });

    it("isDone이 참이면 그 값을 담아 끝난다", async () => {
        const fetcher = vi.fn().mockResolvedValueOnce("wait").mockResolvedValue("done");
        const promise = pollUntil({ ...base, fetcher });
        await vi.advanceTimersByTimeAsync(2000);

        await expect(promise).resolves.toEqual({ kind: "done", value: "done" });
    });

    it("timeoutMs를 넘기면 timeout, fetcher 오류는 그대로 throw한다", async () => {
        const waiting = vi.fn().mockResolvedValue("wait");
        const promise = pollUntil({ ...base, fetcher: waiting, timeoutMs: 5000 });
        await vi.advanceTimersByTimeAsync(10_000);
        await expect(promise).resolves.toEqual({ kind: "timeout" });

        const boom = new Error("boom");
        await expect(pollUntil({ ...base, fetcher: vi.fn().mockRejectedValue(boom) })).rejects.toBe(boom);
    });

    it("취소하면 대기 중에도 바로 cancelled로 끝난다", async () => {
        const controller = new AbortController();
        const fetcher = vi.fn().mockResolvedValue("wait");
        const promise = pollUntil({ ...base, fetcher, signal: controller.signal });
        await vi.advanceTimersByTimeAsync(0);
        controller.abort();

        await expect(promise).resolves.toEqual({ kind: "cancelled" });
        expect(fetcher).toHaveBeenCalledTimes(1);
    });
});
