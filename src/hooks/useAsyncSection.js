import { useCallback, useEffect, useRef, useState } from "react";
import { useApiError } from "./useApiError";

// 화면의 한 영역이 자기 데이터를 독립적으로 불러오는 훅 — 영역 하나가 실패해도 다른 영역은 영향받지 않음
// (Promise.all로 묶으면 하나만 실패해도 화면 전체가 오류가 됨 — 레거시 MyPage의 문제)
// 반환: { status: "loading" | "ready" | "error", data, message, errorStatus, reload } — errorStatus는 오류일 때 HTTP status(없으면 null)
// fetcher는 모듈 수준의 안정된 함수(예: getMyProfile)를 넘길 것 — 새 함수를 매 렌더 만들면 계속 다시 불러옴
export function useAsyncSection(fetcher) {
    const { handleApiError } = useApiError();
    const [state, setState] = useState({ status: "loading", data: null, message: null, errorStatus: null });
    const requestIdRef = useRef(0);

    const load = useCallback(async () => {
        // 늦게 도착한 이전 응답이나 언마운트 후 응답이 최신 상태를 덮지 않도록 요청 번호로 거름
        const requestId = ++requestIdRef.current;
        setState({ status: "loading", data: null, message: null, errorStatus: null });

        try {
            const data = await fetcher();
            if (requestId !== requestIdRef.current) return;
            setState({ status: "ready", data, message: null, errorStatus: null });
        } catch (err) {
            if (requestId !== requestIdRef.current) return;

            // 보호 화면 공통 정책(②번) — 401은 세션 만료로 로그인 이동, 이동 중엔 화면이 안 바뀌도록 로딩 유지
            if (err?.status === 401) {
                handleApiError(err);
                return;
            }

            setState({
                status: "error",
                data: null,
                message: err?.message || "불러오지 못했어요.",
                errorStatus: err?.status ?? null,
            });
        }
    }, [fetcher, handleApiError]);

    useEffect(() => {
        load();
        return () => {
            requestIdRef.current += 1;
        };
    }, [load]);

    return { ...state, reload: load };
}
