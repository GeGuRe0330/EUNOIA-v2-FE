import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, useRef } from "react";
import { createRoot } from "react-dom/client";
import { useInViewTrigger } from "./useInViewTrigger";

// 훅을 실제로 렌더해서 검증한다 — IntersectionObserver는 jsdom에 없어 가짜로 대체하고, 보이는 상태를 테스트가 직접 흘려보낸다
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let observers;

class FakeObserver {
    constructor(callback, options) {
        this.callback = callback;
        this.options = options;
        this.observed = [];
        this.disconnected = false;
        observers.push(this);
    }

    observe(target) {
        this.observed.push(target);
    }

    disconnect() {
        this.disconnected = true;
    }

    // 지켜보는 요소가 화면에 들어왔다/나갔다
    emit(isIntersecting) {
        this.callback([{ isIntersecting }]);
    }
}

const Probe = ({ enabled, onTrigger, rootMargin }) => {
    const ref = useRef(null);
    useInViewTrigger(ref, { enabled, onTrigger, rootMargin });
    return createElement("div", { ref, "data-testid": "sentinel" });
};

describe("useInViewTrigger", () => {
    let container;
    let root;

    const render = (props) => {
        act(() => {
            root.render(createElement(Probe, props));
        });
    };

    beforeEach(() => {
        observers = [];
        vi.stubGlobal("IntersectionObserver", FakeObserver);
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        vi.unstubAllGlobals();
    });

    it("enabled면 요소를 지켜보고, 화면에 들어오면 onTrigger를 한 번 부른다", () => {
        const onTrigger = vi.fn();
        render({ enabled: true, onTrigger });

        expect(observers).toHaveLength(1);
        expect(observers[0].observed).toHaveLength(1);

        observers[0].emit(true);
        expect(onTrigger).toHaveBeenCalledTimes(1);
    });

    it("화면 밖으로 나가는 신호에는 부르지 않는다", () => {
        const onTrigger = vi.fn();
        render({ enabled: true, onTrigger });

        observers[0].emit(false);
        expect(onTrigger).not.toHaveBeenCalled();
        expect(observers[0].disconnected).toBe(false);
    });

    it("신호를 보낸 뒤 바로 관찰을 끊어 같은 신호가 겹쳐 오지 않게 한다", () => {
        const onTrigger = vi.fn();
        render({ enabled: true, onTrigger });

        observers[0].emit(true);
        expect(observers[0].disconnected).toBe(true);
    });

    it("enabled가 false면 관찰하지 않는다(불러오는 중·마지막 페이지·오류 후)", () => {
        render({ enabled: false, onTrigger: vi.fn() });
        expect(observers).toHaveLength(0);
    });

    it("enabled가 꺼지면 진행 중이던 관찰을 끊는다", () => {
        render({ enabled: true, onTrigger: vi.fn() });
        render({ enabled: false, onTrigger: vi.fn() });
        expect(observers[0].disconnected).toBe(true);
    });

    it("onTrigger가 바뀌면 새로 관찰한다 — 불러온 뒤에도 요소가 보이면 이어서 다음 페이지를 불러오기 위함", () => {
        const first = vi.fn();
        const second = vi.fn();
        render({ enabled: true, onTrigger: first });
        render({ enabled: true, onTrigger: second });

        expect(observers).toHaveLength(2);
        expect(observers[0].disconnected).toBe(true);

        observers[1].emit(true);
        expect(second).toHaveBeenCalledTimes(1);
        expect(first).not.toHaveBeenCalled();
    });

    it("rootMargin을 넘기고, 기본값은 화면 아래 300px 앞에서 미리 불러온다", () => {
        render({ enabled: true, onTrigger: vi.fn() });
        expect(observers[0].options.rootMargin).toBe("300px 0px");

        render({ enabled: true, onTrigger: vi.fn(), rootMargin: "50px 0px" });
        expect(observers.at(-1).options.rootMargin).toBe("50px 0px");
    });

    it("언마운트하면 관찰을 끊는다", () => {
        render({ enabled: true, onTrigger: vi.fn() });
        act(() => root.unmount());
        expect(observers[0].disconnected).toBe(true);
        root = createRoot(container); // afterEach의 unmount를 위해
    });

    it("IntersectionObserver가 없는 환경에서는 조용히 아무것도 하지 않는다", () => {
        vi.stubGlobal("IntersectionObserver", undefined);
        const onTrigger = vi.fn();
        expect(() => render({ enabled: true, onTrigger })).not.toThrow();
        expect(observers).toHaveLength(0);
        expect(onTrigger).not.toHaveBeenCalled();
    });
});
