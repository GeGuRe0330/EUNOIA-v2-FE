import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider, Outlet, useRouteLoaderData } from "react-router-dom";

// 사진 변경·되돌리기 흐름을 실제로 렌더해 확인한다 — API와 캔버스만 가짜, Layout 로더는 라우터에 붙여 revalidate가 실제로 도는지 본다
vi.mock("../../api/EunoiaApi", () => ({ uploadProfileImage: vi.fn(), deleteProfileImage: vi.fn() }));
vi.mock("./profileImageCanvas", () => ({ renderCroppedBlob: vi.fn() }));

import { uploadProfileImage, deleteProfileImage } from "../../api/EunoiaApi";
import { renderCroppedBlob } from "./profileImageCanvas";
import ProfileImageSection from "./ProfileImageSection";
import { IMAGE_FILE_ERRORS, MAX_IMAGE_BYTES } from "./profileImageFile";
import { NOTICE_DURATION_MS, PROFILE_COPY } from "./profileSettingsView";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

describe("ProfileImageSection", () => {
    let container;
    let root;
    let router;
    let loader;
    let me; // Layout 로더가 돌려주는 내 정보 — 되돌리기 성공 때 서버처럼 profileImageId를 null로 바꿔 아바타 영역이 실제로 새 상태로 그려지게 한다

    // 로더의 내 정보(profileImageId)를 그대로 아바타 영역에 넘긴다 — 저장 뒤 revalidate하면 실제 화면처럼 값이 바뀐다
    const Connected = () => {
        const data = useRouteLoaderData("layout");
        return createElement(ProfileImageSection, { gender: "NONE", profileImageId: data.profileImageId });
    };

    const render = async (props = {}) => {
        me = { profileImageId: props.profileImageId ?? null };
        router = createMemoryRouter(
            [
                {
                    id: "layout",
                    path: "/",
                    loader,
                    element: createElement(Outlet),
                    children: [
                        {
                            path: "myPage/profile",
                            element: createElement(Connected),
                        },
                    ],
                },
                { path: "login", element: createElement("div", null, "로그인") },
            ],
            { initialEntries: ["/myPage/profile"] }
        );
        await act(async () => {
            root.render(createElement(RouterProvider, { router }));
        });
        await flush();
    };

    const q = (selector, scope = document.body) => scope.querySelector(selector);
    const button = (text) => [...document.body.querySelectorAll("button")].find((b) => b.textContent === text);
    const input = () => q('[data-testid="profile-image-input"]');
    const dialog = () => q('[role="dialog"]');
    const confirm = () => q('[role="alertdialog"]');

    const choose = async (file) => {
        Object.defineProperty(input(), "files", { configurable: true, value: file ? [file] : [] });
        await act(async () => {
            input().dispatchEvent(new Event("change", { bubbles: true }));
        });
    };
    const photo = (overrides = {}) => new File(["x"], "photo.jpg", { type: "image/jpeg", ...overrides });
    const bigFile = () => {
        const f = photo();
        Object.defineProperty(f, "size", { value: MAX_IMAGE_BYTES + 1 });
        return f;
    };
    const loadImageInDialog = () =>
        act(() => {
            const img = q("img", dialog());
            Object.defineProperty(img, "naturalWidth", { configurable: true, value: 2000 });
            Object.defineProperty(img, "naturalHeight", { configurable: true, value: 1500 });
            img.dispatchEvent(new Event("load"));
        });
    const status = () => q('[role="status"]');

    beforeEach(async () => {
        loader = vi.fn(async () => ({ ...me }));
        vi.mocked(uploadProfileImage).mockReset();
        vi.mocked(deleteProfileImage).mockReset();
        vi.mocked(renderCroppedBlob).mockReset();
        URL.createObjectURL = vi.fn(() => "blob:test");
        URL.revokeObjectURL = vi.fn();
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        vi.useRealTimers();
        act(() => root.unmount());
        container.remove();
        document.body.style.overflow = "";
    });

    describe("사진 고르기", () => {
        beforeEach(async () => render());

        it("[사진 변경]은 숨겨 둔 파일 선택칸을 연다", () => {
            const click = vi.spyOn(input(), "click");
            act(() => button(PROFILE_COPY.imageChange).click());
            expect(click).toHaveBeenCalledTimes(1);
        });

        it("파일 선택창은 허용 형식만 보인다", () => {
            expect(input().getAttribute("accept")).toBe("image/jpeg,image/png,image/webp");
        });

        it("허용되지 않는 형식이면 편집 모달을 열지 않고 이유를 알려 준다", async () => {
            await choose(photo({ type: "image/gif", name: "a.gif" }));
            expect(dialog()).toBeNull();
            expect(q('[role="alert"]').textContent).toBe(IMAGE_FILE_ERRORS.type);
        });

        it("10MB를 넘으면 편집 모달을 열지 않고 이유를 알려 준다", async () => {
            await choose(bigFile());
            expect(dialog()).toBeNull();
            expect(q('[role="alert"]').textContent).toBe(IMAGE_FILE_ERRORS.size);
        });

        it("올바른 사진이면 편집 모달이 열리고 이전의 파일 오류는 사라진다", async () => {
            await choose(photo({ type: "image/gif", name: "a.gif" }));
            await choose(photo());
            expect(dialog()).not.toBeNull();
            expect(q('[role="alert"]', container)).toBeNull();
        });

        it("선택을 취소해 파일이 없으면 아무 일도 없다", async () => {
            await choose(null);
            expect(dialog()).toBeNull();
            expect(q('[role="alert"]')).toBeNull();
        });

        it("같은 파일을 다시 골라도 변경 이벤트가 나오도록 선택칸을 비운다", async () => {
            const el = input();
            let cleared;
            Object.defineProperty(el, "value", {
                configurable: true,
                get: () => "",
                set: (v) => { cleared = v; },
            });
            await choose(photo());
            expect(cleared).toBe("");
        });
    });

    describe("편집 후 업로드", () => {
        const blob = new Blob(["jpeg"], { type: "image/jpeg" });

        beforeEach(async () => {
            vi.mocked(renderCroppedBlob).mockResolvedValue(blob);
            await render({ profileImageId: null });
            await choose(photo());
            loadImageInDialog();
        });

        const apply = async () => {
            await act(async () => { button(PROFILE_COPY.cropApply).click(); });
            await flush();
        };

        it("[취소]하면 아무것도 올리지 않고 닫는다", () => {
            act(() => button(PROFILE_COPY.cropCancel).click());
            expect(dialog()).toBeNull();
            expect(uploadProfileImage).not.toHaveBeenCalled();
        });

        it("[적용하기]하면 만든 파일을 올리고, 내 정보(로더)를 다시 불러오며, 모달을 닫고 안내를 보인다", async () => {
            vi.mocked(uploadProfileImage).mockResolvedValue({});
            loader.mockClear();

            await apply();

            expect(uploadProfileImage).toHaveBeenCalledWith(blob);
            expect(loader).toHaveBeenCalledTimes(1); // 내비게이션 아바타가 새 이미지를 받도록 Layout 로더를 다시 부름
            expect(dialog()).toBeNull();
            expect(status().textContent).toBe(PROFILE_COPY.imageSaved);
        });

        it("편집을 마치면(취소·업로드 성공) 포커스가 [사진 변경] 버튼으로 돌아온다", async () => {
            // beforeEach에서 이미 모달이 열려 있으므로 닫고, 버튼에 포커스를 둔 채 다시 연다
            act(() => button(PROFILE_COPY.cropCancel).click());
            button(PROFILE_COPY.imageChange).focus();
            await choose(photo());
            loadImageInDialog();
            expect(document.activeElement).not.toBe(button(PROFILE_COPY.imageChange)); // 모달 안으로 옮겨 감

            act(() => button(PROFILE_COPY.cropCancel).click());
            expect(document.activeElement).toBe(button(PROFILE_COPY.imageChange));

            await choose(photo());
            loadImageInDialog();
            vi.mocked(uploadProfileImage).mockResolvedValue({});
            await apply();
            expect(document.activeElement).toBe(button(PROFILE_COPY.imageChange));
        });

        it("안내는 정해진 시간 뒤 사라진다", async () => {
            vi.mocked(uploadProfileImage).mockResolvedValue({});
            await apply();
            expect(status().textContent).toBe(PROFILE_COPY.imageSaved);

            // 같은 타이머를 다시 쓰지 않고 새로 시작해 가짜 타이머로 경계를 본다
            vi.useFakeTimers();
            await choose(photo());
            loadImageInDialog();
            await act(async () => { button(PROFILE_COPY.cropApply).click(); });
            await act(async () => { await vi.advanceTimersByTimeAsync(0); });
            expect(status().textContent).toBe(PROFILE_COPY.imageSaved);

            await act(async () => { await vi.advanceTimersByTimeAsync(NOTICE_DURATION_MS - 1); });
            expect(status().textContent).toBe(PROFILE_COPY.imageSaved);
            await act(async () => { await vi.advanceTimersByTimeAsync(1); });
            expect(status().textContent).toBe("");
        });

        it("올리는 중에는 모달이 닫히지 않고 중복 요청이 나가지 않는다", async () => {
            let resolve;
            vi.mocked(uploadProfileImage).mockImplementation(() => new Promise((r) => { resolve = r; }));

            await act(async () => { button(PROFILE_COPY.cropApply).click(); });
            await flush();
            expect(button(PROFILE_COPY.cropApplying).disabled).toBe(true);
            expect(button(PROFILE_COPY.cropCancel).disabled).toBe(true);

            await act(async () => { button(PROFILE_COPY.cropApplying).click(); });
            expect(uploadProfileImage).toHaveBeenCalledTimes(1);

            await act(async () => { resolve({}); });
            await flush();
            expect(dialog()).toBeNull();
        });

        it("올리기에 실패하면 서버 문구를 모달 안에 보이고, 모달을 유지하며 다시 시도할 수 있다(로더는 다시 부르지 않음)", async () => {
            vi.mocked(uploadProfileImage).mockRejectedValueOnce({ status: 500, message: "서버에 오류가 발생했어요.", fieldErrors: [] });
            loader.mockClear();

            await apply();

            expect(dialog()).not.toBeNull();
            expect(q('[role="alert"]', dialog()).textContent).toBe("서버에 오류가 발생했어요.");
            expect(loader).not.toHaveBeenCalled();
            expect(button(PROFILE_COPY.cropApply).disabled).toBe(false);

            vi.mocked(uploadProfileImage).mockResolvedValue({});
            await apply();
            expect(uploadProfileImage).toHaveBeenCalledTimes(2);
            expect(dialog()).toBeNull();
        });

        it("세션이 만료되면(401) 로그인 화면으로 보낸다", async () => {
            vi.mocked(uploadProfileImage).mockRejectedValue({ status: 401, message: "로그인이 필요해요.", fieldErrors: [] });
            await apply();
            expect(router.state.location.pathname).toBe("/login");
        });

        it("실패 뒤 취소하고 다시 열면 이전 오류가 남아 있지 않다", async () => {
            vi.mocked(uploadProfileImage).mockRejectedValueOnce({ status: 500, message: "서버에 오류가 발생했어요.", fieldErrors: [] });
            await apply();
            act(() => button(PROFILE_COPY.cropCancel).click());

            await choose(photo());
            loadImageInDialog();
            expect(q('[role="alert"]', dialog())).toBeNull();
        });
    });

    describe("기본 이미지로 되돌리기", () => {
        it("업로드한 이미지가 없으면 [기본 이미지로 되돌리기]가 없다", async () => {
            await render({ profileImageId: null });
            expect(button(PROFILE_COPY.imageReset)).toBeUndefined();
        });

        describe("업로드한 이미지가 있을 때", () => {
            beforeEach(async () => render({ profileImageId: "abc" }));

            const open = () => act(() => button(PROFILE_COPY.imageReset).click());
            const doReset = async () => {
                await act(async () => { button(PROFILE_COPY.resetConfirm).click(); });
                await flush();
            };

            it("누르면 확인 모달이 열리고, 취소하면 아무것도 지우지 않는다", () => {
                open();
                expect(confirm()).not.toBeNull();
                act(() => button("취소").click());
                expect(confirm()).toBeNull();
                expect(deleteProfileImage).not.toHaveBeenCalled();
            });

            it("확인하면 지우고, 내 정보(로더)를 다시 불러오며, 모달을 닫고 안내를 보인다", async () => {
                vi.mocked(deleteProfileImage).mockResolvedValue({});
                loader.mockClear();
                open();

                await doReset();

                expect(deleteProfileImage).toHaveBeenCalledTimes(1);
                expect(loader).toHaveBeenCalledTimes(1);
                expect(confirm()).toBeNull();
                expect(status().textContent).toBe(PROFILE_COPY.imageResetDone);
            });

            it("성공하면 되돌리기 버튼이 사라지므로 포커스가 [사진 변경]으로 간다(문서 맨 위로 떨어지지 않게)", async () => {
                vi.mocked(deleteProfileImage).mockImplementation(async () => {
                    me.profileImageId = null; // 서버가 이미지를 지움 → revalidate하면 아바타 영역에서 되돌리기 버튼이 사라진다
                    return {};
                });
                button(PROFILE_COPY.imageReset).focus();
                open();

                await doReset();

                expect(confirm()).toBeNull();
                expect(button(PROFILE_COPY.imageReset)).toBeUndefined(); // 포커스를 돌려줄 버튼이 실제로 사라졌다
                expect(document.activeElement).toBe(button(PROFILE_COPY.imageChange));
            });

            it("실패하면 서버 문구를 모달 안에 보이고 다시 시도할 수 있다", async () => {
                vi.mocked(deleteProfileImage).mockRejectedValueOnce({ status: 500, message: "서버에 오류가 발생했어요.", fieldErrors: [] });
                open();

                await doReset();

                expect(confirm()).not.toBeNull();
                expect(q('[role="alert"]', confirm()).textContent).toBe("서버에 오류가 발생했어요.");

                vi.mocked(deleteProfileImage).mockResolvedValue({});
                await act(async () => { button("다시 시도").click(); });
                await flush();
                expect(deleteProfileImage).toHaveBeenCalledTimes(2);
                expect(confirm()).toBeNull();
            });

            it("세션이 만료되면(401) 로그인 화면으로 보낸다", async () => {
                vi.mocked(deleteProfileImage).mockRejectedValue({ status: 401, message: "로그인이 필요해요.", fieldErrors: [] });
                open();
                await doReset();
                expect(router.state.location.pathname).toBe("/login");
            });
        });
    });
});
