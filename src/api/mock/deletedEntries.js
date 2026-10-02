// [MOCK] 더미 단계에서 "삭제한 글"을 기억하는 저장소 — 백엔드 삭제(소프트 삭제)가 생기기 전까지만 쓰고, 연동 브랜치(⑩)에서 제거한다.
// sessionStorage에 지운 id만 저장한다 — 새로고침해도 유지되고 탭을 닫으면 사라진다(개발 중 되돌리려면 탭을 닫거나 개발자 도구에서 키를 지우면 됨)
// 더미 목록·캘린더·지표·최근 글에서 이 id들을 빼고, 상세로 직접 들어와도 "없는 글"로 처리해 "지웠는데 다시 열면 보임"을 막는다
const KEY = "eunoia:mock:deleted-entry-ids";

// 일기 id(1 이상의 정수)로 해석 — 숫자나 숫자 문자열만. Number(null)·Number("")가 0이 되는 것처럼 엉뚱하게 통과하지 않도록 직접 검사한다
const toEntryId = (value) => {
    if (typeof value === "number") return Number.isInteger(value) && value > 0 ? value : null;
    if (typeof value === "string" && /^[1-9]\d*$/.test(value)) return Number(value);
    return null;
};

export const readDeletedIds = () => {
    try {
        const parsed = JSON.parse(sessionStorage.getItem(KEY) ?? "[]");
        return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "number" && toEntryId(id) === id) : [];
    } catch {
        return [];
    }
};

export const isEntryDeleted = (id) => {
    const entryId = toEntryId(id);
    return entryId !== null && readDeletedIds().includes(entryId);
};

// 1 이상의 정수 id만 기록하고 같은 id는 한 번만 둔다. 저장소를 못 쓰면 조용히 넘어간다(그때는 지운 글이 다시 보일 뿐)
export const markEntryDeleted = (id) => {
    const entryId = toEntryId(id);
    if (entryId === null) return;

    const ids = readDeletedIds();
    if (ids.includes(entryId)) return;

    try {
        sessionStorage.setItem(KEY, JSON.stringify([...ids, entryId]));
    } catch {
        // 저장소를 못 쓰면 더미 삭제가 유지되지 않을 뿐 화면은 정상
    }
};
