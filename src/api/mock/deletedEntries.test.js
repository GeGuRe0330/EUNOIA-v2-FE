import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readDeletedIds, isEntryDeleted, markEntryDeleted } from "./deletedEntries";

const KEY = "eunoia:mock:deleted-entry-ids";

describe("deletedEntries(더미 삭제 저장소)", () => {
    beforeEach(() => sessionStorage.clear());
    afterEach(() => vi.unstubAllGlobals());

    it("처음엔 비어 있다", () => {
        expect(readDeletedIds()).toEqual([]);
        expect(isEntryDeleted(3)).toBe(false);
    });

    it("지운 id를 기억한다(숫자·숫자 문자열 모두)", () => {
        markEntryDeleted(3);
        markEntryDeleted("7");
        expect(readDeletedIds()).toEqual([3, 7]);
        expect(isEntryDeleted(3)).toBe(true);
        expect(isEntryDeleted("7")).toBe(true);
        expect(isEntryDeleted(4)).toBe(false);
    });

    it("같은 id를 두 번 지워도 한 번만 둔다", () => {
        markEntryDeleted(3);
        markEntryDeleted(3);
        expect(readDeletedIds()).toEqual([3]);
    });

    it.each([null, undefined, "", "abc", 1.5, NaN, 0, -3, "0", "-3", "007", " 7", {}])("1 이상의 정수가 아닌 id(%s)는 기록하지 않는다", (value) => {
        markEntryDeleted(value);
        expect(readDeletedIds()).toEqual([]);
    });

    it("깨진 JSON이나 배열이 아닌 값이면 빈 목록으로 본다", () => {
        sessionStorage.setItem(KEY, "{깨진");
        expect(readDeletedIds()).toEqual([]);
        sessionStorage.setItem(KEY, JSON.stringify({ a: 1 }));
        expect(readDeletedIds()).toEqual([]);
    });

    it("저장된 값 중 1 이상의 정수가 아닌 항목은 걸러낸다", () => {
        sessionStorage.setItem(KEY, JSON.stringify([1, "2", null, 3.5, 0, -1, 4]));
        expect(readDeletedIds()).toEqual([1, 4]);
    });

    it("isEntryDeleted는 엉뚱한 값(null·빈 문자열)을 0번 글로 착각하지 않는다", () => {
        markEntryDeleted(5);
        expect(isEntryDeleted(null)).toBe(false);
        expect(isEntryDeleted("")).toBe(false);
        expect(isEntryDeleted(0)).toBe(false);
    });

    it("저장소를 못 쓰는 환경에서도 예외 없이 동작한다", () => {
        vi.stubGlobal("sessionStorage", {
            getItem: () => {
                throw new Error("blocked");
            },
            setItem: () => {
                throw new Error("quota");
            },
        });
        expect(() => markEntryDeleted(3)).not.toThrow();
        expect(readDeletedIds()).toEqual([]);
        expect(isEntryDeleted(3)).toBe(false);
    });
});
