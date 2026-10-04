import { useEffect, useRef, useState } from "react";

// 저장 결과 같은 안내 문구를 잠깐 보였다가 지운다 — show(문구)로 띄우고 정해진 시간 뒤 사라지며, hide()로 곧바로 지울 수도 있다
export const useNotice = (durationMs) => {
    const [notice, setNotice] = useState(null);
    const timerRef = useRef(null);

    useEffect(() => () => clearTimeout(timerRef.current), []);

    const show = (message) => {
        clearTimeout(timerRef.current);
        setNotice(message);
        timerRef.current = setTimeout(() => setNotice(null), durationMs);
    };
    const hide = () => {
        clearTimeout(timerRef.current);
        setNotice(null);
    };
    return { notice, show, hide };
};
