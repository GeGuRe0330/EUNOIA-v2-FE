import { api, unwrap } from "./defaultApi";

// 감정 분석 API prefix
const ANALYSIS_PREFIX = "/analyses";
const META_PREFIX = "/meta";

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

// 메타 분석 조회
export const getMetaLatestForMe = async () => {
    const res = await api.get(`${META_PREFIX}/me/latest`);
    return res.data.data;
};

// 메타 분석 요청
export const upsertMeta = async () => {
    const res = await api.post(`${META_PREFIX}/me/analysis`);
    return res.data.data;
};
