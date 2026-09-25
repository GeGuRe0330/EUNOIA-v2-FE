import { api } from "./defultApi";

// 감정 분석 API prefix
const ANALYSIS_PREFIX = "/analyses";
const META_PREFIX = "/meta";

// 최신 감정 분석 1건 조회
export const getLatestAnalysis = async () => {
    const res = await api.get(`${ANALYSIS_PREFIX}/me/latest`);
    return res.data.data;
};

// 감정 점수 흐름 조회
export const getEmotionScores = async () => {
    const res = await api.get(`${ANALYSIS_PREFIX}/me/scores`);
    return res.data.data;
};

// 감정글 저장 
export const postEmotionEntry = async (entryObj) => {
    const res = await api.post(`/emotion-entries`, entryObj);
    return res.data.data;
};

// 감정글 조회
export const getEmotionEntry = async (entryId) => {
    const res = await api.get(`/emotion-entries/${entryId}`);
    return res.data.data;
};

// 따뜻한 말 분석 요청
export const postWarmMessages = async (entryId, dto = {}) => {
    const res = await api.post(`${ANALYSIS_PREFIX}/warm-messages/${entryId}`, dto);
    return res.data.data;
};

// 전체 분석 업데이트
export const updateAnalysis = async (analysisId) => {
    const res = await api.put(`${ANALYSIS_PREFIX}/${analysisId}`, {});
    return res.data.data;
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
