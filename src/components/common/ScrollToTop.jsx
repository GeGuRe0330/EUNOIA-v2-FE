import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// 화면(경로)이 바뀌면 맨 위로 — 이전 화면의 스크롤 위치가 새 화면에 그대로 넘어와 내용이 바뀔 때 튀어 보이는 것을 막는다
// (예: 마이페이지 맨 아래의 [전체 보기]를 눌러 열람 화면으로 갈 때)
// 경로만 본다 — 같은 화면 안에서 쿼리만 바뀌는 경우(열람 화면의 날짜 지정)에는 스크롤을 건드리지 않는다
// 뒤로 가기 때 이전 위치 복원은 하지 않는다(목록이 비동기로 채워져 복원 시점엔 아직 짧으므로, 상세(⑧)에서 불러온 페이지 수 복원과 함께 설계)
const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // "instant"로 CSS의 smooth 스크롤 설정과 무관하게 즉시 이동
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }, [pathname]);

    return null;
};

export default ScrollToTop;
