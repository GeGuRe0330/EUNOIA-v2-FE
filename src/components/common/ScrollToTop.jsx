import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// 화면(경로)이 바뀌면 맨 위로 — 이전 화면의 스크롤 위치가 새 화면에 그대로 넘어와 내용이 바뀔 때 튀어 보이는 것을 막는다
// (예: 마이페이지 맨 아래의 [전체 보기]를 눌러 열람 화면으로 갈 때)
// 경로만 본다 — 같은 화면 안에서 쿼리만 바뀌는 경우(열람 화면의 날짜 지정)에는 스크롤을 건드리지 않는다
// shouldSkip({ pathname, search, navigationType })이 true를 주면 맨 위로 보내지 않는다 — 스스로 스크롤 위치를 복원하는 화면
// (열람 목록: 상세에서 뒤로 왔을 때)의 복원을 덮어쓰지 않기 위함. 그 외 화면은 뒤로 가기에도 맨 위로 간다
const ScrollToTop = ({ shouldSkip }) => {
    const { pathname, search } = useLocation();
    const navigationType = useNavigationType();

    useEffect(() => {
        if (shouldSkip?.({ pathname, search, navigationType })) return;

        // "instant"로 CSS의 smooth 스크롤 설정과 무관하게 즉시 이동
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        // search·navigationType·shouldSkip을 의존성에 넣으면 쿼리만 바뀌어도 맨 위로 가므로 경로가 바뀔 때만 실행한다 —
        // 효과 함수는 경로가 바뀐 그 렌더에서 만들어져 그 시점의 search·navigationType을 정확히 본다
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    return null;
};

export default ScrollToTop;
