import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { ScoreTick } from "./EmotionScoreChart";
import { iconCenterY } from "./chartData";

// Y축 눈금이 25·75에만 아이콘을 그리고 나머지는 비우는지 — 차트(recharts)는 jsdom에서 크기를 못 재 그려지지 않으므로 눈금 컴포넌트만 따로 렌더해 확인한다
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("ScoreTick", () => {
    let container;
    let root;

    const render = (props) =>
        act(() => {
            root.render(createElement("svg", null, createElement(ScoreTick, props)));
        });
    const icon = () => container.querySelector("svg > svg");

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
    });

    it("25에는 가라앉은 쪽, 75에는 편안한 쪽 아이콘을 서로 다르게 그린다", () => {
        render({ x: 24, y: 80, payload: { value: 25 } });
        const low = icon().getAttribute("class");
        render({ x: 24, y: 20, payload: { value: 75 } });
        const high = icon().getAttribute("class");

        expect(low).toContain("lucide-frown");
        expect(high).toContain("lucide-smile");
        expect(low).not.toBe(high);
    });

    it.each([0, 50, 100, 10, undefined])("점수 %s 눈금에는 아무것도 그리지 않는다", (value) => {
        render({ x: 24, y: 50, payload: { value } });
        expect(icon()).toBeNull();
    });

    it("payload가 없어도 예외 없이 비워 둔다", () => {
        render({ x: 24, y: 50 });
        expect(icon()).toBeNull();
    });

    it("눈금의 왼쪽에 놓는다 — 눈금 선과 겹치지 않음", () => {
        render({ x: 24, y: 80, height: 200, payload: { value: 25 } });
        const el = icon();

        expect(Number(el.getAttribute("x")) + Number(el.getAttribute("width"))).toBeLessThan(24);
    });

    it("아이콘은 눈금 칸의 가장자리 쪽으로 옮겨 놓는다 — 찡그린 얼굴은 눈금 25보다 아래(점수 12.5), 웃는 얼굴은 눈금 75보다 위(점수 87.5)", () => {
        const center = () => Number(icon().getAttribute("y")) + Number(icon().getAttribute("height")) / 2;

        // 축 길이 200px → 점수 1점 = 2px, 눈금 25의 y=150 / 눈금 75의 y=50이라면 12.5점 차이 = 25px
        render({ x: 24, y: 150, height: 200, payload: { value: 25 } });
        expect(center()).toBe(175);
        render({ x: 24, y: 50, height: 200, payload: { value: 75 } });
        expect(center()).toBe(25);
    });

    it("두 아이콘 사이는 눈금 칸이 3.5칸 벌어진다(0.5칸과 3.5칸 자리) — 이전(1칸·3칸)보다 넓다", () => {
        // 축 길이 400px, 눈금 간격 100px(= 25점). 아래 아이콘 중심은 맨 아래 눈금(0점)에서 0.5칸 위, 위 아이콘 중심은 맨 위 눈금(100점)에서 0.5칸 아래
        const bottom = iconCenterY({ y: 300, height: 400, value: 25, at: 12.5 }); // 25점 눈금의 y = 300
        const top = iconCenterY({ y: 100, height: 400, value: 75, at: 87.5 }); // 75점 눈금의 y = 100
        const zeroLineY = 400;
        const hundredLineY = 0;
        expect((zeroLineY - bottom) / 100).toBe(0.5);
        expect((top - hundredLineY) / 100).toBe(0.5);
    });

    it("축 길이(height)를 모르면 눈금 위치 그대로 둔다(옮기지 않음)", () => {
        render({ x: 24, y: 80, payload: { value: 25 } });
        const el = icon();
        expect(Number(el.getAttribute("y")) + Number(el.getAttribute("height")) / 2).toBe(80);
        expect(iconCenterY({ y: 80, height: undefined, value: 25, at: 12.5 })).toBe(80);
        expect(iconCenterY({ y: 80, height: NaN, value: 25, at: 12.5 })).toBe(80);
    });

    it("장식이라 화면 낭독에서 빼고, 이모지가 아니라 단색 SVG다(글자 노드 없음)", () => {
        render({ x: 24, y: 80, payload: { value: 75 } });
        expect(icon().getAttribute("aria-hidden")).toBe("true");
        expect(icon().textContent).toBe("");
    });
});
