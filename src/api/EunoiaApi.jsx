import { api, unwrap } from "./defaultApi";
import { getMe } from "./authApi";

// 감정 분석 API prefix
const ANALYSIS_PREFIX = "/analyses";
const META_PREFIX = "/meta-analyses";

// 최신 감정 분석 1건 조회 — 분석이 하나도 없으면 null(200 + data: null), FAILED면 status/reason만 채워짐
export const getLatestAnalysis = async () => {
    const res = await api.get(`${ANALYSIS_PREFIX}/latest`);
    return unwrap(res);
};

// 감정 점수 흐름 조회 — 최근 7건, SUCCESS만, entryDate 오름차순: [{ entryId, entryDate, emotionScore }]
export const getEmotionScores = async () => {
    const res = await api.get(`${ANALYSIS_PREFIX}/scores`);
    return unwrap(res);
};

// 일기별 분석 결과 조회(폴링용) — 처리 중이면 404("아직 분석 결과가 없어요."), 완료되면 200(status SUCCESS | FAILED)
// 삭제된 글의 분석도 404 — 상세 화면은 일기 단건 조회의 404("없는 글")를 먼저 처리하므로 그 화면에서는 보이지 않는다
export const getAnalysisByEntry = async (entryId) => {
    const res = await api.get(`${ANALYSIS_PREFIX}/by-entry/${entryId}`);
    return unwrap(res);
};

// 감정글 저장 — 저장되면 서버가 이벤트로 분석을 자동 시작함 (entryDate는 생략하면 서버가 오늘로 채움)
export const postEmotionEntry = async (entryObj) => {
    const res = await api.post(`/emotion-entries`, entryObj);
    return unwrap(res);
};

// 감정글 단건 조회 — { id, memberId, content, entryDate }. 없는 글·삭제된 글이면 404("존재하지 않는 감정글이에요."), 남의 글이면 403("해당 감정글에 대한 접근 권한이 없어요.")
export const getEmotionEntry = async (entryId) => {
    const res = await api.get(`/emotion-entries/${entryId}`);
    return unwrap(res);
};

// 메타 분석 최신 조회 — PREPARING이면 content: null, READY면 content 채워짐
export const getMetaLatest = async () => {
    const res = await api.get(`${META_PREFIX}/latest`);
    return unwrap(res);
};

// 메타 분석 생성 — 선택된 일기 집합이 직전 결과와 같으면 서버가 GPT 호출 없이 기존 결과를 그대로 돌려줌(updatedAt 동일)
export const generateMeta = async () => {
    const res = await api.post(`${META_PREFIX}`);
    return unwrap(res);
};

// 메타 분석 이력 조회 — 과거 결과를 최신순(periodEnd desc)으로, 배열(없으면 빈 배열)
export const getMetaHistory = async () => {
    const res = await api.get(`${META_PREFIX}`);
    return unwrap(res);
};

// ===== 마이페이지·열람·프로필 (백엔드 ⑮~⑱) =====
// 실제 반영 결과와 요청서(api-spec.md)가 다르면 backend-handoff-personalization.md가 맞다

// 내 프로필 — { id, email, nickname, age, gender, role, createdAt, profileImageId }
// createdAt은 소수 초가 붙을 수 있고(날짜 부분만 쓴다), profileImageId는 UUID 또는 null(기본 이미지)
export const getMyProfile = async () => getMe();

// 기록 지표 — { totalEntryCount, monthEntryCount }. 삭제된 글 제외, "이번 달"은 서버(KST) 기준
export const getMyRecordSummary = async () => {
    const res = await api.get(`/emotion-entries/summary`);
    return unwrap(res);
};

// 월별 감정 캘린더 — 글이 있는 날만: { yearMonth: "YYYY-MM", days: [{ date, entryCount, averageScore | null }] }
// averageScore는 그날 SUCCESS 분석 emotionScore(0~100)의 평균, 분석이 없거나 FAILED뿐이면 null
export const getEmotionCalendar = async (yearMonth) => {
    const res = await api.get(`/emotion-entries/calendar`, { params: { yearMonth } });
    return unwrap(res);
};

