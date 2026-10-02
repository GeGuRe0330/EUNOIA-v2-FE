import { api, unwrap } from "./defaultApi";
import { getMe } from "./authApi";
import {
    MOCK_JOINED_AT,
    readMockScenario,
    buildSummary,
    buildCalendarMonth,
    currentYearMonth,
} from "./mock/myPageFixtures";
import { buildMockEntryDetail, buildMockAnalysis } from "./mock/entryDetailFixtures";
import {
    isMockEntryId,
    buildAllEntries,
    pageEntries,
    withoutDeleted,
    applyDeletionsToCalendar,
    applyDeletionsToSummary,
} from "./mock/entryListFixtures";
import { readDeletedIds, isEntryDeleted, markEntryDeleted } from "./mock/deletedEntries";
import { applyProfileOverride, writeProfileOverride } from "./mock/profileOverride";

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

// 일기별 분석 결과 조회(폴링용) — 처리 중이면 404, 완료되면 200(status SUCCESS | FAILED)
export const getAnalysisByEntry = async (entryId) => {
    // [MOCK] 더미 글(id 900001~)은 분석도 더미로 — 성공·실패(FAILED)·처리 중(404)을 섞어 돌려준다. 연동(⑩) 때 이 블록을 지운다
    if (isMockEntryId(entryId)) {
        const entry = buildAllEntries().find((candidate) => candidate.id === entryId);
        await mockDelay();
        const analysis = entry && !isEntryDeleted(entryId) ? buildMockAnalysis(entry) : null;
        if (analysis === null) throw { status: 404, message: "아직 분석 결과가 없어요.", fieldErrors: [] };
        return analysis;
    }

    const res = await api.get(`${ANALYSIS_PREFIX}/by-entry/${entryId}`);
    return unwrap(res);
};

// 감정글 저장 — 저장되면 서버가 이벤트로 분석을 자동 시작함 (entryDate는 생략하면 서버가 오늘로 채움)
export const postEmotionEntry = async (entryObj) => {
    const res = await api.post(`/emotion-entries`, entryObj);
    return unwrap(res);
};

