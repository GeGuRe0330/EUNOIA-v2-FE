import { describe, expect, it } from "vitest";
import {
    PAGE_SIZE,
    parseDateParam,
    parseDateRange,
    isRangeSet,
    formatRangeLabel,
    applyRangeChange,
    applyRangeToParams,
    RANGE_ORDER_MESSAGE,
    INVALID_DATE_MESSAGE,
    mergeEntryPages,
    initialEntryListState,
    entryListReducer,
    buildInitialListState,
} from "./entryListView";

describe("parseDateParam", () => {
    it("존재하는 날짜는 그대로 돌려준다", () => {
        expect(parseDateParam("2026-10-12")).toBe("2026-10-12");
        expect(parseDateParam("2028-02-29")).toBe("2028-02-29"); // 윤년
    });

    it.each([
        ["없음(null)", null],
        ["undefined", undefined],
        ["빈 문자열", ""],
        ["형식이 다른 문자열", "어제"],
        ["0 채움이 없는 날짜", "2026-10-1"],
        ["달까지만", "2026-10"],
        ["시각이 붙은 값", "2026-10-12T10:00:00"],
        ["존재하지 않는 날(2월 30일)", "2026-02-30"],
        ["평년의 2월 29일", "2027-02-29"],
        ["존재하지 않는 달", "2026-13-01"],
        ["일이 0", "2026-10-00"],
    ])("%s는 null이다(제한 없음)", (_, value) => {
        expect(parseDateParam(value)).toBeNull();
    });
});

describe("parseDateRange", () => {
    it("시작일·종료일이 모두 있으면 그대로 돌려준다", () => {
        expect(parseDateRange("2026-10-01", "2026-10-12")).toEqual({ from: "2026-10-01", to: "2026-10-12", reversed: false });
    });

    it("하루는 시작일과 종료일이 같다", () => {
        expect(parseDateRange("2026-10-12", "2026-10-12")).toEqual({ from: "2026-10-12", to: "2026-10-12", reversed: false });
    });

    it("한쪽만 있어도 된다(없는 쪽은 null = 제한 없음)", () => {
        expect(parseDateRange("2026-10-01", null)).toEqual({ from: "2026-10-01", to: null, reversed: false });
        expect(parseDateRange(null, "2026-10-12")).toEqual({ from: null, to: "2026-10-12", reversed: false });
    });

    it("둘 다 없으면 제한 없음이다", () => {
        expect(parseDateRange(null, null)).toEqual({ from: null, to: null, reversed: false });
    });

    it("틀린 값은 그쪽만 버리고 나머지는 살린다", () => {
        expect(parseDateRange("어제", "2026-10-12")).toEqual({ from: null, to: "2026-10-12", reversed: false });
        expect(parseDateRange("2026-10-01", "2026-02-30")).toEqual({ from: "2026-10-01", to: null, reversed: false });
    });

    it("시작일이 종료일보다 늦으면 적용하지 않고 reversed로 알린다", () => {
        expect(parseDateRange("2026-10-12", "2026-10-01")).toEqual({ from: null, to: null, reversed: true });
    });

    it("월·연도를 넘는 선후도 날짜 순서로 가린다", () => {
        expect(parseDateRange("2026-09-30", "2026-10-01").reversed).toBe(false);
        expect(parseDateRange("2027-01-01", "2026-12-31").reversed).toBe(true);
    });
});

describe("isRangeSet", () => {
    it("시작일이나 종료일이 하나라도 있으면 true다", () => {
        expect(isRangeSet({ from: "2026-10-01", to: null })).toBe(true);
        expect(isRangeSet({ from: null, to: "2026-10-12" })).toBe(true);
        expect(isRangeSet({ from: "2026-10-01", to: "2026-10-12" })).toBe(true);
    });

    it("둘 다 없으면 false다", () => {
        expect(isRangeSet({ from: null, to: null })).toBe(false);
    });
});

describe("formatRangeLabel", () => {
    it("하루는 날짜 하나로 말한다", () => {
        expect(formatRangeLabel({ from: "2026-10-12", to: "2026-10-12" })).toBe("2026.10.12");
    });

    it("범위는 물결로 잇는다", () => {
        expect(formatRangeLabel({ from: "2026-10-01", to: "2026-10-12" })).toBe("2026.10.01 ~ 2026.10.12");
    });

    it("한쪽만 있으면 이후/이전으로 말한다", () => {
        expect(formatRangeLabel({ from: "2026-10-01", to: null })).toBe("2026.10.01 이후");
        expect(formatRangeLabel({ from: null, to: "2026-10-12" })).toBe("2026.10.12 이전");
    });

    it("제한이 없으면 빈 문자열이다", () => {
        expect(formatRangeLabel({ from: null, to: null })).toBe("");
    });
});

