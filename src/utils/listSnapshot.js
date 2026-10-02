// 목록 화면의 "돌아왔을 때 복원"용 스냅샷 — 열람 목록에서 상세로 갔다가 뒤로 오면 불러 둔 글과 스크롤 위치를 그대로 되살린다
// sessionStorage에 저장하므로 같은 탭에서만, 탭을 닫으면 사라진다. 저장소를 못 쓰는 환경(차단·가득 참)에서는 조용히 복원 없이 동작한다
// 키는 화면의 경로+쿼리(예: "/entries?from=2026-10-01&to=2026-10-12") — 조회 기간이 다르면 다른 스냅샷

const PREFIX = "eunoia:list-snapshot:";

// 너무 오래된 스냅샷은 버린다 — 그 사이 새 글이 써졌을 수 있어서(복원은 서버를 다시 부르지 않으므로)
export const SNAPSHOT_TTL_MS = 30 * 60 * 1000;

const isValid = (snapshot) =>
    snapshot != null &&
    Array.isArray(snapshot.items) &&
    snapshot.items.length > 0 &&
    Number.isInteger(snapshot.page) &&
    snapshot.page >= 0 &&
    typeof snapshot.hasNext === "boolean" &&
    Number.isFinite(snapshot.scrollY) &&
    snapshot.scrollY >= 0 &&
    Number.isFinite(snapshot.savedAt);

export const saveListSnapshot = (key, { items, page, hasNext, scrollY }, now = Date.now()) => {
    try {
        sessionStorage.setItem(PREFIX + key, JSON.stringify({ items, page, hasNext, scrollY, savedAt: now }));
    } catch {
        // 저장소를 못 쓰면 복원만 못 할 뿐 화면은 정상
    }
};

// 유효하고 오래되지 않은 스냅샷만 돌려준다(없거나 깨졌거나 만료됐으면 null — 깨진 것은 지운다)
export const loadListSnapshot = (key, now = Date.now()) => {
    try {
        const raw = sessionStorage.getItem(PREFIX + key);
        if (raw == null) return null;

        const snapshot = JSON.parse(raw);
        if (!isValid(snapshot) || now - snapshot.savedAt > SNAPSHOT_TTL_MS || now < snapshot.savedAt) {
            sessionStorage.removeItem(PREFIX + key);
            return null;
        }
        return snapshot;
    } catch {
        return null;
    }
};

export const hasListSnapshot = (key, now = Date.now()) => loadListSnapshot(key, now) !== null;

// 화면을 옮길 때 맨 위로 보내지 말아야 하는지 — 뒤로/앞으로 가기(POP)로 돌아왔고 그 화면의 복원 스냅샷이 있으면 true.
// 복원은 그 화면이 스스로 스크롤을 되돌리므로, 여기서 맨 위로 보내면 복원을 덮어쓴다(ScrollToTop의 skip 판정에 넘김)
export const shouldKeepScroll = ({ pathname, search, navigationType }, now = Date.now()) =>
    navigationType === "POP" && hasListSnapshot(pathname + search, now);
