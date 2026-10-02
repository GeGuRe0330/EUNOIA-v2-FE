import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigationType, useSearchParams } from "react-router-dom";
import CardMotion from "../../components/motion/CardMotion";
import EunoiaPageLinkButton from "../../components/common/EunoiaPageLinkButton";
import SectionError from "../../components/common/SectionError";
import EntryCard from "../../components/entries/EntryCard";
import { useEntryList } from "../../hooks/useEntryList";
import { useInViewTrigger } from "../../hooks/useInViewTrigger";
import { todayDateString } from "../../utils/dateString";
import { entryDetailPath } from "../../utils/entryView";
import { loadListSnapshot, saveListSnapshot } from "../../utils/listSnapshot";
import {
    parseDateRange,
    isRangeSet,
    formatRangeLabel,
    applyRangeChange,
    applyRangeToParams,
    PAGE_SIZE,
} from "./entryListView";

const CARD_CLASS =
    "bg-surface/80 backdrop-blur-sm rounded-2xl shadow-md p-6 border border-primary-dark/20";

const MORE_BUTTON_CLASS =
    "rounded-lg border-2 border-primary-dark/40 bg-white/60 px-5 py-2 text-sm font-semibold text-textPrimary shadow-sm " +
    "transition-all duration-150 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-md hover:border-primary-dark/80 " +
    "active:translate-y-0 active:shadow-sm disabled:opacity-60 disabled:cursor-wait disabled:hover:translate-y-0 disabled:hover:shadow-sm";

// [기간 초기화] — 날짜 입력과 같은 높이의 버튼(다른 화면의 버튼과 같은 결: 테두리·그림자·호버 시 떠오름)
const RESET_BUTTON_CLASS =
    "rounded-lg border-2 border-primary-dark/40 bg-white/60 px-4 py-1.5 text-sm font-semibold text-textPrimary shadow-sm " +
    "transition-all duration-150 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-md hover:border-primary-dark/80 " +
    "active:translate-y-0 active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark/60";

const DATE_INPUT_CLASS =
    "rounded-lg border border-primary-dark/30 bg-white/60 px-3 py-1.5 text-sm text-textPrimary shadow-sm " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark/60";

// 스크롤이 끝에 가까워지면 다음 글을 자동으로 이어 불러온다(IntersectionObserver를 지원하지 않는 환경에서만 [더 보기] 버튼)
const CAN_AUTO_LOAD = typeof IntersectionObserver !== "undefined";