describe("applyRangeChange", () => {
    const empty = { from: null, to: null };

    it("시작일을 정하면 적용된다", () => {
        expect(applyRangeChange(empty, "from", "2026-10-01")).toEqual({ next: { from: "2026-10-01", to: null }, error: null });
    });

    it("종료일을 정하면 적용된다", () => {
        expect(applyRangeChange(empty, "to", "2026-10-12")).toEqual({ next: { from: null, to: "2026-10-12" }, error: null });
    });

    it("시작일과 종료일이 같은 날이면 하루 조회다", () => {
        const current = { from: "2026-10-12", to: null };
        expect(applyRangeChange(current, "to", "2026-10-12")).toEqual({
            next: { from: "2026-10-12", to: "2026-10-12" },
            error: null,
        });
    });

    it("빈 값이면 그쪽 제한만 푼다", () => {
        const current = { from: "2026-10-01", to: "2026-10-12" };
        expect(applyRangeChange(current, "from", "")).toEqual({ next: { from: null, to: "2026-10-12" }, error: null });
        expect(applyRangeChange(current, "to", null)).toEqual({ next: { from: "2026-10-01", to: null }, error: null });
    });

    it("시작일이 종료일보다 늦어지면 적용하지 않고 안내한다", () => {
        const current = { from: null, to: "2026-10-01" };
        expect(applyRangeChange(current, "from", "2026-10-12")).toEqual({ next: current, error: RANGE_ORDER_MESSAGE });
    });

    it("종료일이 시작일보다 앞서면 적용하지 않고 안내한다", () => {
        const current = { from: "2026-10-12", to: null };
        expect(applyRangeChange(current, "to", "2026-10-01")).toEqual({ next: current, error: RANGE_ORDER_MESSAGE });
    });

    it("존재하지 않는 날짜는 적용하지 않고 안내한다", () => {
        const current = { from: "2026-10-01", to: null };
        expect(applyRangeChange(current, "to", "2026-02-30")).toEqual({ next: current, error: INVALID_DATE_MESSAGE });
    });

    it("받은 값을 바꾸지 않는다", () => {
        const current = { from: null, to: null };
        applyRangeChange(current, "from", "2026-10-01");
        expect(current).toEqual({ from: null, to: null });
    });
});

describe("applyRangeToParams", () => {
    it("시작일·종료일을 쿼리에 넣는다", () => {
        const next = applyRangeToParams(new URLSearchParams(), { from: "2026-10-01", to: "2026-10-12" });
        expect(next.get("from")).toBe("2026-10-01");
        expect(next.get("to")).toBe("2026-10-12");
    });

    it("비어 있는 쪽은 쿼리에서 지운다", () => {
        const previous = new URLSearchParams("from=2026-10-01&to=2026-10-12");
        const next = applyRangeToParams(previous, { from: null, to: "2026-10-12" });
        expect(next.has("from")).toBe(false);
        expect(next.get("to")).toBe("2026-10-12");
    });

    it("둘 다 비면 둘 다 지운다", () => {
        const next = applyRangeToParams(new URLSearchParams("from=2026-10-01&to=2026-10-12"), { from: null, to: null });
        expect(next.toString()).toBe("");
    });

    it("다른 쿼리는 건드리지 않는다", () => {
        const next = applyRangeToParams(new URLSearchParams("tab=recent"), { from: "2026-10-01", to: null });
        expect(next.get("tab")).toBe("recent");
        expect(next.get("from")).toBe("2026-10-01");
    });

    it("받은 쿼리 객체를 바꾸지 않는다", () => {
        const previous = new URLSearchParams("from=2026-10-01");
        applyRangeToParams(previous, { from: null, to: null });
        expect(previous.get("from")).toBe("2026-10-01");
    });
});

