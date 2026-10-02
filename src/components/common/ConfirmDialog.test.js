import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import ConfirmDialog from "./ConfirmDialog";

// 모달을 실제로 렌더해서 접근성·키보드·스크롤 잠금·포커스 복귀를 확인한다 — 위험한 동작을 확인받는 화면이라 동작이 어긋나면 안 됨
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("ConfirmDialog", () => {
    let container;
    let root;
    let onConfirm;
    let onCancel;

    const base = { title: "이 글을 삭제할까요?", description: "삭제하면 되돌릴 수 없어요.", confirmLabel: "삭제하기", busyLabel: "삭제하는 중…" };

    const render = (props) => {
        act(() => {
            root.render(createElement(ConfirmDialog, { ...base, onConfirm, onCancel, ...props }));
        });
    };

    const dialog = () => document.body.querySelector('[role="alertdialog"]');
    const buttons = () => [...document.body.querySelectorAll('[role="alertdialog"] button')];
    const [cancelButton, confirmButton] = [() => buttons()[0], () => buttons()[1]];
    const press = (key, options = {}) =>
        act(() => {
            document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...options }));
        });
    const backdrop = () => dialog().parentElement;

    beforeEach(() => {
        onConfirm = vi.fn();
        onCancel = vi.fn();
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        document.body.style.overflow = "";
    });

    it("닫혀 있으면 아무것도 그리지 않는다", () => {
        render({ open: false });
        expect(dialog()).toBeNull();
    });

    it("열리면 document.body에 직접 그린다(카드의 transform에 갇히지 않게)", () => {
        render({ open: true });
        expect(dialog()).not.toBeNull();
        expect(container.contains(dialog())).toBe(false);
        expect(document.body.contains(dialog())).toBe(true);
    });

    it("접근성 속성을 갖는다 — alertdialog, aria-modal, 제목·설명 연결", () => {
        render({ open: true });
        const el = dialog();
        expect(el.getAttribute("aria-modal")).toBe("true");
        expect(document.getElementById(el.getAttribute("aria-labelledby")).textContent).toBe("이 글을 삭제할까요?");
        expect(document.getElementById(el.getAttribute("aria-describedby")).textContent).toBe("삭제하면 되돌릴 수 없어요.");
    });

    it("열리면 [취소]에 포커스가 간다(엔터를 잘못 쳐도 삭제되지 않게)", () => {
        render({ open: true });
        expect(document.activeElement).toBe(cancelButton());
    });

    it("설명의 줄바꿈(\\n)을 그대로 보여주도록 whitespace-pre-line을 쓴다(없으면 한 줄로 합쳐져 나옴)", () => {
        render({ open: true, description: "첫째 줄\n둘째 줄" });
        const description = document.getElementById(dialog().getAttribute("aria-describedby"));
        expect(description.textContent).toBe("첫째 줄\n둘째 줄");
        expect(description.className).toContain("whitespace-pre-line");
    });

    it("[삭제하기]를 누르면 onConfirm, [취소]를 누르면 onCancel을 부른다", () => {
        render({ open: true });
        act(() => confirmButton().click());
        expect(onConfirm).toHaveBeenCalledTimes(1);
        act(() => cancelButton().click());
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("Escape로 닫는다", () => {
        render({ open: true });
        press("Escape");
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("배경을 누르면 닫히고, 모달 안을 누르면 닫히지 않는다", () => {
        render({ open: true });
        act(() => {
            dialog().dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        });
        expect(onCancel).not.toHaveBeenCalled();

        act(() => {
            backdrop().dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        });
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("요청 중(busy)에는 Escape·배경 클릭으로 닫히지 않고, 두 버튼이 모두 막힌다", () => {
        render({ open: true, busy: true });
        press("Escape");
        act(() => {
            backdrop().dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        });
        expect(onCancel).not.toHaveBeenCalled();
        expect(cancelButton().disabled).toBe(true);
        expect(confirmButton().disabled).toBe(true);
    });

    it("요청 중에는 확인 버튼이 busyLabel로 바뀌고, 포커스는 모달 자체에 둔다(버튼이 막혀 포커스가 사라지지 않게)", () => {
        render({ open: true, busy: true });
        expect(confirmButton().textContent).toBe("삭제하는 중…");
        expect(document.activeElement).toBe(dialog());
    });

    it("busy가 끝나면(오류로 남았을 때) 포커스가 [취소]로 돌아온다", () => {
        render({ open: true, busy: true });
        render({ open: true, busy: false, errorMessage: "삭제하지 못했어요." });
        expect(document.activeElement).toBe(cancelButton());
    });

    it("오류 문구를 알림(role=alert)으로 보여준다", () => {
        render({ open: true, errorMessage: "삭제하지 못했어요. 잠시 뒤에 다시 시도해 주세요." });
        expect(document.body.querySelector('[role="alertdialog"] [role="alert"]').textContent).toBe(
            "삭제하지 못했어요. 잠시 뒤에 다시 시도해 주세요."
        );
    });

    it("마지막 버튼에서 Tab을 누르면 첫 버튼으로, 첫 버튼에서 Shift+Tab을 누르면 마지막 버튼으로 돌아간다(모달 밖으로 나가지 않음)", () => {
        render({ open: true });
        confirmButton().focus();
        press("Tab");
        expect(document.activeElement).toBe(cancelButton());

        press("Tab", { shiftKey: true });
        expect(document.activeElement).toBe(confirmButton());
    });

    it("포커스가 모달 밖에 있어도 Tab을 누르면 모달 안으로 돌아온다", () => {
        const outside = document.createElement("button");
        document.body.appendChild(outside);
        render({ open: true });
        outside.focus();

        press("Tab");
        expect(dialog().contains(document.activeElement)).toBe(true);
        outside.remove();
    });

    it("열려 있는 동안 배경 스크롤을 잠그고, 닫으면 원래대로 돌린다", () => {
        document.body.style.overflow = "auto";
        render({ open: true });
        expect(document.body.style.overflow).toBe("hidden");

        render({ open: false });
        expect(document.body.style.overflow).toBe("auto");
    });

    it("언마운트(화면 이동)돼도 배경 스크롤 잠금을 풀어 준다", () => {
        render({ open: true });
        act(() => root.unmount());
        expect(document.body.style.overflow).toBe("");
        root = createRoot(container); // afterEach의 unmount를 위해
    });

    it("닫히면 열기 전에 포커스가 있던 요소(예: [삭제] 버튼)로 포커스를 돌려준다", () => {
        const trigger = document.createElement("button");
        document.body.appendChild(trigger);
        trigger.focus();

        render({ open: true });
        expect(document.activeElement).toBe(cancelButton());

        render({ open: false });
        expect(document.activeElement).toBe(trigger);
        trigger.remove();
    });

    it("위험한 확인이면(danger) 확인 버튼이 붉은 계열이다", () => {
        render({ open: true, danger: true });
        expect(confirmButton().className).toContain("bg-red-500");
    });
});
