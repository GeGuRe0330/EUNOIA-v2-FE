import { describe, expect, it } from "vitest";
import {
    DELETE_CONFIRM,
    ENTRY_NOTICES,
    NOTICE_DURATION_MS,
    resolveDeleteFailure,
    noticeFromState,
    safeReturnPath,
} from "./entryDeleteView";

describe("resolveDeleteFailure", () => {
    it("404는 실패가 아니라 이미 지워진 글이다(목록으로 보내며 안내)", () => {
        expect(resolveDeleteFailure({ status: 404, message: "존재하지 않는 감정글이에요." })).toEqual({ name: "alreadyGone" });
    });

    it("403은 서버 문구를 그대로 보여준다", () => {
        expect(resolveDeleteFailure({ status: 403, message: "해당 감정글에 대한 접근 권한이 없어요." })).toEqual({
            name: "forbidden",
            message: "해당 감정글에 대한 접근 권한이 없어요.",
        });
    });

    it("403인데 문구가 비어 있으면 기본 문구를 쓴다", () => {
        expect(resolveDeleteFailure({ status: 403, message: "" }).message).toBe("해당 감정글에 대한 접근 권한이 없어요.");
    });

    it.each([[500], [503], [0], [null], [undefined], [400]])("그 외(status %s)는 다시 시도하게 하는 오류다", (status) => {
        const result = resolveDeleteFailure({ status, message: "서버에 오류가 발생했어요." });
        expect(result).toEqual({ name: "error", message: "서버에 오류가 발생했어요." });
    });

    it("오류인데 문구가 비어 있으면 기본 문구를 쓴다", () => {
        expect(resolveDeleteFailure({ status: 500 }).message).toBe("삭제하지 못했어요. 잠시 뒤에 다시 시도해 주세요.");
    });
});

describe("noticeFromState", () => {
    it("알려진 키는 안내 문구가 된다", () => {
        expect(noticeFromState({ entryNotice: "deleted" })).toBe("글을 삭제했어요.");
        expect(noticeFromState({ entryNotice: "alreadyGone" })).toBe("이미 지워진 글이에요.");
    });

    it.each([
        ["없는 상태(null)", null],
        ["undefined", undefined],
        ["키 없음", {}],
        ["모르는 키", { entryNotice: "hacked" }],
        ["문자열이 아님", { entryNotice: 3 }],
        ["객체 프로토타입 키(toString)", { entryNotice: "toString" }],
        ["__proto__", { entryNotice: "__proto__" }],
        ["문자열 상태", "deleted"],
    ])("%s는 안내가 없다", (_, state) => {
        expect(noticeFromState(state)).toBeNull();
    });

    it("안내는 3초 동안 보인다", () => {
        expect(NOTICE_DURATION_MS).toBe(3000);
        expect(Object.keys(ENTRY_NOTICES)).toEqual(["deleted", "alreadyGone"]);
    });
});

describe("safeReturnPath", () => {
    it("전체 목록과 조회 기간이 붙은 목록은 그대로 돌려준다", () => {
        expect(safeReturnPath("/entries")).toBe("/entries");
        expect(safeReturnPath("/entries?from=2026-10-12&to=2026-10-12")).toBe("/entries?from=2026-10-12&to=2026-10-12");
    });

    it.each([
        ["상세 경로", "/entries/5"],
        ["다른 화면", "/myPage"],
        ["비슷한 접두어", "/entriesX"],
        ["외부 주소", "https://evil.example/entries"],
        ["프로토콜 상대 주소", "//evil.example"],
        ["해시가 붙음", "/entries#x"],
        ["공백이 섞임", "/entries?a=1 b"],
        ["빈 문자열", ""],
        ["null", null],
        ["undefined", undefined],
        ["문자열이 아님", 3],
    ])("%s는 전체 목록으로 대체한다", (_, value) => {
        expect(safeReturnPath(value)).toBe("/entries");
    });
});

describe("DELETE_CONFIRM", () => {
    // 문구는 화면을 보며 다듬는 부분이라 정확한 문장이 아니라 "알려야 할 두 가지"만 확인한다
    it("확인 문구에 되돌릴 수 없다는 것과 함께 사라지는 것이 있다는 것을 알린다", () => {
        expect(DELETE_CONFIRM.description).toContain("되돌릴 수 없어요");
        expect(DELETE_CONFIRM.description).toContain("함께 사라져요");
    });

    it("제목과 버튼 문구가 모두 있다", () => {
        expect(DELETE_CONFIRM.title).toBeTruthy();
        expect(DELETE_CONFIRM.confirmLabel).toBeTruthy();
        expect(DELETE_CONFIRM.retryLabel).toBeTruthy();
        expect(DELETE_CONFIRM.busyLabel).toBeTruthy();
    });
});