// 감정글 목록(열람 화면) — 최신순(entryDate 내림차순, 같은 날은 id 내림차순), 조회 기간 필터 · 페이지 나누기
// 요청: { from?, to?: "YYYY-MM-DD"(둘 다 그 날 포함, 한쪽만 줘도 됨), page?: 0부터, size?: 1~50, 기본 10 }
// 응답: { items: [{ id, entryDate, content(전문), emotionDetected | null }], page, size, hasNext } — 글이 없으면 items가 빈 배열(404 아님)
// emotionDetected는 SUCCESS 분석의 대표 감정, 분석이 없거나(방금 쓴 글은 수 초간) FAILED면 null
// 비어 있는 from·to는 보내지 않는다 — 빈 문자열이 가면 서버가 날짜 형식 오류(400)로 처리한다
export const getEmotionEntries = async ({ from, to, page = 0, size = 10 } = {}) => {
    const params = { page, size };
    if (from) params.from = from;
    if (to) params.to = to;

    const res = await api.get(`/emotion-entries`, { params });
    return unwrap(res);
};

// 최근 감정글 — 최신순 [{ id, entryDate, content, emotionDetected | null }], 없으면 빈 배열
// 서버에 /recent 엔드포인트는 없다 — 목록의 첫 페이지(size=limit, 1~50)의 items가 같은 항목 모양이다
export const getRecentEntries = async (limit = 5) => {
    const { items } = await getEmotionEntries({ page: 0, size: limit });
    return items;
};

// 감정글 삭제(소프트 삭제 — 모든 조회에서 사라지고 분석도 비동기로 함께 삭제됨). 응답: 바디 없는 성공(null)
// 없는 글·이미 삭제된 글은 404("존재하지 않는 감정글이에요."), 남의 글은 403("해당 감정글에 대한 접근 권한이 없어요.")
export const deleteEmotionEntry = async (entryId) => {
    const res = await api.delete(`/emotion-entries/${entryId}`);
    return unwrap(res);
};

// 프로필 수정 — 닉네임·성별·나이 세 필드를 모두 보내는 전체 교체(부분 수정 아님). 응답: 갱신된 회원 정보
// 닉네임 앞뒤 공백은 서버가 지우지 않으므로 호출하는 쪽이 trim해서 보낸다
export const updateMyProfile = async ({ nickname, gender, age }) => {
    const res = await api.patch(`/members/me`, { nickname, gender, age });
    return unwrap(res);
};

// 비밀번호 변경 — 현재 비밀번호가 틀리면 401이 아니라 400("지금 쓰는 비밀번호가 맞지 않아요.")이라 로그인 화면으로 보내지 않는다. 성공해도 세션은 유지된다
// 비밀번호 확인 칸은 프론트에서만 검사하고 서버로 보내지 않는다
export const changeMyPassword = async ({ currentPassword, newPassword }) => {
    const res = await api.put(`/members/me/password`, { currentPassword, newPassword });
    return unwrap(res);
};

// 프로필 이미지 업로드 — 편집이 끝난 512×512 JPEG를 멀티파트(파트 이름 "file")로 보낸다. 응답: 갱신된 회원 정보(새 profileImageId)
// Content-Type 헤더는 직접 지정하지 않는다 — multipart의 boundary는 브라우저가 FormData로 만들어야 하고, 직접 지정하면 서버가 파트를 못 읽어 400이 된다
// 서버는 JPEG·PNG만 받고(WebP 거절) 항상 512×512 JPEG로 다시 만든다. 형식·내용 오류는 400("올릴 수 없는 사진이에요."), 10MB 초과는 413
export const uploadProfileImage = async (blob) => {
    const form = new FormData();
    form.append("file", blob, "profile.jpg");

    const res = await api.put(`/members/me/profile-image`, form);
    return unwrap(res);
};

// 기본 이미지로 되돌리기 — 이미 없어도 200(멱등). 응답: 갱신된 회원 정보(profileImageId: null)
export const deleteProfileImage = async () => {
    const res = await api.delete(`/members/me/profile-image`);
    return unwrap(res);
};