// 감정글 열람 — 내 감정글 전체 목록. 조회 기간(시작일·종료일)을 URL 쿼리(`?from=YYYY-MM-DD&to=YYYY-MM-DD`)로 둬서
// 뒤로 가기·새로고침·링크 공유에도 유지된다. 하루는 시작일=종료일, 한쪽만 정해도 된다.
// 마이페이지 캘린더의 날짜 클릭은 그 날을 시작일=종료일로 주입해 이 화면으로 온다. 카드를 누르면 그 글의 상세(/entries/:id)로 간다
const EntryListPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const navigationType = useNavigationType();
    const snapshotKey = location.pathname + location.search;

    // 상세에서 뒤로 가기(POP)로 돌아왔고 저장해 둔 목록이 있으면 그 목록과 스크롤 위치로 복원한다. 처음 마운트할 때 한 번만 정함
    const [restored] = useState(() => (navigationType === "POP" ? loadListSnapshot(snapshotKey) : null));

    // 형식이 틀리거나 없는 날짜는 제한 없음, 시작일이 종료일보다 늦으면 둘 다 적용하지 않음(reversed)
    const { from, to, reversed } = parseDateRange(searchParams.get("from"), searchParams.get("to"));
    const range = { from, to };
    const filtered = isRangeSet(range);

    // 입력칸에서 방금 거부된 값의 안내 — 조회 기간이 바뀌어 적용되면 지운다
    const [inputError, setInputError] = useState(null);

    const { status, items, page, hasNext, message, moreStatus, moreMessage, reload, loadMore } = useEntryList(range, restored);

    // --- 상세로 갔다가 돌아왔을 때 복원 ---
    // 스크롤 위치는 스크롤할 때마다 기억해 둔다(언마운트 시점에는 새 화면이 그려져 브라우저가 이미 위치를 잘라 낸 뒤일 수 있음)
    const scrollYRef = useRef(restored?.scrollY ?? 0);
    const latestRef = useRef(null);
    const savedOnOpenRef = useRef(false);

    useEffect(() => {
        const onScroll = () => {
            scrollYRef.current = window.scrollY;
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // 매 렌더마다 최신 상태를 기억 — 아래 저장 함수들이 쓴다
    useEffect(() => {
        latestRef.current = { snapshotKey, status, items, page, hasNext };
    });

    const saveSnapshot = (scrollY) => {
        const latest = latestRef.current;
        if (!latest || latest.status !== "ready" || latest.items.length === 0) return;
        saveListSnapshot(latest.snapshotKey, {
            items: latest.items,
            page: latest.page,
            hasNext: latest.hasNext,
            scrollY,
        });
    };

    // 카드를 누르는 순간 저장 — 이때의 스크롤 위치가 가장 정확하다
    const handleOpenEntry = () => {
        saveSnapshot(window.scrollY);
        savedOnOpenRef.current = true;
    };

    // 카드 클릭이 아닌 다른 경로로 화면을 떠날 때(브라우저 앞으로 가기 등)의 대비 — 클릭으로 이미 저장했으면 덮어쓰지 않는다
    useEffect(
        () => () => {
            if (!savedOnOpenRef.current) saveSnapshot(scrollYRef.current);
        },
        []
    );

    // 복원한 목록은 이미 그려진 상태로 시작하므로 그리기 직후(화면에 보이기 전) 저장해 둔 위치로 되돌린다
    useLayoutEffect(() => {
        if (restored) window.scrollTo({ top: restored.scrollY, left: 0, behavior: "instant" });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 목록 맨 아래의 보이지 않는 센서 — 화면에 가까워지면 다음 페이지를 불러온다.
    // 불러오는 중이거나 오류가 난 뒤(자동으로 재시도하면 실패가 반복됨)·마지막 페이지에서는 꺼 둔다
    const sentinelRef = useRef(null);
    useInViewTrigger(sentinelRef, {
        enabled: status === "ready" && hasNext && moreStatus === "idle",
        onTrigger: loadMore,
    });

    // 값을 바꾸면 곧바로 적용(조회 버튼 없음). 입력을 고칠 때마다 뒤로 가기 기록이 쌓이지 않도록 replace
    const changeRange = (field, value) => {
        const { next, error } = applyRangeChange(range, field, value);
        setInputError(error);
        if (error) return;
        setSearchParams((previous) => applyRangeToParams(previous, next), { replace: true });
    };

    const clearFilter = () => {
        setInputError(null);
        setSearchParams((previous) => applyRangeToParams(previous, { from: null, to: null }), { replace: true });
    };

    const today = todayDateString();

    return (
        <div className="min-h-screen font-sans px-4 py-8">
            <div className="max-w-3xl mx-auto space-y-6">
                <CardMotion index={0} instant={Boolean(restored)}>
                    <section className={CARD_CLASS}>
                        <h1 className="text-2xl font-semibold text-textPrimary mb-1">지난 감정글</h1>
                        <p className="text-sm text-textSecondary">남겨 둔 기록을 천천히 다시 읽어 보세요.</p>
                    </section>
                </CardMotion>

                {/* 날짜 지정 — 별도 카드. "시작일 ~ 종료일" 대신 "[날짜]에서 [날짜]까지"로 읽히게 한다 */}
                <CardMotion index={1} instant={Boolean(restored)}>
                    <section aria-labelledby="date-range-title" className={CARD_CLASS}>
                        <h2 id="date-range-title" className="text-lg font-semibold text-textPrimary mb-1">
                            기간 검색
                        </h2>

                        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3 text-sm text-textPrimary">
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    aria-label="시작 날짜"
                                    value={from ?? ""}
                                    max={to ?? today}
                                    onChange={(e) => changeRange("from", e.target.value)}
                                    className={DATE_INPUT_CLASS}
                                />
                                <span>에서</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    aria-label="종료 날짜"
                                    value={to ?? ""}
                                    min={from ?? undefined}
                                    max={today}
                                    onChange={(e) => changeRange("to", e.target.value)}
                                    className={DATE_INPUT_CLASS}
                                />
                                <span>까지</span>
                            </div>

                            {filtered && (
                                <button
                                    type="button"
                                    onClick={clearFilter}
                                    className={`${RESET_BUTTON_CLASS} sm:ml-auto`}
                                >
                                    기간 초기화
                                </button>
                            )}
                        </div>

                        {inputError && (
                            <p role="alert" className="mt-2 text-sm text-red-500">
                                {inputError}
                            </p>
                        )}

                        {reversed && !inputError && (
                            <p role="status" className="mt-2 text-sm text-textSecondary">
                                주소의 시작 날짜가 종료 날짜보다 늦어서 전체 기록을 보여드려요.
                            </p>
                        )}
                    </section>
                </CardMotion>

                <CardMotion index={2} instant={Boolean(restored)}>
                    <section aria-label="감정글 목록" className={CARD_CLASS}>
                        {status === "loading" && (
                            // 실제 카드(약 96px)와 비슷한 높이·개수로 자리를 잡아 데이터가 도착할 때 높이가 크게 변하지 않게 한다
                            // 기간을 지정했으면 글이 적을 가능성이 커 3개, 아니면 한 페이지(10개)만큼
                            <div className="space-y-3 animate-pulse" aria-busy="true">
                                {Array.from({ length: filtered ? 3 : PAGE_SIZE }, (_, i) => (
                                    <div key={i} className="h-24 rounded-xl bg-primary-light/30" />
                                ))}
                            </div>
                        )}

                        {status === "error" && <SectionError message={message} onRetry={reload} />}

                        {/* 기록이 하나도 없는 신규 회원 */}
                        {status === "ready" && items.length === 0 && !filtered && (
                            <div className="py-6 text-center">
                                <p className="text-sm font-medium text-textPrimary mb-1">아직 돌아볼 기록이 없어요.</p>
                                <p className="text-sm text-textSecondary leading-relaxed mb-5">
                                    첫 기록을 남기면,
                                    <br />
                                    이곳에서 다시 읽어 볼 수 있어요.
                                </p>
                                <EunoiaPageLinkButton to="/write" message="감정글 작성" />
                            </div>
                        )}

                        {/* 날짜 필터가 걸렸는데 그날 글이 없음 */}
                        {status === "ready" && items.length === 0 && filtered && (
                            <div className="py-6 text-center">
                                <p className="text-sm font-medium text-textPrimary mb-5">
                                    {formatRangeLabel(range)}에는 기록이 없어요.
                                </p>
                                <EunoiaPageLinkButton onClick={clearFilter} message="전체 기록 보기" />
                            </div>
                        )}

                        {status === "ready" && items.length > 0 && (
                            <>
                                <ul className="space-y-3">
                                    {items.map((entry) => (
                                        <EntryCard
                                            key={entry.id}
                                            entry={entry}
                                            to={entryDetailPath(entry.id)}
                                            state={{ from: snapshotKey }}
                                            onOpen={handleOpenEntry}
                                        />
                                    ))}
                                </ul>

                                {/* 스크롤 센서 — 화면에 안 보이는 얇은 요소 */}
                                {CAN_AUTO_LOAD && <div ref={sentinelRef} aria-hidden="true" className="h-px" />}

                                {/* 스크린리더에게 목록이 이어 붙었음을 알림 */}
                                <p className="sr-only" aria-live="polite">
                                    {`감정글 ${items.length}개를 보고 있어요.`}
                                </p>

                                <div className="mt-5 flex flex-col items-center gap-2 text-sm text-textSecondary">
                                    {moreStatus === "loading" && <p aria-busy="true">불러오는 중…</p>}

                                    {/* 자동 불러오기가 실패하면 반복하지 않고 사용자가 다시 시도하게 함 — 이미 본 목록은 그대로 */}
                                    {moreStatus === "error" && (
                                        <SectionError message={moreMessage} onRetry={loadMore} retryLabel="다시 시도" />
                                    )}

                                    {/* 자동 불러오기를 못 쓰는 환경의 대체 수단 */}
                                    {!CAN_AUTO_LOAD && hasNext && moreStatus === "idle" && (
                                        <button type="button" onClick={loadMore} className={MORE_BUTTON_CLASS}>
                                            더 보기
                                        </button>
                                    )}

                                    {/* 더 불러온 적이 있을 때만 — 글이 몇 개 안 되는 사람에게는 군더더기 */}
                                    {page > 0 && !hasNext && moreStatus === "idle" && (
                                        <p>모든 기록을 불러왔어요.</p>
                                    )}
                                </div>
                            </>
                        )}
                    </section>
                </CardMotion>
            </div>
        </div>
    );
};

export default EntryListPage;
