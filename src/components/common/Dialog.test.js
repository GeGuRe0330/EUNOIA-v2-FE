import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, createRef } from "react";
import { createRoot } from "react-dom/client";
import Dialog from "./Dialog";

// 공통 모달 뼈대의 동작 — 확인 모달(ConfirmDialog 테스트)이 버튼 위주로 확인하지 못하는 부분(role, 처음 포커스 대상, 입력칸·tabindex를 포함한 Tab 가두기)을 확인한다
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("Dialog", () => {
    let container;
    let root;
    let onClose;

    const body = () => [
        createElement("div", { key: "v", tabIndex: 0, "data-testid": "view" }, "영역"),
        createElement("input", { key: "i", type: "range", "data-testid": "slider" }),
        createElement("button", { key: "b", type: "button", "data-testid": "last" }, "확인"),
        createElement("button", { key: "x", type: "button", disabled: true, "data-testid": "disabled" }, "막힘"),
    ];

    const render = (props = {}) =>
        act(() => {
            root.render(createElement(Dialog, { open: true, onClose, labelledBy: "t", ...props }, body()));
        });

    const dialog = () => document.body.querySelector('[role="dialog"], [role="alertdialog"]');
    const q = (id) => document.body.querySelector(`[data-testid="${id}"]`);
    const press = (key, options = {}) =>
        act(() => {
            document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...options }));
        });

    beforeEach(() => {
        onClose = vi.fn();
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        document.body.style.overflow = "";
    });

    it("기본 역할은 dialog이고 role로 바꿀 수 있다", () => {
        render();
        expect(dialog().getAttribute("role")).toBe("dialog");
        expect(dialog().getAttribute("aria-modal")).toBe("true");

        render({ role: "alertdialog" });
        expect(dialog().getAttribute("role")).toBe("alertdialog");
    });

    it("처음 포커스 대상을 정하지 않으면 모달 자체로 포커스가 간다", () => {
        render();
        expect(document.activeElement).toBe(dialog());
    });

    it("처음 포커스 대상(initialFocusRef)을 정하면 그 요소로 간다", () => {
        const ref = createRef();
        act(() => {
            root.render(
                createElement(Dialog, { open: true, onClose, initialFocusRef: ref }, createElement("button", { ref, type: "button", "data-testid": "first" }, "처음"))
            );
        });
        expect(document.activeElement).toBe(q("first"));
    });

    it("Tab은 입력칸·tabindex 요소까지 포함해 모달 안에서만 돈다(막힌 버튼은 건너뜀)", () => {
        render();
        // 순서: view(tabindex 0) → slider → last. 마지막에서 Tab → 첫 번째로
        q("last").focus();
        press("Tab");
        expect(document.activeElement).toBe(q("view"));

        // 첫 번째에서 Shift+Tab → 마지막으로
        press("Tab", { shiftKey: true });
        expect(document.activeElement).toBe(q("last"));
    });

    it("입력칸이 맨 끝·맨 앞이어도 Tab 순환에 포함된다", () => {
        act(() => {
            root.render(
                createElement(
                    Dialog,
                    { open: true, onClose },
                    createElement("button", { type: "button", "data-testid": "first" }, "처음"),
                    createElement("input", { type: "range", "data-testid": "end-input" })
                )
            );
        });
        q("end-input").focus();
        press("Tab"); // 마지막(입력칸)에서 Tab → 첫 번째로 돌아가야 한다
        expect(document.activeElement).toBe(q("first"));

        press("Tab", { shiftKey: true }); // 첫 번째에서 Shift+Tab → 마지막(입력칸)으로
        expect(document.activeElement).toBe(q("end-input"));
    });

    it("포커스가 모달 밖에 있으면 Tab으로 모달 안으로 들어온다", () => {
        render();
        const outside = document.createElement("button");
        document.body.appendChild(outside);
        outside.focus();

        press("Tab");
        expect(document.activeElement).toBe(q("view"));
        outside.remove();
    });

    it("Escape와 바깥 클릭으로 닫힌다(onClose)", () => {
        render();
        press("Escape");
        expect(onClose).toHaveBeenCalledTimes(1);

        act(() => {
            dialog().parentElement.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        });
        expect(onClose).toHaveBeenCalledTimes(2);

        // 모달 안을 누르면 닫히지 않는다
        act(() => {
            q("view").dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        });
        expect(onClose).toHaveBeenCalledTimes(2);
    });

    it("busy 중에는 Escape·바깥 클릭으로 닫히지 않고 포커스는 모달 자체로 간다", () => {
        render({ busy: true });
        press("Escape");
        act(() => {
            dialog().parentElement.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        });
        expect(onClose).not.toHaveBeenCalled();
        expect(document.activeElement).toBe(dialog());
    });

    it("열려 있는 동안 배경 스크롤을 잠그고 닫히면 풀며, 포커스를 이전 요소로 돌려준다", () => {
        const opener = document.createElement("button");
        document.body.appendChild(opener);
        opener.focus();
        document.body.style.overflow = "auto";

        render();
        expect(document.body.style.overflow).toBe("hidden");

        render({ open: false });
        expect(document.body.style.overflow).toBe("auto");
        expect(document.activeElement).toBe(opener);
        opener.remove();
    });

    it("닫혀 있으면 아무것도 그리지 않는다", () => {
        render({ open: false });
        expect(dialog()).toBeNull();
    });
});
