import { useEffect } from "react";

// 지켜보는 요소가 화면(에 가까이)에 들어오면 onTrigger를 한 번 부른다 — 무한 스크롤의 "다음 페이지 불러오기" 신호
// - enabled가 true인 동안만 지켜본다(불러오는 중·마지막 페이지·오류 후에는 false로 꺼서 같은 요청을 겹쳐 보내거나 실패를 반복하지 않음)
// - 한 번 신호를 보내면 바로 관찰을 끊는다. 불러온 뒤 enabled/onTrigger가 바뀌면 효과가 다시 돌아 새로 관찰하므로,
//   목록이 아직 화면을 못 채워 요소가 여전히 보이는 경우에도 다음 페이지를 이어서 불러온다
// - IntersectionObserver가 없는 환경에서는 아무것도 하지 않는다(호출한 쪽이 [더 보기] 버튼으로 대신해야 함)
export function useInViewTrigger(ref, { enabled, onTrigger, rootMargin = "300px 0px" }) {
    useEffect(() => {
        const target = ref.current;
        if (!enabled || !target || typeof IntersectionObserver === "undefined") return undefined;

        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries.some((entry) => entry.isIntersecting)) return;
                observer.disconnect();
                onTrigger();
            },
            { rootMargin }
        );
        observer.observe(target);

        return () => observer.disconnect();
    }, [ref, enabled, onTrigger, rootMargin]);
}
