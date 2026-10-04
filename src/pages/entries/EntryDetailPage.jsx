import { useCallback, useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import Collapsible from "../../components/common/Collapsible";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import CardMotion from "../../components/motion/CardMotion";
import EunoiaPageLinkButton from "../../components/common/EunoiaPageLinkButton";
import SectionError from "../../components/common/SectionError";
import EmotionSummaryCard from "../../components/Maindashboard/dashboard/EmotionSummaryCard";
import EmotionFlowCard from "../../components/Maindashboard/dashboard/EmotionFlowCard";
import WarmMessageCard from "../../components/Maindashboard/dashboard/WarmMessageCard";
import InsightCard from "../../components/Maindashboard/dashboard/InsightCard";
import { useAsyncSection } from "../../hooks/useAsyncSection";
import { useApiError } from "../../hooks/useApiError";
import { clearListSnapshots } from "../../utils/listSnapshot";
import { getEmotionEntry, getAnalysisByEntry, deleteEmotionEntry } from "../../api/EunoiaApi";
import { DELETE_CONFIRM, resolveDeleteFailure, safeReturnPath } from "./entryDeleteView";
import {
    NOT_FOUND_MESSAGE,
    parseEntryId,
    classifyEntryError,
    resolveEntryView,
    resolveAnalysisView,
    describeAnalysisHint,
    previewKeywords,
} from "./entryDetailView";

const CARD_CLASS =
    "bg-surface/80 backdrop-blur-sm rounded-2xl shadow-md p-6 border border-primary-dark/20";

// 카드 안의 내부 카드 — 분석 카드들(대시보드 카드)과 같은 모양
const INNER_CARD_CLASS = "bg-surface shadow-md rounded-xl p-4";

// [삭제] — [이전으로]와 같은 줄 오른쪽. 위험한 동작이라 평소엔 조용한 테두리형이고 호버·포커스에서 붉은 계열로 바뀐다
const DELETE_BUTTON_CLASS =
    "inline-flex items-center gap-1.5 rounded-lg border-2 border-primary-dark/40 bg-white/60 px-4 py-1.5 text-sm font-semibold text-textPrimary shadow-sm " +
    "transition-all duration-150 hover:-translate-y-0.5 hover:border-red-400 hover:bg-white/90 hover:text-red-600 hover:shadow-md " +
    "active:translate-y-0 active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400";

const BACK_BUTTON_CLASS =
    "inline-flex items-center gap-1 rounded-lg border-2 border-primary-dark/40 bg-white/60 px-4 py-1.5 text-sm font-semibold text-textPrimary shadow-sm " +
    "transition-all duration-150 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-md hover:border-primary-dark/80 " +
    "active:translate-y-0 active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark/60";

// 감정글 상세 — 원문이 주인공이고, 그 아래에 이 글 하나에 대한 분석(0개 또는 1개)을 곁들인다.
// 일기와 분석은 따로 동시에 불러와서, 분석이 느리거나 실패해도 원문은 먼저·그대로 보인다.
// 분석은 성공 / 실패(서버 문구, 재시도 없음) / 처리 중(404, [다시 확인]) / 조회 오류 / 계약 위반을 구분해 그린다.
const EntryDetailPage = () => {
    const { id: idParam } = useParams();
    const id = parseEntryId(idParam);

    const navigate = useNavigate();
    const location = useLocation();
    const { handleApiError } = useApiError();

    const fetchEntry = useCallback(async () => {
        // 숫자가 아닌 주소는 서버에 묻지 않고 "없는 글"로 — 서버가 줄 문구와 같게
        if (id === null) throw { status: 404, message: NOT_FOUND_MESSAGE, fieldErrors: [] };
        return getEmotionEntry(id);
    }, [id]);

    // 404는 오류가 아니라 "아직 분석 중"이라는 정상 상태(백엔드 계약: 행 없음 = 처리 중). 그 외 오류는 그대로 던진다
    const fetchAnalysis = useCallback(async () => {
        if (id === null) return null;
        try {
            return { kind: "ready", analysis: await getAnalysisByEntry(id) };
        } catch (err) {
            if (err?.status === 404) return { kind: "processing" };
            throw err;
        }
    }, [id]);

    const entry = useAsyncSection(fetchEntry);
    const analysis = useAsyncSection(fetchAnalysis);

    // 삭제 확인 모달 상태 — 요청 중(deleting)에는 모달이 닫히지 않고, 실패하면 문구(deleteError)를 모달 안에 보여준다
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);

    // 분석은 기본으로 접어 둔다 — 원문이 주인공이고 분석은 읽고 싶을 때 펼쳐 보는 정보
    const [analysisOpen, setAnalysisOpen] = useState(false);

    const entryView = entry.status === "ready" ? resolveEntryView(entry.data) : null;
    const analysisView = analysis.status === "ready" ? resolveAnalysisView(analysis.data) : null;
    const emotion = analysisView?.name === "ready" ? analysisView.analysis.emotion : null;
    const analysisHint = describeAnalysisHint(analysis.status, analysisView);
    // 접힌 머리글에 미리 보여줄 대표 키워드(분석이 성공이고 키워드가 있을 때만)
    const keywordPreview = analysisView?.name === "ready" ? previewKeywords(analysisView.analysis.keywords) : [];

    // 목록에서 눌러 들어왔으면 이전 화면(필터 포함)으로, 주소를 직접 열었다면(history의 첫 항목) 전체 목록으로
    const goBack = () => (location.key !== "default" ? navigate(-1) : navigate("/entries"));

    const openDeleteConfirm = () => {
        setDeleteError(null);
        setConfirmOpen(true);
    };

    const closeDeleteConfirm = () => {
        if (deleting) return;
        setConfirmOpen(false);
        setDeleteError(null);
    };

    // 삭제 뒤 목록으로 — 카드를 눌러 왔다면 그 목록(조회 기간 포함)으로, 아니면 전체 목록으로.
    // replace라 지워진 상세가 히스토리에 남지 않고, 저장해 둔 목록 복원 스냅샷은 지운 글이 남아 있으므로 모두 비운다
    const leaveAfterDelete = (notice) => {
        clearListSnapshots();
        navigate(safeReturnPath(location.state?.from), { replace: true, state: { entryNotice: notice } });
    };

    const handleDelete = async () => {
        if (deleting) return;
        setDeleting(true);
        setDeleteError(null);

        try {
            await deleteEmotionEntry(id);
            leaveAfterDelete("deleted");
        } catch (err) {
            // 세션 만료는 공통 정책(②번)으로 로그인 화면에 보낸다 — 이동하는 동안 모달은 그대로 둔다
            if (err?.status === 401) {
                handleApiError(err);
                return;
            }

            setDeleting(false);
            const failure = resolveDeleteFailure({ status: err?.status, message: err?.message });

            // 이미 지워진 글(404)은 실패가 아니라 목록으로 보내며 안내, 그 외는 모달 안에 문구를 보이고 다시 시도하게 함
            if (failure.name === "alreadyGone") {
                leaveAfterDelete("alreadyGone");
                return;
            }
            setDeleteError(failure.message);
        }
    };

    const errorKind = entry.status === "error" ? classifyEntryError({ status: entry.errorStatus, message: entry.message }) : null;

    return (
        <div className="min-h-screen font-sans px-4 py-8">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between gap-3">
                    <button type="button" onClick={goBack} className={BACK_BUTTON_CLASS}>
                        <span aria-hidden="true">←</span>
                        이전으로
                    </button>

                    {/* 원문을 불러왔을 때만 — 없는 글·남의 글·오류 화면에서는 지울 대상이 없다 */}
                    {entryView?.name === "ready" && (
                        <button type="button" onClick={openDeleteConfirm} className={DELETE_BUTTON_CLASS}>
                            <Trash2 aria-hidden="true" className="h-4 w-4" />
                            삭제
                        </button>
                    )}
                </div>

                {/* 원문 */}
                <CardMotion index={0}>
                    <section aria-label="감정글 원문" className={CARD_CLASS}>
                        {entry.status === "loading" && (
                            <div className="space-y-3 animate-pulse" aria-busy="true">
                                <div className="h-6 w-40 rounded bg-primary-light/40" />
                                <div className="h-4 w-full rounded bg-primary-light/30" />
                                <div className="h-4 w-full rounded bg-primary-light/30" />
                                <div className="h-4 w-2/3 rounded bg-primary-light/30" />
                            </div>
                        )}

                        {/* 없는 글·남의 글은 서버 문구를 그대로 보여주고 목록으로 돌려보냄, 그 외는 다시 불러오기 */}
                        {errorKind && errorKind.kind !== "error" && (
                            <div className="py-6 text-center">
                                <p role="alert" className="text-sm font-medium text-textPrimary mb-5">
                                    {errorKind.message}
                                </p>
                                <EunoiaPageLinkButton to="/entries" message="지난 감정글로" />
                            </div>
                        )}
                        {errorKind && errorKind.kind === "error" && (
                            <SectionError message={errorKind.message} onRetry={entry.reload} />
                        )}

                        {entryView?.name === "invalid" && (
                            <SectionError message="글을 불러오지 못했어요." onRetry={entry.reload} />
                        )}

                        {entryView?.name === "ready" && (
                            <>
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                                    <h1 className="text-xl font-semibold text-textPrimary">
                                        {entryView.entry.dateText ? `${entryView.entry.dateText}의 기록` : "감정글"}
                                    </h1>
                                    {emotion && (
                                        <span className="text-sm px-3 py-1 rounded-full bg-primary-light/50 border border-primary-dark/20 text-textPrimary">
                                            {emotion}
                                        </span>
                                    )}
                                </div>

                                {/* 분석 카드들과 같은 내부 카드 — 쓴 그대로: 줄바꿈과 들여쓰기를 지키고, 긴 단어는 줄바꿈 */}
                                    <p className="mt-1 whitespace-pre-wrap break-words rounded-2xl bg-white/45 p-4 text-base leading-relaxed text-textPrimary shadow-sm border border-primary-dark/25">
                                        {entryView.entry.content}
                                    </p>
                            </>
                        )}
                    </section>
                </CardMotion>

                {/* 분석 — 분석 전체를 한 카드로 감싸고 기본은 접어 둔다(머리글을 누르면 안쪽 카드들이 펼쳐짐).
                    원문을 불러온 뒤에만 보여줌(없는 글·남의 글이면 분석 영역도 의미 없음) */}
                {entryView?.name === "ready" && (
                    <CardMotion index={1}>
                        <section aria-labelledby="analysis-title" className={CARD_CLASS}>
                            <button
                                type="button"
                                onClick={() => setAnalysisOpen((open) => !open)}
                                aria-expanded={analysisOpen}
                                aria-controls="analysis-panel"
                                className="-mx-2 flex w-[calc(100%+1rem)] flex-col gap-2 rounded-lg px-2 py-1 text-left transition-colors hover:bg-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark/60 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                            >
                                <span id="analysis-title" className="text-lg font-semibold text-textPrimary">
                                    이번 글에 대한 EUNOIA
                                </span>

                                {/* 접어 둔 채로도 지금 분석이 어떤 상태인지(또는 대표 키워드가 무엇인지) 보이게 한 줄 미리보기.
                                    좁은 화면에선 제목 아래 줄에 놓이고, 펼치면 안쪽에 전부 나오므로 사라진다 */}
                                <span className="flex min-w-0 items-center justify-between gap-2 text-sm text-textSecondary sm:justify-end">
                                    {!analysisOpen && keywordPreview.length > 0 && (
                                        <span className="flex min-w-0 items-center gap-1.5">
                                            {keywordPreview.map((word) => (
                                                <span
                                                    key={word}
                                                    className="max-w-[8rem] truncate rounded-full border border-primary-dark/20 bg-white/60 px-2.5 py-0.5 text-xs text-textSecondary"
                                                >
                                                    {word}
                                                </span>
                                            ))}
                                        </span>
                                    )}

                                    {/* 분석이 성공이면 "클릭해서 펼치기"가 숨 쉬듯 은은하게 반짝여 눌러 보라고 안내한다
                                        (움직임을 줄이는 설정에서는 반짝이지 않고 그대로 보임). 그 외 상태(처리 중·실패 등)는 정지된 안내 문구 */}
                                    {!analysisOpen && (
                                        <span
                                            className={
                                                analysisView?.name === "ready"
                                                    ? "shrink-0 font-medium text-primary-dark motion-safe:animate-soft-pulse"
                                                    : "shrink-0"
                                            }
                                        >
                                            {analysisHint}
                                        </span>
                                    )}
                                    <ChevronDown
                                        aria-hidden="true"
                                        className={`ml-auto h-5 w-5 shrink-0 text-primary-dark transition-transform duration-200 ${
                                            analysisOpen ? "rotate-180" : ""
                                        }`}
                                    />
                                </span>
                            </button>

                            {/* 부드럽게 펼쳐지고 접힌다. 닫혀 있는 동안은 그리지 않는다(InsightCard가 마운트 때 폭을 재서 블라인드를 만들고,
                                숨은 채로 키보드 포커스를 받는 일도 막기 위해) */}
                            <Collapsible open={analysisOpen} id="analysis-panel" labelledBy="analysis-title">
                                <div className="mt-4 space-y-4">
                                    {analysis.status === "loading" && (
                                        <div className={`${INNER_CARD_CLASS} animate-pulse`} aria-busy="true">
                                            <div className="h-5 w-48 rounded bg-primary-light/40 mb-3" />
                                            <div className="h-4 w-full rounded bg-primary-light/30 mb-2" />
                                            <div className="h-4 w-3/4 rounded bg-primary-light/30" />
                                        </div>
                                    )}

                                    {analysis.status === "error" && (
                                        <div className={INNER_CARD_CLASS}>
                                            <SectionError message={analysis.message} onRetry={analysis.reload} />
                                        </div>
                                    )}

                                    {analysisView?.name === "invalid" && (
                                        <div className={INNER_CARD_CLASS}>
                                            <SectionError message="EUNOIA의 결과를 불러오지 못했어요." onRetry={analysis.reload} />
                                        </div>
                                    )}

                                    {analysisView?.name === "processing" && (
                                        <div className={`${INNER_CARD_CLASS} text-center`}>
                                            <p className="text-sm font-medium text-textPrimary mb-1">아직 EUNOIA가 읽는 중이에요.</p>
                                            <p className="text-sm text-textSecondary leading-relaxed mb-5">
                                                잠시 뒤에 다시 확인해 보세요.
                                            </p>
                                            <EunoiaPageLinkButton onClick={analysis.reload} message="다시 확인" />
                                        </div>
                                    )}

                                    {/* 서버가 확정한 실패 — 같은 글은 다시 분석되지 않으므로 재시도 버튼이 없다 */}
                                    {analysisView?.name === "failed" && (
                                        <div className={INNER_CARD_CLASS}>
                                            <p role="status" className="text-sm text-textSecondary">
                                                {analysisView.reason}
                                            </p>
                                        </div>
                                    )}

                                    {analysisView?.name === "ready" && (
                                        <>
                                            {analysisView.analysis.keywords.length > 0 && (
                                                <ul aria-label="키워드" className="flex flex-wrap gap-2">
                                                    {analysisView.analysis.keywords.map((word) => (
                                                        <li
                                                            key={word}
                                                            className="text-sm px-3 py-1 rounded-full bg-white/60 border border-primary-dark/20 text-textSecondary"
                                                        >
                                                            {word}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}

                                            {analysisView.analysis.emotionSummary && (
                                                <EmotionSummaryCard
                                                    title="이 글의 감정 요약"
                                                    summary={analysisView.analysis.emotionSummary}
                                                />
                                            )}

                                            {analysisView.analysis.flowHint && (
                                                <EmotionFlowCard flowHint={analysisView.analysis.flowHint} />
                                            )}

                                            {analysisView.analysis.warmMessages.length > 0 && (
                                                <WarmMessageCard
                                                    title="이 글을 비춰보는 말"
                                                    messages={analysisView.analysis.warmMessages}
                                                />
                                            )}

                                            {analysisView.analysis.insightSummary && (
                                                <InsightCard insight={analysisView.analysis.insightSummary} />
                                            )}
                                        </>
                                    )}
                                </div>
                            </Collapsible>
                        </section>
                    </CardMotion>
                )}
            </div>

            <ConfirmDialog
                open={confirmOpen}
                title={DELETE_CONFIRM.title}
                description={DELETE_CONFIRM.description}
                confirmLabel={deleteError ? DELETE_CONFIRM.retryLabel : DELETE_CONFIRM.confirmLabel}
                busyLabel={DELETE_CONFIRM.busyLabel}
                busy={deleting}
                errorMessage={deleteError}
                danger
                onConfirm={handleDelete}
                onCancel={closeDeleteConfirm}
            />
        </div>
    );
};

export default EntryDetailPage;
