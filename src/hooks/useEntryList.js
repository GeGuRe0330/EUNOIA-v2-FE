import { useCallback, useEffect, useReducer, useRef } from "react";
import { getEmotionEntries } from "../api/EunoiaApi";
import { normalizeEntries } from "../utils/entryView";
import { entryListReducer, buildInitialListState, PAGE_SIZE } from "../pages/entries/entryListView";
import { useApiError } from "./useApiError";

// 열람 화면의 감정글 목록 — 첫 조회와 "더 보기"를 따로 관리한다.
// 조회 기간(from·to)이 바뀌면(필터 변경) 목록을 처음부터 다시 불러온다. 반환: 목록 상태 + { reload, loadMore }
// from·to는 parseDateRange를 거친 "YYYY-MM-DD" 또는 null(제한 없음)
// restored({ items, page, hasNext })가 있으면 첫 조회 없이 그 목록으로 시작한다(상세에서 뒤로 왔을 때 복원) — 이후 기간이 바뀌면 평소처럼 다시 불러옴
export function useEntryList({ from, to }, restored = null) {
    const { handleApiError } = useApiError();
    const [state, dispatch] = useReducer(entryListReducer, restored, buildInitialListState);

    // 복원으로 시작했으면 마운트 직후의 첫 조회만 건너뛴다
    const skipFirstLoadRef = useRef(state.status === "ready");

    // 늦게 도착한 이전 응답(필터를 바꾸기 전 요청, 언마운트 후 응답)이 최신 상태를 덮지 않도록 요청 번호로 거름
    const requestIdRef = useRef(0);

    const load = useCallback(async () => {
        const requestId = ++requestIdRef.current;
        dispatch({ type: "LOAD_START" });

        try {
            const res = await getEmotionEntries({ from: from ?? undefined, to: to ?? undefined, page: 0, size: PAGE_SIZE });
            if (requestId !== requestIdRef.current) return;
            dispatch({ type: "LOAD_SUCCESS", items: normalizeEntries(res?.items), hasNext: res?.hasNext === true });
        } catch (err) {
            if (requestId !== requestIdRef.current) return;

            // 보호 화면 공통 정책(②번) — 401은 세션 만료로 로그인 이동, 이동 중엔 화면이 안 바뀌도록 로딩 유지
            if (err?.status === 401) {
                handleApiError(err);
                return;
            }
            dispatch({ type: "LOAD_ERROR", message: err?.message || "불러오지 못했어요." });
        }
    }, [from, to, handleApiError]);

    useEffect(() => {
        if (skipFirstLoadRef.current) {
            skipFirstLoadRef.current = false;
            return undefined;
        }

        load();
        return () => {
            requestIdRef.current += 1;
        };
    }, [load]);

    const loadMore = useCallback(async () => {
        // 리듀서도 같은 조건을 막지만, 불필요한 요청 자체를 보내지 않도록 여기서도 거른다
        if (state.status !== "ready" || !state.hasNext || state.moreStatus === "loading") return;

        const requestId = ++requestIdRef.current;
        dispatch({ type: "MORE_START" });

        try {
            const res = await getEmotionEntries({
                from: from ?? undefined,
                to: to ?? undefined,
                page: state.page + 1,
                size: PAGE_SIZE,
            });
            if (requestId !== requestIdRef.current) return;
            dispatch({ type: "MORE_SUCCESS", items: normalizeEntries(res?.items), hasNext: res?.hasNext === true });
        } catch (err) {
            if (requestId !== requestIdRef.current) return;

            if (err?.status === 401) {
                handleApiError(err);
                return;
            }
            // 더 보기 실패는 이미 본 목록을 그대로 두고 목록 아래에서만 알림
            dispatch({ type: "MORE_ERROR", message: err?.message || "더 불러오지 못했어요." });
        }
    }, [from, to, handleApiError, state.status, state.hasNext, state.moreStatus, state.page]);

    return { ...state, reload: load, loadMore };
}
