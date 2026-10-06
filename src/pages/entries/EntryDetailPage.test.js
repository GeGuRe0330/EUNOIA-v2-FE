import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

// 상세 화면을 실제로 렌더해 실제 서버가 주는 응답 조합(삭제된 글·분석 처리 중 등)에서 어떻게 그려지는지 확인한다 — API만 가짜로 대체
vi.mock("../../api/EunoiaApi", () => ({
    getEmotionEntry: vi.fn(),
    getAnalysisByEntry: vi.fn(),
    deleteEmotionEntry: vi.fn(),
}));

import { getEmotionEntry, getAnalysisByEntry, deleteEmotionEntry } from "../../api/EunoiaApi";
import EntryDetailPage from "./EntryDetailPage";
import { ANALYSIS_HINTS, NOT_FOUND_MESSAGE } from "./entryDetailView";
import { DELETE_CONFIRM, ENTRY_NOTICES } from "./entryDeleteView";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

const Probe = () => {
    const location = useLocation();
    return createElement("div", { "data-testid": "probe", "data-state": JSON.stringify(location.state ?? null) }, location.pathname + location.search);
};

describe("EntryDetailPage", () => {
    let container;
    let root;

    const render = async (path = "/entries/84", state) => {
        await act(async () => {
            root.render(
                createElement(
                    MemoryRouter,
                    { initialEntries: [{ pathname: path, state }] },
                    createElement(
                        Routes,
                        null,
                        createElement(Route, { path: "/entries/:id", element: createElement(EntryDetailPage) }),
                        createElement(Route, { path: "/entries", element: createElement(Probe) }),
                        createElement(Route, { path: "/login", element: createElement("div", null, "로그인") })
                    )
                )
            );
        });
        await flush();
    };

    const text = () => document.body.textContent;
    const button = (label) => [...document.body.querySelectorAll("button")].find((b) => b.textContent.includes(label));
    const probe = () => document.body.querySelector('[data-testid="probe"]');

    const entry = { id: 84, memberId: 7, content: "오늘은 힘든 하루였다.", entryDate: "2026-10-12" };
    const notFound = { status: 404, message: "존재하지 않는 감정글이에요.", fieldErrors: [] };
    const noAnalysis = { status: 404, message: "분석 결과를 찾을 수 없어요.", fieldErrors: [] };
    const processing = { entryId: 84, status: "PROCESSING", emotionDetected: null, keywords: null, reason: null, warmMessages: null };

    beforeEach(() => {
        vi.mocked(getEmotionEntry).mockReset();
        vi.mocked(getAnalysisByEntry).mockReset();
        vi.mocked(deleteEmotionEntry).mockReset();
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        document.body.style.overflow = "";
    });

    describe("서버가 주는 응답 조합", () => {
        it("삭제된 글(일기 404 + 분석 404)은 '없는 글' 화면만 보인다 — 분석 404를 '처리 중'으로 그리지 않고 [삭제]도 없다", async () => {
            vi.mocked(getEmotionEntry).mockRejectedValue(notFound);
            vi.mocked(getAnalysisByEntry).mockRejectedValue(noAnalysis);

            await render();

            expect(text()).toContain(NOT_FOUND_MESSAGE);
            expect(text()).not.toContain(ANALYSIS_HINTS.processing);
            expect(document.body.querySelector('[aria-labelledby="analysis-title"]')).toBeNull();
            expect(button("삭제")).toBeUndefined();
        });

        it("일기는 있고 분석이 처리 중이면(200 + PROCESSING) 원문과 '처리 중' 분석 영역이 보인다", async () => {
            vi.mocked(getEmotionEntry).mockResolvedValue(entry);
            vi.mocked(getAnalysisByEntry).mockResolvedValue(processing);

            await render();

            expect(text()).toContain("오늘은 힘든 하루였다.");
            expect(text()).toContain(ANALYSIS_HINTS.processing);
            expect(button("삭제")).toBeDefined();
        });

        it("일기는 있는데 분석이 404(진짜 없음)면 '처리 중'이 아니라 조회 오류(접힌 머리글에 '불러오지 못했어요')로 그린다", async () => {
            vi.mocked(getEmotionEntry).mockResolvedValue(entry);
            vi.mocked(getAnalysisByEntry).mockRejectedValue(noAnalysis);

            await render();

            expect(text()).toContain("오늘은 힘든 하루였다.");
            expect(text()).not.toContain(ANALYSIS_HINTS.processing);
            expect(text()).toContain(ANALYSIS_HINTS.error);
        });

        it("남의 글(403)은 서버 문구를 그대로 보이고 분석 영역은 없다", async () => {
            vi.mocked(getEmotionEntry).mockRejectedValue({ status: 403, message: "해당 감정글에 대한 접근 권한이 없어요.", fieldErrors: [] });
            vi.mocked(getAnalysisByEntry).mockRejectedValue({ status: 403, message: "해당 분석 결과에 대한 접근 권한이 없어요.", fieldErrors: [] });

            await render();

            expect(text()).toContain("해당 감정글에 대한 접근 권한이 없어요.");
            expect(document.body.querySelector('[aria-labelledby="analysis-title"]')).toBeNull();
        });

        it("숫자가 아닌 주소는 서버에 묻지 않고 같은 '없는 글' 화면", async () => {
            await render("/entries/abc");

            expect(getEmotionEntry).not.toHaveBeenCalled();
            expect(getAnalysisByEntry).not.toHaveBeenCalled();
            expect(text()).toContain(NOT_FOUND_MESSAGE);
        });
    });

    describe("삭제", () => {
        beforeEach(() => {
            vi.mocked(getEmotionEntry).mockResolvedValue(entry);
            vi.mocked(getAnalysisByEntry).mockResolvedValue(processing);
        });

        const openConfirm = async () => {
            await act(async () => { button("삭제").click(); });
        };
        const confirmDelete = async () => {
            await act(async () => { button(DELETE_CONFIRM.confirmLabel).click(); });
            await flush();
        };

        it("[삭제] → 확인 → 삭제 요청 후 목록으로 이동하며 '삭제했어요' 안내를 이동 상태로 넘긴다(히스토리는 replace)", async () => {
            vi.mocked(deleteEmotionEntry).mockResolvedValue(null);
            await render("/entries/84", { from: "/entries?from=2026-10-01&to=2026-10-12" });

            await openConfirm();
            await confirmDelete();

            expect(deleteEmotionEntry).toHaveBeenCalledWith(84);
            expect(probe().textContent).toBe("/entries?from=2026-10-01&to=2026-10-12");
            expect(JSON.parse(probe().getAttribute("data-state"))).toEqual({ entryNotice: "deleted" });
        });

        it("확인 모달에서 취소하면 요청하지 않는다", async () => {
            await render();
            await openConfirm();
            await act(async () => { button("취소").click(); });

            expect(deleteEmotionEntry).not.toHaveBeenCalled();
            expect(document.body.querySelector('[role="alertdialog"]')).toBeNull();
        });

        it("이미 지워진 글(404)은 실패가 아니라 목록으로 이동하며 '이미 지워진 글' 안내", async () => {
            vi.mocked(deleteEmotionEntry).mockRejectedValue(notFound);
            await render();

            await openConfirm();
            await confirmDelete();

            expect(JSON.parse(probe().getAttribute("data-state"))).toEqual({ entryNotice: "alreadyGone" });
            expect(ENTRY_NOTICES.alreadyGone).toBeTruthy();
        });

        it("서버 오류는 모달 안에 문구를 보이고 머문다(다시 시도 가능)", async () => {
            vi.mocked(deleteEmotionEntry).mockRejectedValue({ status: 500, message: "서버에 오류가 발생했어요.", fieldErrors: [] });
            await render();

            await openConfirm();
            await confirmDelete();

            expect(document.body.querySelector('[role="alertdialog"] [role="alert"]').textContent).toBe("서버에 오류가 발생했어요.");
            expect(probe()).toBeNull();
            expect(button(DELETE_CONFIRM.retryLabel)).toBeDefined();
        });

        it("세션이 만료되면(401) 로그인 화면으로 보낸다", async () => {
            vi.mocked(deleteEmotionEntry).mockRejectedValue({ status: 401, message: "로그인이 필요해요.", fieldErrors: [] });
            await render();

            await openConfirm();
            await confirmDelete();

            expect(text()).toContain("로그인");
        });
    });
});
