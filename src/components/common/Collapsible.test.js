import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import Collapsible, { COLLAPSE_DURATION_MS } from "./Collapsible";

// 실제로 렌더해서 열고 닫는 순서(그림 → 펼침 상태 전환 → 접힘 → 제거)를 확인한다 — 타이머와 프레임은 가짜 시계로 흘려보낸다
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("Collapsible", () => {
    let container;
    let root;

    const render = (open) =>
        act(() => {
            root.render(
                createElement(Collapsible, { open, id: "panel", labelledBy: "title" }, createElement("p", { "data-testid": "body" }, "안쪽"))
            );
        });

    const region = () => container.querySelector("#panel");
    const advance = (ms) =>
        act(() => {
            vi.advanceTimersByTime(ms);
        });

    beforeEach(() => {
        vi.useFakeTimers();
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        vi.useRealTimers();
    });

    it("닫혀 있으면 아예 그리지 않는다(안쪽 요소가 키보드 포커스를 받지 않음)", () => {
        render(false);
        expect(region()).toBeNull();
        expect(container.querySelector('[data-testid="body"]')).toBeNull();
    });

    it("열면 먼저 닫힌 모양으로 그린 뒤 프레임이 지나면 펼침 상태로 바뀐다(그래야 전환이 보임)", () => {
        render(false);
        render(true);

        expect(region()).not.toBeNull();
        expect(region().className).toContain("grid-rows-[0fr]");
        expect(region().className).toContain("opacity-0");

        advance(100); // 두 프레임이 지나감

        expect(region().className).toContain("grid-rows-[1fr]");
        expect(region().className).toContain("opacity-100");
    });

    it("펼침 영역에 id·role·aria-labelledby가 붙는다", () => {
        render(true);
        advance(100);

        expect(region().getAttribute("role")).toBe("region");
        expect(region().getAttribute("aria-labelledby")).toBe("title");
    });

    it("닫으면 먼저 접히고, 전환 시간이 지나야 없앤다", () => {
        render(true);
        advance(100);

        render(false);
        expect(region()).not.toBeNull();
        expect(region().className).toContain("grid-rows-[0fr]");

        advance(COLLAPSE_DURATION_MS - 1);
        expect(region()).not.toBeNull(); // 아직 전환 중

        advance(1);
        expect(region()).toBeNull();
    });

    it("접히는 도중 다시 열면 없애지 않고 다시 펼친다", () => {
        render(true);
        advance(100);

        render(false);
        advance(100);
        render(true);
        advance(COLLAPSE_DURATION_MS + 100);

        expect(region()).not.toBeNull();
        expect(region().className).toContain("grid-rows-[1fr]");
    });

    it("처음부터 열린 채로 그리면 바로 펼친 상태다", () => {
        render(true);
        // 첫 렌더 직후(프레임 전)에도 이미 펼침 상태로 시작
        expect(region().className).toContain("grid-rows-[1fr]");
    });

    it("움직임을 줄이는 설정에서는 전환을 끈다", () => {
        render(true);
        expect(region().className).toContain("motion-reduce:transition-none");
    });
});
