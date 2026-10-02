import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider, Outlet } from "react-router-dom";
import { NOTICE_DURATION_MS, PROFILE_COPY } from "./profileSettingsView";

// 실제로 렌더해 저장 흐름을 확인한다 — API만 가짜로 대체하고, Layout 로더(me)는 라우터에 붙여 revalidate가 실제로 도는지 본다
vi.mock("../../api/EunoiaApi", () => ({ updateMyProfile: vi.fn(), changeMyPassword: vi.fn() }));

import { updateMyProfile, changeMyPassword } from "../../api/EunoiaApi";
import ProfileSettingsPage from "./ProfileSettingsPage";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

describe("ProfileSettingsPage", () => {
    let container;
    let root;
    let router;
    let me;
    let loader;

    const render = async () => {
        router = createMemoryRouter(
            [
                {
                    id: "layout",
                    path: "/",
                    loader,
                    element: createElement(Outlet),
                    children: [
                        { path: "myPage/profile", element: createElement(ProfileSettingsPage) },
                        { path: "myPage", element: createElement("div", null, "마이페이지") },
                    ],
                },
                { path: "login", element: createElement("div", null, "로그인") },
            ],
            { initialEntries: ["/myPage/profile"] },
        );
        await act(async () => {
            root.render(createElement(RouterProvider, { router }));
        });
        await flush();
    };

    // 입력칸 라벨로 찾기
    const input = (label) => {
        const l = [...container.querySelectorAll("label")].find((el) => el.textContent === label);
        return container.querySelector(`#${CSS.escape(l.htmlFor)}`);
    };
    const type = async (el, value) => {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
        await act(async () => {
            setter.call(el, value);
            el.dispatchEvent(new Event("input", { bubbles: true }));
        });
    };
    const click = async (el) => act(async () => { el.click(); });
    const submit = async (form) => {
        await act(async () => { form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
        await flush();
    };
    const saveButton = (text) => [...container.querySelectorAll("button[type=submit]")].find((b) => b.textContent === text);
    const infoForm = () => container.querySelector("form[novalidate]");
    const passwordForm = () => container.querySelectorAll("form[novalidate]")[1];

    beforeEach(async () => {
        me = { id: 1, email: "frog@eunoia.test", nickname: "개구리", gender: "MALE", age: 28, role: "USER" };
        loader = vi.fn(async () => ({ ...me }));
        vi.mocked(updateMyProfile).mockReset();
        vi.mocked(changeMyPassword).mockReset();
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
        await render();
    });

    afterEach(() => {
        vi.useRealTimers();
        act(() => root.unmount());
        container.remove();
    });

    it("내 정보가 입력칸에 채워지고 이메일은 읽기 전용이다", () => {
        expect(input("닉네임").value).toBe("개구리");
        expect(input("나이").value).toBe("28");
        expect(input("이메일").value).toBe("frog@eunoia.test");
        expect(input("이메일").readOnly).toBe(true);
    });

    it("바뀐 게 없으면 저장 버튼이 막혀 있고, 바꾸면 열린다", async () => {
        const button = saveButton(PROFILE_COPY.infoSave);
        expect(button.disabled).toBe(true);

        await type(input("닉네임"), "두꺼비");
        expect(button.disabled).toBe(false);

        await type(input("닉네임"), "개구리");
        expect(button.disabled).toBe(true);
    });

    it("바뀐 게 없는 채로 제출돼도(버튼을 거치지 않은 제출) 요청하지 않는다", async () => {
        await submit(infoForm());

        expect(updateMyProfile).not.toHaveBeenCalled();
    });

    it("저장하면 다듬은 값으로 요청하고, 내 정보(로더)를 다시 불러오며, 안내가 잠깐 보였다 사라진다", async () => {
        vi.mocked(updateMyProfile).mockImplementation(async (payload) => {
            me = { ...me, ...payload };
            return me;
        });
        await type(input("닉네임"), "  두꺼비 ");
        loader.mockClear();

        await submit(infoForm());

        expect(updateMyProfile).toHaveBeenCalledWith({ nickname: "두꺼비", gender: "MALE", age: 28 });
        expect(loader).toHaveBeenCalledTimes(1); // 내비게이션이 새 닉네임을 받도록 Layout 로더를 다시 부름
        expect(container.querySelector("[role=status]").textContent).toBe(PROFILE_COPY.infoSaved);
        expect(input("닉네임").value).toBe("두꺼비");
        expect(saveButton(PROFILE_COPY.infoSave).disabled).toBe(true); // 새 기준값과 같아졌으니 다시 막힘
    });

    it("저장 안내는 입력하면 곧바로, 아니면 정해진 시간이 지나면 사라진다", async () => {
        vi.mocked(updateMyProfile).mockImplementation(async (payload) => {
            me = { ...me, ...payload };
            return me;
        });
        const status = () => container.querySelector("[role=status]");

        await type(input("닉네임"), "두꺼비");
        await submit(infoForm());
        expect(status().textContent).toBe(PROFILE_COPY.infoSaved);
        await type(input("닉네임"), "두꺼비!");
        expect(status().textContent).toBe("");

        // 시간으로 사라지는 경로 — 가짜 타이머는 저장 직전에 켠다(이미 저장한 값과 달라야 저장이 열린다)
        await type(input("닉네임"), "청개구리");
        vi.useFakeTimers();
        await act(async () => { infoForm().dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
        await act(async () => { await vi.advanceTimersByTimeAsync(0); });
        expect(status().textContent).toBe(PROFILE_COPY.infoSaved);

        await act(async () => { await vi.advanceTimersByTimeAsync(NOTICE_DURATION_MS - 1); });
        expect(status().textContent).toBe(PROFILE_COPY.infoSaved);
        await act(async () => { await vi.advanceTimersByTimeAsync(1); });
        expect(status().textContent).toBe("");
    });

    it("검증에 걸리면 요청하지 않고 그 칸 아래에 오류를 보인다", async () => {
        await type(input("나이"), "-1");

        await submit(infoForm());

        expect(updateMyProfile).not.toHaveBeenCalled();
        expect(input("나이").getAttribute("aria-invalid")).toBe("true");
        expect(container.querySelector(`#${CSS.escape(input("나이").id)}-error`)).not.toBeNull();
    });

    it("서버 오류는 문구를 그대로 보이고 입력은 유지한다(내 정보도 다시 부르지 않음)", async () => {
        vi.mocked(updateMyProfile).mockRejectedValue({ status: 500, message: "서버에 오류가 발생했어요.", fieldErrors: [] });
        await type(input("닉네임"), "두꺼비");
        loader.mockClear();

        await submit(infoForm());

        expect(container.querySelector("[role=alert]").textContent).toBe("서버에 오류가 발생했어요.");
        expect(input("닉네임").value).toBe("두꺼비");
        expect(loader).not.toHaveBeenCalled();
        expect(saveButton(PROFILE_COPY.infoSave).disabled).toBe(false); // 다시 시도할 수 있음
    });

    it("저장 중에 다시 눌러도 요청은 한 번만 나간다", async () => {
        let resolve;
        vi.mocked(updateMyProfile).mockImplementation(() => new Promise((r) => { resolve = r; }));
        await type(input("닉네임"), "두꺼비");

        await act(async () => { infoForm().dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
        await act(async () => { infoForm().dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });

        expect(updateMyProfile).toHaveBeenCalledTimes(1);
        await act(async () => { resolve(me); });
        await flush();
    });

    it("세션이 만료되면(401) 로그인 화면으로 보낸다", async () => {
        vi.mocked(updateMyProfile).mockRejectedValue({ status: 401, message: "로그인이 필요해요.", fieldErrors: [] });
        await type(input("닉네임"), "두꺼비");

        await submit(infoForm());

        expect(router.state.location.pathname).toBe("/login");
    });

    it("비밀번호를 바꾸면 입력칸을 비우고 안내를 보이며 로그인 상태는 그대로다", async () => {
        vi.mocked(changeMyPassword).mockResolvedValue(null);
        await type(input("지금 쓰는 비밀번호"), "oldpw");
        await type(input("새 비밀번호"), "newpw");
        await type(input("새 비밀번호 확인"), "newpw");

        await submit(passwordForm());

        expect(changeMyPassword).toHaveBeenCalledWith({ currentPassword: "oldpw", newPassword: "newpw" });
        expect(input("지금 쓰는 비밀번호").value).toBe("");
        expect(container.querySelectorAll("[role=status]")[1].textContent).toBe(PROFILE_COPY.passwordSaved);
        expect(router.state.location.pathname).toBe("/myPage/profile");
    });

    it("현재 비밀번호가 틀리면(400) 로그인으로 보내지 않고 서버 문구를 보이며 입력을 유지한다", async () => {
        vi.mocked(changeMyPassword).mockRejectedValue({ status: 400, message: "지금 쓰는 비밀번호가 맞지 않아요.", fieldErrors: [] });
        await type(input("지금 쓰는 비밀번호"), "wrong");
        await type(input("새 비밀번호"), "newpw");
        await type(input("새 비밀번호 확인"), "newpw");

        await submit(passwordForm());

        expect(router.state.location.pathname).toBe("/myPage/profile");
        expect(passwordForm().querySelector("[role=alert]").textContent).toBe("지금 쓰는 비밀번호가 맞지 않아요.");
        expect(input("지금 쓰는 비밀번호").value).toBe("wrong");
    });

    it("비밀번호 칸이 모두 비어 있으면 버튼이 막혀 있다", () => {
        expect(saveButton(PROFILE_COPY.passwordSave).disabled).toBe(true);
    });

    it("두 카드는 서로 독립이다 — 한쪽을 고쳐도 다른 쪽 저장 버튼은 영향받지 않는다", async () => {
        await type(input("닉네임"), "두꺼비");

        expect(saveButton(PROFILE_COPY.passwordSave).disabled).toBe(true);
    });
});
