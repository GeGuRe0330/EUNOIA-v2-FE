// 열람 화면(감정글 목록)의 순수 로직 — 화면(EntryListPage)·훅(useEntryList)과 분리해 테스트 가능하게 둠
import { formatEntryDate } from "../../utils/entryView";

export const PAGE_SIZE = 10;

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

// URL 쿼리 `?from=`·`?to=`의 값 하나를 날짜로 — 실제로 존재하는 "YYYY-MM-DD"만 인정하고, 그 외(없음·형식 오류·없는 날짜)는 null
export const parseDateParam = (value) => {
    const match = DATE_PATTERN.exec(String(value ?? ""));
    if (!match) return null;

    const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
    const date = new Date(Date.UTC(year, month - 1, day));
    const exists = date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
    return exists ? value : null;
};

// URL 쿼리 → 조회 기간 { from, to, reversed }. 한쪽만 있어도 됨(null = 제한 없음), 하루는 from === to
// 주소를 직접 고쳐 시작일이 종료일보다 늦으면 적용하지 않고(둘 다 null) reversed로 알려 화면이 안내하게 한다
export const parseDateRange = (from, to) => {
    const parsedFrom = parseDateParam(from);
    const parsedTo = parseDateParam(to);

    if (parsedFrom && parsedTo && parsedFrom > parsedTo) return { from: null, to: null, reversed: true };
    return { from: parsedFrom, to: parsedTo, reversed: false };
};

export const isRangeSet = ({ from, to }) => Boolean(from || to);

// 기간을 말로 — 하루 "2026.10.12", 범위 "2026.10.01 ~ 2026.10.12", 한쪽 "2026.10.01 이후" / "2026.10.12 이전", 없으면 빈 문자열
export const formatRangeLabel = ({ from, to }) => {
    const fromText = formatEntryDate(from);
    const toText = formatEntryDate(to);

    if (fromText && toText) return fromText === toText ? fromText : `${fromText} ~ ${toText}`;
    if (fromText) return `${fromText} 이후`;
    if (toText) return `${toText} 이전`;
    return "";
};

export const RANGE_ORDER_MESSAGE = "시작 날짜는 종료 날짜보다 늦을 수 없어요.";
export const INVALID_DATE_MESSAGE = "날짜 형식이 올바르지 않아요.";

// 입력칸 하나가 바뀐 결과 — { next, error }. value가 빈 문자열이면 그 쪽 제한을 푼다
// 날짜가 틀렸거나 시작일이 종료일보다 늦어지면 적용하지 않고(next는 현재 값 그대로) error 문구를 돌려준다
export const applyRangeChange = (current, field, value) => {
    const cleared = value === "" || value == null;
    const parsed = cleared ? null : parseDateParam(value);

    if (!cleared && parsed === null) return { next: current, error: INVALID_DATE_MESSAGE };

    const next = { ...current, [field]: parsed };
    if (next.from && next.to && next.from > next.to) return { next: current, error: RANGE_ORDER_MESSAGE };

    return { next, error: null };
};

// 조회 기간을 URL 쿼리에 반영 — from·to만 건드리고 다른 쿼리는 그대로, 비어 있는 쪽은 지운다
export const applyRangeToParams = (params, { from, to }) => {
    const next = new URLSearchParams(params);
    if (from) next.set("from", from);
    else next.delete("from");
    if (to) next.set("to", to);
    else next.delete("to");
    return next;
};

// 더 보기로 받은 페이지를 이어 붙임 — 이미 있는 id는 건너뜀(보는 사이 새 글이 써져 페이지 경계가 밀리면 같은 글이 다시 올 수 있음)
export const mergeEntryPages = (previous, next) => {
    const seen = new Set(previous.map((entry) => entry.id));
    return [...previous, ...next.filter((entry) => !seen.has(entry.id))];
};

// 목록 상태 — 첫 조회(status)와 더 보기(moreStatus)를 따로 둬서 더 보기가 실패해도 이미 본 목록은 그대로 남긴다
export const initialEntryListState = {
    status: "loading", // "loading" | "ready" | "error"
    items: [],
    page: 0,
    hasNext: false,
    message: null,
    moreStatus: "idle", // "idle" | "loading" | "error"
    moreMessage: null,
};

export const entryListReducer = (state, action) => {
    switch (action.type) {
        case "LOAD_START":
            return { ...initialEntryListState };

        case "LOAD_SUCCESS":
            return { ...initialEntryListState, status: "ready", items: action.items, hasNext: action.hasNext };

        case "LOAD_ERROR":
            return { ...initialEntryListState, status: "error", message: action.message };

        case "MORE_START":
            if (state.status !== "ready" || !state.hasNext || state.moreStatus === "loading") return state;
            return { ...state, moreStatus: "loading", moreMessage: null };

        case "MORE_SUCCESS":
            if (state.status !== "ready" || state.moreStatus !== "loading") return state;
            return {
                ...state,
                items: mergeEntryPages(state.items, action.items),
                page: state.page + 1,
                hasNext: action.hasNext,
                moreStatus: "idle",
                moreMessage: null,
            };

        case "MORE_ERROR":
            if (state.status !== "ready" || state.moreStatus !== "loading") return state;
            return { ...state, moreStatus: "error", moreMessage: action.message };

        default:
            return state;
    }
};
