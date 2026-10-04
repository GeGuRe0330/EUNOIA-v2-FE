import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

// 편집 모달을 실제로 렌더해 이동·확대·적용 흐름을 확인한다 — 캔버스(JPEG 만들기)만 가짜로 대체(jsdom에는 캔버스가 없음), 사진 로드 이벤트는 직접 낸다
vi.mock("./profileImageCanvas", () => ({ renderCroppedBlob: vi.fn() }));

import { renderCroppedBlob } from "./profileImageCanvas";
import ProfileImageCropper, { CROP_VIEW_SIZE } from "./ProfileImageCropper";
import { IMAGE_FILE_ERRORS } from "./profileImageFile";
import { PROFILE_COPY } from "./profileSettingsView";
import { MAX_ZOOM } from "./profileImageCrop";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("ProfileImageCropper", () => {
    let container;
    let root;
    let onApply;
    let onCancel;

    const file = new File(["x"], "photo.jpg", { type: "image/jpeg" });

    const render = (props = {}) =>
        act(() => {
            root.render(createElement(ProfileImageCropper, { file, onApply, onCancel, ...props }));
        });

    const q = (selector) => document.body.querySelector(selector);
    const image = () => q("img");
    const view = () => q('[role="group"]');
    const slider = () => q('input[type="range"]');
    const button = (text) => [...document.body.querySelectorAll("button")].find((b) => b.textContent === text);
    const px = (value) => parseFloat(value);

    // 사진이 불러와진 것처럼 — 크기를 정해 load 이벤트를 낸다
    const loadImage = (width = 2000, height = 1500) =>
        act(() => {
            Object.defineProperty(image(), "naturalWidth", { configurable: true, value: width });
            Object.defineProperty(image(), "naturalHeight", { configurable: true, value: height });
            image().dispatchEvent(new Event("load"));
        });

    const setSlider = (value) =>
        act(() => {
            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
            setter.call(slider(), String(value));
            slider().dispatchEvent(new Event("input", { bubbles: true }));
        });

    const key = (name, options = {}) =>
        act(() => {
            view().dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true, ...options }));
        });

    const mouse = (type, x, y) =>
        act(() => {
            view().dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, bubbles: true, cancelable: true }));
        });

    beforeEach(() => {
        onApply = vi.fn();
        onCancel = vi.fn();
        vi.mocked(renderCroppedBlob).mockReset();
        URL.createObjectURL = vi.fn(() => "blob:test");
        URL.revokeObjectURL = vi.fn();
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        document.body.style.overflow = "";
    });

    it("사진을 불러오는 동안은 적용·확대를 쓸 수 없다", () => {
        render();
        expect(button(PROFILE_COPY.cropApply).disabled).toBe(true);
        expect(slider().disabled).toBe(true);
        expect(document.body.textContent).toContain(PROFILE_COPY.cropLoading);
    });

    it("고른 파일을 화면에 띄울 주소로 만들고, 닫히면 해제한다", () => {
        render();
        expect(URL.createObjectURL).toHaveBeenCalledWith(file);
        expect(image().getAttribute("src")).toBe("blob:test");

        act(() => root.unmount());
        expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test");
        root = createRoot(container);
    });

    it("사진이 불러와지면 최소 확대로 틀을 꽉 채우고 적용할 수 있다(가로형: 높이가 틀과 같다)", () => {
        render();
        loadImage(2000, 1500);

        expect(button(PROFILE_COPY.cropApply).disabled).toBe(false);
        expect(slider().disabled).toBe(false);
        expect(px(image().style.height)).toBeCloseTo(CROP_VIEW_SIZE);
        expect(px(image().style.width)).toBeCloseTo((CROP_VIEW_SIZE * 2000) / 1500);
        expect(px(image().style.top)).toBeCloseTo(0);
    });

    it("세로형 사진은 너비가 틀과 같다", () => {
        render();
        loadImage(1500, 2000);
        expect(px(image().style.width)).toBeCloseTo(CROP_VIEW_SIZE);
    });

    it("슬라이더로 확대하면 사진이 커진다", () => {
        render();
        loadImage();
        setSlider(2);
        expect(px(image().style.height)).toBeCloseTo(CROP_VIEW_SIZE * 2);
    });

    it("슬라이더는 한계를 넘지 않는다", () => {
        render();
        loadImage();
        setSlider(99);
        expect(px(image().style.height)).toBeCloseTo(CROP_VIEW_SIZE * MAX_ZOOM);
    });

    it("화살표 키로 이동한다 — 오른쪽 키는 사진이 오른쪽으로(left가 커짐), 가로로 넘치는 쪽만 움직인다", () => {
        render();
        loadImage(2000, 1500);
        const before = px(image().style.left);

        key("ArrowRight");
        expect(px(image().style.left)).toBeCloseTo(before + 12);

        // 세로는 사진이 틀과 꼭 맞아 움직이지 않는다
        key("ArrowDown");
        expect(px(image().style.top)).toBeCloseTo(0);
    });

    it("이동해도 사진이 틀 밖으로 벗어나 빈 영역이 생기지 않는다", () => {
        render();
        loadImage(2000, 1500);
        for (let i = 0; i < 200; i += 1) key("ArrowRight");

        expect(px(image().style.left)).toBeLessThanOrEqual(1e-6);
        expect(px(image().style.left) + px(image().style.width)).toBeGreaterThanOrEqual(CROP_VIEW_SIZE - 1e-6);
    });

    it("+/- 키로 확대·축소한다", () => {
        render();
        loadImage();
        key("+");
        const zoomed = px(image().style.height);
        expect(zoomed).toBeGreaterThan(CROP_VIEW_SIZE);
        key("-");
        expect(px(image().style.height)).toBeLessThan(zoomed);
    });

    it("관계없는 키(Tab 등)는 막지 않는다", () => {
        render();
        loadImage();
        const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
        act(() => {
            view().dispatchEvent(event);
        });
        expect(event.defaultPrevented).toBe(false);
    });

    it("드래그로 이동한다 — 끌지 않고 움직이기만 하면 이동하지 않는다", () => {
        render();
        loadImage(2000, 1500);
        const before = px(image().style.left);

        mouse("pointermove", 100, 100); // 누르지 않은 채 움직임
        expect(px(image().style.left)).toBeCloseTo(before);

        mouse("pointerdown", 100, 100);
        mouse("pointermove", 120, 100);
        expect(px(image().style.left)).toBeCloseTo(before + 20);

        mouse("pointerup", 120, 100);
        mouse("pointermove", 200, 100); // 뗀 뒤에는 이동하지 않음
        expect(px(image().style.left)).toBeCloseTo(before + 20);
    });

    it("마우스 휠로 확대하고 페이지 스크롤은 막는다", () => {
        render();
        loadImage();
        const event = new WheelEvent("wheel", { deltaY: -300, bubbles: true, cancelable: true });
        act(() => {
            view().dispatchEvent(event);
        });
        expect(px(image().style.height)).toBeGreaterThan(CROP_VIEW_SIZE);
        expect(event.defaultPrevented).toBe(true);
    });

    it("[적용하기]는 틀 안의 영역으로 파일을 만들어 넘긴다", async () => {
        const blob = new Blob(["jpeg"], { type: "image/jpeg" });
        vi.mocked(renderCroppedBlob).mockResolvedValue(blob);
        render();
        loadImage(2000, 1500);
        setSlider(2);

        await act(async () => {
            button(PROFILE_COPY.cropApply).click();
        });

        expect(renderCroppedBlob).toHaveBeenCalledTimes(1);
        const [img, crop] = vi.mocked(renderCroppedBlob).mock.calls[0];
        expect(img).toBe(image());
        expect(crop.zoom).toBe(2);
        expect(onApply).toHaveBeenCalledWith(blob);
    });

    it("파일을 만들지 못하면 안내하고 넘기지 않는다", async () => {
        vi.mocked(renderCroppedBlob).mockRejectedValue(new Error("fail"));
        render();
        loadImage();

        await act(async () => {
            button(PROFILE_COPY.cropApply).click();
        });

        expect(onApply).not.toHaveBeenCalled();
        expect(q('[role="alert"]').textContent).toBe(PROFILE_COPY.cropRenderFailed);
    });

    it("사진을 불러오지 못하면 안내하고 적용할 수 없다", () => {
        render();
        act(() => {
            image().dispatchEvent(new Event("error"));
        });
        expect(q('[role="alert"]').textContent).toBe(IMAGE_FILE_ERRORS.load);
        expect(button(PROFILE_COPY.cropApply).disabled).toBe(true);
    });

    it("크기가 0인 사진은 불러오지 못한 것으로 본다", () => {
        render();
        loadImage(0, 0);
        expect(q('[role="alert"]').textContent).toBe(IMAGE_FILE_ERRORS.load);
        expect(button(PROFILE_COPY.cropApply).disabled).toBe(true);
    });

    it("부모가 준 오류(업로드 실패)를 보여준다", () => {
        render({ errorMessage: "서버에 오류가 발생했어요." });
        loadImage();
        expect(q('[role="alert"]').textContent).toBe("서버에 오류가 발생했어요.");
    });

    it("[취소]·Escape로 닫는다", () => {
        render();
        button(PROFILE_COPY.cropCancel).click();
        expect(onCancel).toHaveBeenCalledTimes(1);

        act(() => {
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
        });
        expect(onCancel).toHaveBeenCalledTimes(2);
    });

    it("올리는 중(busy)에는 버튼·슬라이더·이동이 막히고 닫히지 않는다", () => {
        render({ busy: true });
        loadImage();
        expect(button(PROFILE_COPY.cropApplying).disabled).toBe(true);
        expect(button(PROFILE_COPY.cropCancel).disabled).toBe(true);
        expect(slider().disabled).toBe(true);

        const before = px(image().style.left);
        key("ArrowRight");
        mouse("pointerdown", 0, 0);
        mouse("pointermove", 30, 0);
        expect(px(image().style.left)).toBeCloseTo(before);

        act(() => {
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
        });
        expect(onCancel).not.toHaveBeenCalled();
    });

    it("설명은 두 문장이 줄바꿈으로 나뉘어 보인다(줄바꿈이 공백으로 합쳐지지 않게 pre-line)", () => {
        render();
        const hint = q(`#${CSS.escape(view().getAttribute("aria-describedby"))}`);
        expect(hint.textContent).toBe(`${PROFILE_COPY.cropHint}\n${PROFILE_COPY.cropKeyHint}`);
        expect(hint.className).toContain("whitespace-pre-line");
    });

    it("열리면 편집 영역에 포커스가 간다(키보드로 바로 조정)", () => {
        render();
        expect(document.activeElement).toBe(view());
    });
});
