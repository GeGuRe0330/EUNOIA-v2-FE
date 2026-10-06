import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { META_POLL_TIMEOUT_MS, pollMetaGeneration } from "./pollMetaGeneration";

const processing = { status: "READY", content: null, generationStatus: "PROCESSING" };
const done = { status: "READY", content: { outer: {} }, generationStatus: null };
const failed = { status: "READY", content: null, generationStatus: "FAILED", generationReason: "메타분석 생성에 실패했어요." };

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("pollMetaGeneration", () => {
    it("PROCESSING이면 계속 조회하고, generationStatus가 null이 되면 그 latest를 돌려준다", async () => {
        const fetchLatest = vi.fn().mockResolvedValueOnce(processing).mockResolvedValueOnce(processing).mockResolvedValue(done);

        const promise = pollMetaGeneration({ fetchLatest, jitter: 0 });
        await vi.advanceTimersByTimeAsync(10_000);

        await expect(promise).resolves.toEqual({ kind: "done", value: done });
        expect(fetchLatest).toHaveBeenCalledTimes(3);
    });

    it("FAILED도 종료 상태 — 더 기다리지 않고 그 latest를 돌려준다", async () => {
        const fetchLatest = vi.fn().mockResolvedValue(failed);

        await expect(pollMetaGeneration({ fetchLatest })).resolves.toEqual({ kind: "done", value: failed });
        expect(fetchLatest).toHaveBeenCalledTimes(1);
    });

    it("최대 대기(기본 120초)까지 PROCESSING이면 실패가 아니라 timeout", async () => {
        const fetchLatest = vi.fn().mockResolvedValue(processing);

        const promise = pollMetaGeneration({ fetchLatest, jitter: 0 });
        await vi.advanceTimersByTimeAsync(META_POLL_TIMEOUT_MS + 5_000);

        await expect(promise).resolves.toEqual({ kind: "timeout" });
    });

    it("조회 오류는 그대로 throw, 취소하면 cancelled", async () => {
        const error = { status: 500, message: "서버에 오류가 발생했어요.", fieldErrors: [] };
        await expect(pollMetaGeneration({ fetchLatest: vi.fn().mockRejectedValue(error) })).rejects.toBe(error);

        const controller = new AbortController();
        const promise = pollMetaGeneration({ fetchLatest: vi.fn().mockResolvedValue(processing), signal: controller.signal });
        await vi.advanceTimersByTimeAsync(0);
        controller.abort();
        await expect(promise).resolves.toEqual({ kind: "cancelled" });
    });
});
