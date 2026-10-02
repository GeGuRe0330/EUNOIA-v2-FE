// 감정글 상세 화면의 순수 로직 — API 응답을 화면에서 쓸 상태로 바꿈(화면 EntryDetailPage와 분리해 테스트 가능하게 둠)
import { formatEntryDate } from "../../utils/entryView";

export const NOT_FOUND_MESSAGE = "존재하지 않는 감정글이에요.";
export const FAILED_DEFAULT_REASON = "감정 분석에 실패했어요.";

// 주소의 :id를 일기 id로 — 1 이상의 정수 문자열만 인정(앞자리 0·소수·글자 섞임·너무 큰 수는 null)
export const parseEntryId = (param) => {
    const text = String(param ?? "");
    if (!/^[1-9]\d*$/.test(text)) return null;

    const id = Number(text);
    return Number.isSafeInteger(id) ? id : null;
};

// 일기 조회 오류를 화면이 구분할 종류로 — 없는 글(404)·남의 글(403)은 서버가 사용자용 문구를 주므로 그대로 보여주고, 그 외는 다시 시도하게 한다
export const classifyEntryError = ({ status, message }) => {
    const text = message || "불러오지 못했어요.";
    if (status === 404) return { kind: "notFound", message: text };
    if (status === 403) return { kind: "forbidden", message: text };
    return { kind: "error", message: text };
};

// GET /emotion-entries/{id} 응답 → 원문 카드. 본문이 문자열이 아니면 계약 위반이라 그릴 수 없음(invalid)
export const resolveEntryView = (entry) => {
    if (entry == null || typeof entry.content !== "string") return { name: "invalid" };
    return { name: "ready", entry: { dateText: formatEntryDate(entry.entryDate), content: entry.content } };
};

const textOrNull = (value) => {
    const text = typeof value === "string" ? value.trim() : "";
    return text || null;
};

// "불안, 기대, 막막함" 같은 쉼표 구분 문자열을 칩으로 쓸 배열로 — 앞뒤 공백·빈 조각·중복은 정리
export const splitKeywords = (keywords) => {
    if (typeof keywords !== "string") return [];
    return [...new Set(keywords.split(/[,，]/).map((word) => word.trim()).filter(Boolean))];
};

// 분석 조회 결과 → 분석 영역에 그릴 상태 (한 일기당 분석은 0개 또는 1개)
//  입력: { kind: "processing" }(404 = 아직 처리 중) | { kind: "ready", analysis }(200)
//  processing: 아직 분석 중 — 안내와 [다시 확인]
//  failed:     서버가 확정한 실패(종료 상태, 재시도 없음). FAILED 응답은 reason 외 필드가 전부 null이라 카드를 그리면 안 됨
//  ready:      SUCCESS — 카드에 쓸 값으로 정리(비어 있는 값은 null이라 그 카드를 그리지 않음)
//  invalid:    알려지지 않은 status 등 계약 위반 — 불완전한 데이터를 카드에 넘기지 않음(④번과 같은 fail-closed)
export const resolveAnalysisView = (result) => {
    if (result?.kind === "processing") return { name: "processing" };

    const analysis = result?.analysis;
    if (result?.kind !== "ready" || analysis == null) return { name: "invalid" };

    if (analysis.status === "FAILED") {
        return { name: "failed", reason: textOrNull(analysis.reason) ?? FAILED_DEFAULT_REASON };
    }
    if (analysis.status !== "SUCCESS") return { name: "invalid" };

    return {
        name: "ready",
        analysis: {
            emotion: textOrNull(analysis.emotionDetected),
            keywords: splitKeywords(analysis.keywords),
            emotionSummary: textOrNull(analysis.emotionSummary),
            flowHint: textOrNull(analysis.flowHint),
            warmMessages: Array.isArray(analysis.warmMessages)
                ? analysis.warmMessages.map(textOrNull).filter(Boolean)
                : [],
            insightSummary: textOrNull(analysis.insightSummary),
        },
    };
};

// 분석 영역을 접어 둔 상태에서 머리글 옆에 보일 한 줄 안내 — 펼치지 않아도 지금 분석이 어떤 상태인지 알 수 있게 한다
// status는 분석 조회(useAsyncSection)의 상태("loading" | "error" | "ready"), view는 ready일 때 resolveAnalysisView의 결과
export const describeAnalysisHint = (status, view) => {
    if (status === "loading") return "불러오는 중…";
    if (status === "error") return "불러오지 못했어요";

    switch (view?.name) {
        case "processing":
            return "아직 분석 중이에요";
        case "failed":
            return "분석에 실패했어요";
        case "ready":
            return "클릭해서 펼치기";
        default:
            return "해석하지 못했어요";
    }
};

export const KEYWORD_PREVIEW_COUNT = 2;

// 접힌 분석 머리글에 미리 보여줄 키워드 — 앞에서 max개만(나머지는 펼치면 전부 나오므로 개수 표시는 하지 않는다). 키워드가 없으면 빈 배열
// 키워드는 백엔드(프롬프트)가 중요한 것부터 3~5개로 주므로 앞쪽이 대표성이 크다
export const previewKeywords = (keywords, max = KEYWORD_PREVIEW_COUNT) =>
    Array.isArray(keywords) ? keywords.slice(0, max) : [];