describe("mergeEntryPages", () => {
    const entry = (id) => ({ id, dateText: "2026.10.01", content: `글 ${id}`, emotion: null });

    it("다음 페이지를 뒤에 이어 붙인다(순서 유지)", () => {
        expect(mergeEntryPages([entry(3), entry(2)], [entry(1)]).map((e) => e.id)).toEqual([3, 2, 1]);
    });

    it("이미 있는 id는 건너뛴다(보는 사이 페이지 경계가 밀려 같은 글이 다시 올 때)", () => {
        expect(mergeEntryPages([entry(3), entry(2)], [entry(2), entry(1)]).map((e) => e.id)).toEqual([3, 2, 1]);
    });

    it("빈 목록과도 합쳐진다", () => {
        expect(mergeEntryPages([], [entry(1)])).toHaveLength(1);
        expect(mergeEntryPages([entry(1)], [])).toHaveLength(1);
        expect(mergeEntryPages([], [])).toEqual([]);
    });

    it("받은 배열을 바꾸지 않는다", () => {
        const previous = [entry(2)];
        mergeEntryPages(previous, [entry(1)]);
        expect(previous).toHaveLength(1);
    });
});

describe("PAGE_SIZE", () => {
    it("한 번에 10개씩 불러온다", () => {
        expect(PAGE_SIZE).toBe(10);
    });
});

describe("entryListReducer", () => {
    const items = (...ids) => ids.map((id) => ({ id, dateText: "", content: "", emotion: null }));
    const ready = (overrides = {}) => ({
        ...initialEntryListState,
        status: "ready",
        items: items(3, 2),
        hasNext: true,
        ...overrides,
    });

    it("처음에는 로딩 상태다", () => {
        expect(initialEntryListState.status).toBe("loading");
        expect(initialEntryListState.items).toEqual([]);
    });

    it("LOAD_SUCCESS: 목록과 다음 페이지 유무를 담고 더 보기 상태를 초기화한다", () => {
        const next = entryListReducer(
            { ...ready(), moreStatus: "error", moreMessage: "실패", page: 4 },
            { type: "LOAD_SUCCESS", items: items(9), hasNext: false }
        );
        expect(next).toMatchObject({ status: "ready", hasNext: false, page: 0, moreStatus: "idle", moreMessage: null });
        expect(next.items.map((i) => i.id)).toEqual([9]);
    });

    it("LOAD_START: 필터가 바뀌어 다시 불러올 때 이전 목록·페이지를 버린다", () => {
        const next = entryListReducer(ready({ page: 2 }), { type: "LOAD_START" });
        expect(next).toEqual(initialEntryListState);
    });

    it("LOAD_ERROR: 오류 상태와 문구를 담고 이전 목록은 비운다", () => {
        const next = entryListReducer(ready(), { type: "LOAD_ERROR", message: "서버에 오류가 발생했어요." });
        expect(next).toMatchObject({ status: "error", message: "서버에 오류가 발생했어요.", items: [], hasNext: false });
    });

    it("MORE_START → MORE_SUCCESS: 목록에 이어 붙이고 페이지를 하나 올린다", () => {
        const started = entryListReducer(ready(), { type: "MORE_START" });
        expect(started.moreStatus).toBe("loading");

        const done = entryListReducer(started, { type: "MORE_SUCCESS", items: items(1), hasNext: false });
        expect(done.items.map((i) => i.id)).toEqual([3, 2, 1]);
        expect(done).toMatchObject({ page: 1, hasNext: false, moreStatus: "idle", moreMessage: null });
    });

    it("MORE_SUCCESS: 겹치는 글은 한 번만 남긴다", () => {
        const started = entryListReducer(ready(), { type: "MORE_START" });
        const done = entryListReducer(started, { type: "MORE_SUCCESS", items: items(2, 1), hasNext: true });
        expect(done.items.map((i) => i.id)).toEqual([3, 2, 1]);
    });

    it("MORE_ERROR: 이미 본 목록은 그대로 두고 더 보기 오류만 표시한다", () => {
        const started = entryListReducer(ready(), { type: "MORE_START" });
        const failed = entryListReducer(started, { type: "MORE_ERROR", message: "더 불러오지 못했어요." });
        expect(failed).toMatchObject({ status: "ready", moreStatus: "error", moreMessage: "더 불러오지 못했어요.", page: 0 });
        expect(failed.items.map((i) => i.id)).toEqual([3, 2]);
        expect(failed.hasNext).toBe(true);
    });

    it("MORE_ERROR 뒤 다시 MORE_START: 오류 문구를 지우고 같은 페이지를 다시 요청한다", () => {
        const failed = { ...ready(), moreStatus: "error", moreMessage: "실패" };
        const retried = entryListReducer(failed, { type: "MORE_START" });
        expect(retried).toMatchObject({ moreStatus: "loading", moreMessage: null, page: 0 });
    });

    it("MORE_START는 다음 페이지가 없으면 무시한다", () => {
        const state = ready({ hasNext: false });
        expect(entryListReducer(state, { type: "MORE_START" })).toBe(state);
    });

    it("MORE_START는 이미 불러오는 중이면 무시한다(중복 요청 방지)", () => {
        const state = ready({ moreStatus: "loading" });
        expect(entryListReducer(state, { type: "MORE_START" })).toBe(state);
    });

    it("MORE_START는 첫 조회가 끝나지 않았거나 실패한 상태에서는 무시한다", () => {
        const loading = { ...initialEntryListState };
        expect(entryListReducer(loading, { type: "MORE_START" })).toBe(loading);
        const errored = { ...initialEntryListState, status: "error", message: "x" };
        expect(entryListReducer(errored, { type: "MORE_START" })).toBe(errored);
    });

    it("MORE_SUCCESS·MORE_ERROR는 더 보기 요청 중이 아니면 무시한다(필터 변경 뒤 늦게 온 응답)", () => {
        const idle = ready();
        expect(entryListReducer(idle, { type: "MORE_SUCCESS", items: items(1), hasNext: false })).toBe(idle);
        expect(entryListReducer(idle, { type: "MORE_ERROR", message: "x" })).toBe(idle);

        const reset = { ...initialEntryListState };
        expect(entryListReducer(reset, { type: "MORE_SUCCESS", items: items(1), hasNext: false })).toBe(reset);
    });

    it("알 수 없는 action은 상태를 그대로 둔다", () => {
        const state = ready();
        expect(entryListReducer(state, { type: "UNKNOWN" })).toBe(state);
    });
});

