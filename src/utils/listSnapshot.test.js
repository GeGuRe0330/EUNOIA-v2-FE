import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SNAPSHOT_TTL_MS, saveListSnapshot, loadListSnapshot, hasListSnapshot, shouldKeepScroll } from "./listSnapshot";

const KEY = "/entries?from=2026-10-01&to=2026-10-12";
const entry = (id) => ({ id, dateText: "2026.10.12", content: `글 ${id}`, emotion: null });
const data = { items: [entry(3), entry(2)], page: 1, hasNext: true, scrollY: 640 };

describe("listSnapshot", () => {
    beforeEach(() => sessionStorage.clear());
    afterEach(() => vi.unstubAllGlobals());

    it("저장한 스냅샷을 그대로 되돌려준다(저장 시각 포함)", () => {
        saveListSnapshot(KEY, data, 1_000);
        expect(loadListSnapshot(KEY, 2_000)).toEqual({ ...data, savedAt: 1_000 });
    });

    it("키(경로+쿼리)가 다르면 서로 섞이지 않는다", () => {
        saveListSnapshot(KEY, data, 1_000);
        expect(loadListSnapshot("/entries", 1_000)).toBeNull();
        expect(loadListSnapshot("/entries?from=2026-10-02&to=2026-10-12", 1_000)).toBeNull();
    });

    it("같은 키로 다시 저장하면 덮어쓴다", () => {
        saveListSnapshot(KEY, data, 1_000);
        saveListSnapshot(KEY, { ...data, page: 4, scrollY: 100 }, 2_000);
        expect(loadListSnapshot(KEY, 2_000)).toMatchObject({ page: 4, scrollY: 100, savedAt: 2_000 });
    });

    it("저장한 적이 없으면 null이다", () => {
        expect(loadListSnapshot(KEY)).toBeNull();
        expect(hasListSnapshot(KEY)).toBe(false);
    });

    it("유효 시간이 지나면 null이고 저장본을 지운다", () => {
        saveListSnapshot(KEY, data, 1_000);
        expect(loadListSnapshot(KEY, 1_000 + SNAPSHOT_TTL_MS)).not.toBeNull(); // 경계: 정확히 TTL은 유효
        expect(loadListSnapshot(KEY, 1_000 + SNAPSHOT_TTL_MS + 1)).toBeNull();
        expect(loadListSnapshot(KEY, 1_000)).toBeNull(); // 이미 지워짐
    });

    it("저장 시각이 지금보다 미래면(시계가 되돌려진 경우) 버린다", () => {
        saveListSnapshot(KEY, data, 5_000);
        expect(loadListSnapshot(KEY, 1_000)).toBeNull();
    });

    it("깨진 JSON은 null이다", () => {
        sessionStorage.setItem("eunoia:list-snapshot:" + KEY, "{깨진");
        expect(loadListSnapshot(KEY)).toBeNull();
    });

    it.each([
        ["글이 없음", { ...data, items: [] }],
        ["items가 배열이 아님", { ...data, items: "x" }],
        ["page가 음수", { ...data, page: -1 }],
        ["page가 소수", { ...data, page: 1.5 }],
        ["hasNext가 불리언이 아님", { ...data, hasNext: "true" }],
        ["scrollY가 음수", { ...data, scrollY: -10 }],
        ["scrollY가 숫자가 아님", { ...data, scrollY: "640" }],
    ])("모양이 틀린 스냅샷(%s)은 쓰지 않고 지운다", (_, bad) => {
        sessionStorage.setItem("eunoia:list-snapshot:" + KEY, JSON.stringify({ ...bad, savedAt: 1_000 }));
        expect(loadListSnapshot(KEY, 1_000)).toBeNull();
        expect(sessionStorage.getItem("eunoia:list-snapshot:" + KEY)).toBeNull();
    });

    it("저장소를 쓸 수 없는 환경(차단·가득 참)에서도 예외 없이 동작한다", () => {
        const broken = {
            setItem: () => {
                throw new Error("quota");
            },
            getItem: () => {
                throw new Error("blocked");
            },
            removeItem: () => {},
        };
        vi.stubGlobal("sessionStorage", broken);

        expect(() => saveListSnapshot(KEY, data)).not.toThrow();
        expect(loadListSnapshot(KEY)).toBeNull();
        expect(hasListSnapshot(KEY)).toBe(false);
    });

    it("hasListSnapshot은 유효한 스냅샷이 있을 때만 true다", () => {
        saveListSnapshot(KEY, data, 1_000);
        expect(hasListSnapshot(KEY, 1_000)).toBe(true);
        expect(hasListSnapshot(KEY, 1_000 + SNAPSHOT_TTL_MS + 1)).toBe(false);
    });

    describe("shouldKeepScroll", () => {
        const location = (navigationType) => ({ pathname: "/entries", search: "?from=2026-10-01&to=2026-10-12", navigationType });

        it("뒤로 가기(POP)이고 스냅샷이 있으면 true다", () => {
            saveListSnapshot(KEY, data, 1_000);
            expect(shouldKeepScroll(location("POP"), 1_000)).toBe(true);
        });

        it("새로 들어가는 이동(PUSH·REPLACE)이면 스냅샷이 있어도 false다 — 맨 위에서 시작", () => {
            saveListSnapshot(KEY, data, 1_000);
            expect(shouldKeepScroll(location("PUSH"), 1_000)).toBe(false);
            expect(shouldKeepScroll(location("REPLACE"), 1_000)).toBe(false);
        });

        it("스냅샷이 없거나 만료됐으면 POP이어도 false다", () => {
            expect(shouldKeepScroll(location("POP"), 1_000)).toBe(false);
            saveListSnapshot(KEY, data, 1_000);
            expect(shouldKeepScroll(location("POP"), 1_000 + SNAPSHOT_TTL_MS + 1)).toBe(false);
        });

        it("조회 기간(쿼리)이 다른 화면의 스냅샷으로는 true가 되지 않는다", () => {
            saveListSnapshot("/entries", data, 1_000);
            expect(shouldKeepScroll(location("POP"), 1_000)).toBe(false);
        });
    });
});
