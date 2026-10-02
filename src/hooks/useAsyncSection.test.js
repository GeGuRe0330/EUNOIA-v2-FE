import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { useAsyncSection } from "./useAsyncSection";

// 훅을 실제로 렌더해서 검증한다 — 영역별 독립 로딩의 핵심(오류 status 전달, 늦은 응답 무시, 401 처리)
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let latest;

const Probe = ({ fetcher }) => {
    latest = useAsyncSection(fetcher);
    return null;
};

const LoginMarker = () => {
    const { state } = useLocation();
    return createElement("div", { "data-testid": "login" }, state?.message ?? "");
};

const flush = () => act(async () => {});

describe("useAsyncSection", () => {
    let container;
    let root;

    const render = (fetcher) =>
        act(async () => {
            root.render(
                createElement(
                    MemoryRouter,
                    { initialEntries: ["/page"] },
                    createElement(
                        Routes,
                        null,
                        createElement(Route, { path: "/page", element: createElement(Probe, { fetcher }) }),
                        createElement(Route, { path: "/login", element: createElement(LoginMarker) })
                    )
                )
            );
        });

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
    });

    it("처음엔 loading, 성공하면 ready와 데이터다", async () => {
        const fetcher = vi.fn().mockResolvedValue({ n: 1 });
        await render(fetcher);
        await flush();

        expect(latest).toMatchObject({ status: "ready", data: { n: 1 }, message: null, errorStatus: null });
    });

    it("실패하면 error와 서버 문구, HTTP status를 알려준다(404·403 같은 의미 있는 오류를 화면이 구분하도록)", async () => {
        const fetcher = vi.fn().mockRejectedValue({ status: 404, message: "존재하지 않는 감정글이에요.", fieldErrors: [] });
        await render(fetcher);
        await flush();

        expect(latest).toMatchObject({
            status: "error",
            data: null,
            message: "존재하지 않는 감정글이에요.",
            errorStatus: 404,
        });
    });

    it("status가 없는 오류(네트워크 등)는 errorStatus가 null이고 기본 문구를 쓴다", async () => {
        await render(vi.fn().mockRejectedValue(new Error("")));
        await flush();

        expect(latest).toMatchObject({ status: "error", message: "불러오지 못했어요.", errorStatus: null });
    });

    it("401은 오류 화면이 아니라 로그인 화면으로 보낸다(이동하는 동안 로딩 유지)", async () => {
        await render(vi.fn().mockRejectedValue({ status: 401, message: "로그인이 필요해요." }));
        await flush();

        expect(container.querySelector('[data-testid="login"]')).not.toBeNull();
        expect(container.querySelector('[data-testid="login"]').textContent).toBe("세션이 만료됐어요. 다시 로그인해 주세요.");
    });

    it("reload하면 다시 불러온다", async () => {
        const fetcher = vi.fn().mockRejectedValueOnce({ status: 500, message: "서버에 오류가 발생했어요." }).mockResolvedValueOnce("ok");
        await render(fetcher);
        await flush();
        expect(latest.status).toBe("error");

        await act(async () => {
            latest.reload();
        });
        await flush();

        expect(fetcher).toHaveBeenCalledTimes(2);
        expect(latest).toMatchObject({ status: "ready", data: "ok", errorStatus: null });
    });

    it("늦게 도착한 이전 응답은 최신 상태를 덮지 않는다", async () => {
        let resolveFirst;
        const first = new Promise((resolve) => {
            resolveFirst = resolve;
        });
        const fetcher = vi.fn().mockReturnValueOnce(first).mockResolvedValueOnce("새 응답");

        await render(fetcher);
        await act(async () => {
            latest.reload(); // 첫 요청이 끝나기 전에 다시 불러옴
        });
        await flush();
        expect(latest).toMatchObject({ status: "ready", data: "새 응답" });

        await act(async () => {
            resolveFirst("옛 응답"); // 늦게 도착
        });
        await flush();

        expect(latest.data).toBe("새 응답");
    });
});
