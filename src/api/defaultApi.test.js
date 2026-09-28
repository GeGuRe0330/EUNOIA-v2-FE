import axios from "axios";
import { beforeEach, describe, expect, it } from "vitest";
import { api, unwrap } from "./defaultApi";

const TOKEN_REQUEST = "GET /api/v1/members/me";
let calls;

const clearXsrfCookie = () => {
    document.cookie = "XSRF-TOKEN=; Path=/; Max-Age=0";
};

// 가짜 어댑터: 발급 GET(/members/me, 인터셉터 밖 기본 axios 호출)은 쿠키를 심고 401, 나머지는 200 봉투
const fakeAdapter = async (config) => {
    calls.push(`${config.method.toUpperCase()} ${config.url}`);
    await new Promise((resolve) => setTimeout(resolve, 5));
    if (`${config.method.toUpperCase()} ${config.url}` === TOKEN_REQUEST) {
        document.cookie = "XSRF-TOKEN=test-token; Path=/";
        return { status: 401, statusText: "", data: "", headers: {}, config };
    }
    return { status: 200, statusText: "", data: { success: true, data: { ok: true }, error: null }, headers: {}, config };
};

beforeEach(() => {
    calls = [];
    clearXsrfCookie();
    axios.defaults.adapter = fakeAdapter; // 발급 GET이 쓰는 기본 axios
    api.defaults.adapter = fakeAdapter;
});

describe("unwrap", () => {
    it("v2 봉투에서 data만 꺼낸다", () => {
        expect(unwrap({ data: { success: true, data: { id: 1 }, error: null } })).toEqual({ id: 1 });
    });

    it("data: null도 정상값으로 그대로 돌려준다", () => {
        expect(unwrap({ data: { success: true, data: null, error: null } })).toBeNull();
    });
});

describe("CSRF 토큰 확보 인터셉터", () => {
    it("쿠키가 없으면 상태변경 요청 전에 발급 GET을 먼저 보낸다", async () => {
        await api.post("/members/signup", {});

        expect(calls).toEqual([TOKEN_REQUEST, "POST /members/signup"]);
    });

    it("쿠키가 있으면 발급 GET 없이 바로 보낸다", async () => {
        document.cookie = "XSRF-TOKEN=existing; Path=/";

        await api.post("/members/signup", {});

        expect(calls).toEqual(["POST /members/signup"]);
    });

    it("쿠키가 없는 상태에서 동시 요청이 와도 발급 GET은 한 번만 보낸다", async () => {
        await Promise.all([api.post("/a"), api.patch("/b"), api.delete("/c")]);

        expect(calls.filter((c) => c === TOKEN_REQUEST)).toHaveLength(1);
        expect(calls[0]).toBe(TOKEN_REQUEST);
        expect(calls.slice(1).sort()).toEqual(["DELETE /c", "PATCH /b", "POST /a"]);
    });

    it("안전한 메서드(GET)에는 발급 GET을 붙이지 않는다", async () => {
        await api.get("/members/me");

        expect(calls).toEqual(["GET /members/me"]);
    });

    it("한 번 발급받은 뒤의 상태변경 요청은 발급 GET 없이 보낸다", async () => {
        await api.post("/first");
        await api.post("/second");

        expect(calls).toEqual([TOKEN_REQUEST, "POST /first", "POST /second"]);
    });

    it("발급 GET이 실패해도(네트워크) 원래 요청은 그대로 진행한다", async () => {
        axios.defaults.adapter = async (config) => {
            calls.push(`${config.method.toUpperCase()} ${config.url}`);
            throw new Error("Network Error");
        };

        await api.post("/members/signup", {});

        expect(calls).toEqual([TOKEN_REQUEST, "POST /members/signup"]);
    });
});
