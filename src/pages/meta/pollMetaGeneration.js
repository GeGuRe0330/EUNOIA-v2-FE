// 메타분석 생성 폴링 — POST(202) 뒤, 또는 진입 시 PROCESSING이면 GET /latest를 생성이 끝날 때까지 조회한다(백엔드 ㉒).
// 서버는 3분 넘은 시도를 FAILED로 확정하지만, 프론트 최대 대기는 사용자 경험상 포기 시점이다 — 넘겨도 실패가 아니고 서버는 계속 처리한다.
import { pollUntil } from "../../utils/pollUntil";
import { isGenerating } from "./metaView";

// GPT 호출 최악 약 1분 — 그보다 넉넉히 기다린 뒤 "시간이 걸리고 있어요" 안내로 넘어간다
export const META_POLL_TIMEOUT_MS = 120_000;

/**
 * @returns {Promise<{ kind: "done", value: object } | { kind: "timeout" } | { kind: "cancelled" }>}
 *  done의 value는 generationStatus가 PROCESSING이 아닌(FAILED이거나 null) latest. 조회 오류는 그대로 throw.
 */
export const pollMetaGeneration = ({ fetchLatest, timeoutMs = META_POLL_TIMEOUT_MS, ...options }) =>
    pollUntil({ fetcher: fetchLatest, isDone: (latest) => !isGenerating(latest), timeoutMs, ...options });