// 감정글 단건 조회 — { id, memberId, content, entryDate }. 없는 글이면 404("존재하지 않는 감정글이에요."), 남의 글이면 403("해당 감정글에 대한 접근 권한이 없어요.")
export const getEmotionEntry = async (entryId) => {
    // [MOCK] 더미 단계에서 지운 글은 서버가 아직 모르므로 여기서 "없는 글"(404)로 처리하고, 더미 글(id 900001~)은 서버가 아니라 더미로 연다
    // 실제 id는 그대로 서버로 간다 — 연동(⑩) 때 이 [MOCK] 블록을 지운다
    if (isEntryDeleted(entryId)) throw { status: 404, message: "존재하지 않는 감정글이에요.", fieldErrors: [] };
    if (isMockEntryId(entryId)) {
        const entry = buildAllEntries().find((candidate) => candidate.id === entryId);
        await mockDelay();
        if (!entry) throw { status: 404, message: "존재하지 않는 감정글이에요.", fieldErrors: [] };
        return buildMockEntryDetail(entry);
    }

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

// ===== [MOCK] 마이페이지·열람 — 백엔드 구현 전 더미 =====
// 실제 응답과 같은 모양을 돌려주고, 화면 코드는 이 함수들만 호출한다.
// 연동(⑩ common/records-integration) 때는 각 함수 안만 api.get(...) + unwrap으로 바꾸고 이 구간과 mock/ 폴더를 지운다.
// 응답 모양 초안: 작업 문서 06.identity_my-page.md

const MOCK_LATENCY_MS = 250;

const mockDelay = () => new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

// 시나리오가 해당 섹션 실패를 가리키면 normalizeApiError와 같은 모양으로 던진다
const failIfScenario = (section) => {
    if (readMockScenario() === `fail:${section}`) {
        throw { status: 500, message: "서버에 오류가 발생했어요.", fieldErrors: [] };
    }
};

const isEmptyScenario = () => readMockScenario() === "empty";

// 내 프로필 — 실제로는 GET /members/me에 createdAt이 추가돼 이 호출 하나로 끝난다(백엔드 요청 전).
// 지금은 실제 /members/me(닉네임·성별)에 더미 createdAt만 덧붙인다
export const getMyProfile = async () => {
    const me = applyProfileOverride(await getMe());
    return { ...me, createdAt: MOCK_JOINED_AT };
};

// ===== [MOCK] 프로필 설정(⑨) — 저장이 서버에 반영되지 않는다 =====
// 실제로는 PATCH /members/me (닉네임·성별·나이, 응답은 갱신된 MemberResponse),
// PUT /members/me/password ({ currentPassword, newPassword }, 현재 비밀번호가 틀리면 401이 아니라 400/409 + 해요체 문구).
// 시나리오: ?mock=fail:profile | fail:password(서버 오류) | wrong-password(현재 비밀번호 불일치)
export const updateMyProfile = async ({ nickname, gender, age }) => {
    await mockDelay();
    failIfScenario("profile");
    writeProfileOverride({ nickname, gender, age });
    return applyProfileOverride(await getMe());
};

export const changeMyPassword = async () => {
    await mockDelay();
    failIfScenario("password");
    if (readMockScenario() === "wrong-password") {
        throw { status: 400, message: "지금 쓰는 비밀번호가 맞지 않아요.", fieldErrors: [] };
    }
    return null;
};

// 기록 지표 — { totalEntryCount, monthEntryCount }. "이번 달"은 서버 시각 기준(앱 시간대, backend-requests.md 6번)
export const getMyRecordSummary = async () => {
    await mockDelay();
    failIfScenario("summary");
    if (isEmptyScenario()) return { totalEntryCount: 0, monthEntryCount: 0 };
    return applyDeletionsToSummary(buildSummary(), deletedEntries(), currentYearMonth());
};

// 월별 감정 캘린더 — 글이 있는 날만: { yearMonth: "YYYY-MM", days: [{ date, entryCount, averageScore | null }] }
// averageScore는 그날 SUCCESS 분석 emotionScore(0~100)의 평균, 분석이 없거나 FAILED뿐이면 null
export const getEmotionCalendar = async (yearMonth) => {
    await mockDelay();
    failIfScenario("calendar");
    if (isEmptyScenario()) return { yearMonth, days: [] };
    return applyDeletionsToCalendar(buildCalendarMonth(yearMonth), deletedEntries());
};

// 최근 감정글 — 최신순 [{ id, entryDate, content, emotionDetected | null }], 없으면 빈 배열
// 열람 목록 더미의 앞부분을 그대로 쓴다(api-spec: /recent는 목록의 size=5와 같은 항목 모양) — 목록·캘린더와 항상 같은 글이고, 지운 글도 함께 빠진다
export const getRecentEntries = async (limit = 5) => {
    await mockDelay();
    failIfScenario("recent");
    if (isEmptyScenario()) return [];
    return pageEntries(visibleEntries(), { page: 0, size: limit }).items;
};

// 감정글 목록(열람 화면) — 최신순, 조회 기간 필터 · 페이지 나누기
// 요청: { from?: "YYYY-MM-DD", to?: "YYYY-MM-DD"(둘 다 그 날 포함, 한쪽만 줘도 됨, 하루는 from=to), page?: 0부터, size?: 기본 10 } / 응답: { items: [{ id, entryDate, content, emotionDetected | null }], page, size, hasNext }
// 글이 없으면 items가 빈 배열(404 아님). emotionDetected는 SUCCESS 분석의 대표 감정, 분석이 없거나 FAILED면 null
export const getEmotionEntries = async ({ from, to, page = 0, size = 10 } = {}) => {
    await mockDelay();
    failIfScenario("list");
    if (page > 0) failIfScenario("more");
    if (isEmptyScenario()) return { items: [], page, size, hasNext: false };
    return pageEntries(visibleEntries(), { from, to, page, size });
};

// 감정글 삭제 — 백엔드는 소프트 삭제(삭제 표시만 하고 모든 조회에서 제외)로 구현될 예정. 응답: 바디 없는 성공(null)
// 없는 글·이미 삭제된 글은 404("존재하지 않는 감정글이에요."), 남의 글은 403(해당 감정글에 대한 접근 권한이 없어요.) — 단건 조회와 같은 규칙
// 지금은 지운 id만 기억해 더미 목록·캘린더·지표·최근 글·상세에서 뺀다(실제 서버의 글은 지워지지 않음)
export const deleteEmotionEntry = async (entryId) => {
    await mockDelay();
    failIfScenario("delete");
    if (isEntryDeleted(entryId)) throw { status: 404, message: "존재하지 않는 감정글이에요.", fieldErrors: [] };

    markEntryDeleted(entryId);
    return null;
};

// 지운 글을 뺀 더미 목록 / 지운 글만 모은 목록(캘린더·지표 보정용)
const visibleEntries = () => withoutDeleted(buildAllEntries(), readDeletedIds());

const deletedEntries = () => {
    const deleted = new Set(readDeletedIds());
    return buildAllEntries().filter((entry) => deleted.has(entry.id));
};
