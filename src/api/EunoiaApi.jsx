import { api, unwrap } from "./defaultApi";

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
    const res = await api.get(`${ANALYSIS_PREFIX}/by-entry/${entryId}`);
    return unwrap(res);
};

// 감정글 저장 — 저장되면 서버가 이벤트로 분석을 자동 시작함 (entryDate는 생략하면 서버가 오늘로 채움)
export const postEmotionEntry = async (entryObj) => {
    const res = await api.post(`/emotion-entries`, entryObj);
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
