import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, useNavigate } from "react-router-dom";
import ScrollToTop from "./ScrollToTop";

// 실제로 렌더해서 경로가 바뀔 때만 맨 위로 가는지 확인한다 — jsdom에는 scrollTo가 없어 가짜로 대체
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let navigate;

const Harness = () => {
    navigate = useNavigate();
    return createElement(ScrollToTop);
};

describe("ScrollToTop", () => {
    let container;
    let root;
    let scrollTo;

    beforeEach(() => {
        scrollTo = vi.fn();
        vi.stubGlobal("scrollTo", scrollTo);
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);

        act(() => {
            root.render(createElement(MemoryRouter, { initialEntries: ["/myPage"] }, createElement(Harness)));
        });
        scrollTo.mockClear(); // 첫 렌더의 호출은 비교 대상이 아님
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        vi.unstubAllGlobals();
    });

    it("다른 화면으로 이동하면 맨 위로 즉시 스크롤한다", () => {
        act(() => navigate("/entries"));

        expect(scrollTo).toHaveBeenCalledTimes(1);
        expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "instant" });
    });

    it("같은 화면에서 쿼리만 바뀌면 스크롤을 건드리지 않는다(날짜 지정을 바꿀 때 위로 튀지 않음)", () => {
        act(() => navigate("/entries"));
        scrollTo.mockClear();

        act(() => navigate("/entries?from=2026-10-01&to=2026-10-12", { replace: true }));
        act(() => navigate("/entries?from=2026-10-02&to=2026-10-12", { replace: true }));

        expect(scrollTo).not.toHaveBeenCalled();
    });

    it("화면을 옮길 때마다 맨 위로 간다", () => {
        act(() => navigate("/entries"));
        act(() => navigate("/myPage"));

        expect(scrollTo).toHaveBeenCalledTimes(2);
    });

    it("같은 경로로 다시 이동해도 경로가 같으면 스크롤하지 않는다", () => {
        act(() => navigate("/myPage"));
        expect(scrollTo).not.toHaveBeenCalled();
    });
});
