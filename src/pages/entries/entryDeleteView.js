// 감정글 삭제의 순수 로직 — 삭제 요청 결과·삭제 뒤 안내·돌아갈 경로를 화면(EntryDetailPage·EntryListPage)과 분리해 테스트 가능하게 둠

export const DELETE_CONFIRM = {
    title: "이 글을 삭제할까요?",
    description: "삭제하면 되돌릴 수 없어요.\n 이번 글에 대한 EUNOIA 결과도 함께 사라져요.",
    confirmLabel: "삭제하기",
    retryLabel: "다시 시도",
    busyLabel: "삭제하는 중…",
};

const FORBIDDEN_FALLBACK = "해당 감정글에 대한 접근 권한이 없어요.";
const ERROR_FALLBACK = "삭제하지 못했어요. 잠시 뒤에 다시 시도해 주세요.";

// 삭제 요청이 실패했을 때 화면이 할 일 — 401(세션 만료)은 이 함수가 아니라 공통 정책(로그인 이동)이 먼저 처리한다
//  alreadyGone: 404 — 이미 지워졌거나 없는 글. 결과적으로 원하던 상태이므로 실패가 아니라 목록으로 보내며 안내
//  forbidden:   403 — 남의 글. 서버가 준 사용자용 문구를 그대로 보여주고 모달을 유지
//  error:       그 외(5xx·네트워크) — 문구를 보여주고 다시 시도하게 함
export const resolveDeleteFailure = ({ status, message }) => {
    if (status === 404) return { name: "alreadyGone" };
    if (status === 403) return { name: "forbidden", message: message || FORBIDDEN_FALLBACK };
    return { name: "error", message: message || ERROR_FALLBACK };
};

// 삭제 뒤 목록에서 한 번 보여줄 안내 — 이동 상태(location.state)의 entryNotice 키로 전달한다
export const ENTRY_NOTICES = {
    deleted: "글을 삭제했어요.",
    alreadyGone: "이미 지워진 글이에요.",
};

// ③ 승인 안내와 같은 3초
export const NOTICE_DURATION_MS = 3000;

// 이동 상태 → 안내 문구. 알려진 키만 인정하고(임의 문자열이 화면에 찍히지 않게), 없거나 모르는 값이면 null
export const noticeFromState = (state) => {
    const key = state?.entryNotice;
    return typeof key === "string" && Object.hasOwn(ENTRY_NOTICES, key) ? ENTRY_NOTICES[key] : null;
};

// 삭제 뒤 돌아갈 목록 경로 — 목록에서 카드를 눌러 왔다면 그 목록(조회 기간 포함)으로.
// 이동 상태는 주소창에서 바꿀 수 없지만 방어적으로 "/entries" 또는 "/entries?…" 모양만 인정하고(상세 경로·다른 경로·외부 주소는 거름) 아니면 전체 목록
export const safeReturnPath = (from) =>
    typeof from === "string" && /^\/entries(\?[^#\s]*)?$/.test(from) ? from : "/entries";