describe("buildInitialListState", () => {
    const entry = (id) => ({ id, dateText: "2026.10.12", content: `글 ${id}`, emotion: null });

    it("스냅샷이 없으면 처음 상태(로딩)다", () => {
        expect(buildInitialListState(null)).toBe(initialEntryListState);
        expect(buildInitialListState(undefined)).toBe(initialEntryListState);
    });

    it("스냅샷이 있으면 첫 조회 없이 바로 그 목록·페이지·다음 페이지 유무로 시작한다", () => {
        const state = buildInitialListState({ items: [entry(3), entry(2)], page: 2, hasNext: true });
        expect(state).toMatchObject({ status: "ready", page: 2, hasNext: true, moreStatus: "idle", moreMessage: null, message: null });
        expect(state.items.map((e) => e.id)).toEqual([3, 2]);
    });

    it("복원한 상태에서도 이어 불러오기가 이어진다(다음 페이지 번호는 page + 1)", () => {
        const started = entryListReducer(buildInitialListState({ items: [entry(3)], page: 2, hasNext: true }), { type: "MORE_START" });
        expect(started.moreStatus).toBe("loading");
        const done = entryListReducer(started, { type: "MORE_SUCCESS", items: [entry(2)], hasNext: false });
        expect(done).toMatchObject({ page: 3, hasNext: false });
        expect(done.items.map((e) => e.id)).toEqual([3, 2]);
    });

    it("hasNext가 정확히 true가 아니면 더 없다고 본다", () => {
        expect(buildInitialListState({ items: [entry(1)], page: 0, hasNext: "true" }).hasNext).toBe(false);
    });

    it("본문이 문자열이 아니거나 id가 없는 깨진 항목은 걸러낸다", () => {
        const state = buildInitialListState({
            items: [entry(3), null, { id: 2 }, { content: "id 없음" }, { id: 1, content: 5 }, entry(4)],
            page: 0,
            hasNext: false,
        });
        expect(state.items.map((e) => e.id)).toEqual([3, 4]);
    });

    it("걸러낸 뒤 글이 하나도 없거나 items가 배열이 아니면 복원하지 않고 처음 상태다", () => {
        expect(buildInitialListState({ items: [null, { id: 1 }], page: 0, hasNext: false })).toBe(initialEntryListState);
        expect(buildInitialListState({ items: "x", page: 0, hasNext: false })).toBe(initialEntryListState);
        expect(buildInitialListState({ items: [], page: 0, hasNext: false })).toBe(initialEntryListState);
    });
});
