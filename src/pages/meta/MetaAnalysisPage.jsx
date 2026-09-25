import { useEffect, useMemo, useRef, useState } from "react";
import CardMotion from "../../components/motion/CardMotion";
import { getMetaLatestForMe, upsertMeta } from "../../api/EunoiaApi";

/** -----------------------------
 *  UI: Buttons
 *  (프로젝트에 Button 컴포넌트 있으면 교체)
 * ----------------------------- */
const PrimaryButton = ({ children, onClick, disabled = false }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={[
            "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold shadow-sm border-[1px] transition",
            disabled
                ? "bg-white/30 border-primary/30 text-textSecondary cursor-not-allowed"
                : "bg-primary/50 hover:bg-primary-dark/30 border-primary/70",
        ].join(" ")}
    >
        {children}
    </button>
);

const SecondaryButton = ({ children, onClick }) => (
    <button
        onClick={onClick}
        className="inline-flex items-center justify-center rounded-xl bg-white/35 hover:bg-white/50 transition px-4 py-2 text-sm font-semibold shadow-sm border-[1px] border-primary-dark/30"
    >
        {children}
    </button>
);

/** -----------------------------
 *  Utils
 * ----------------------------- */
function formatYMD(dateStr) {
    if (!dateStr) return "";
    return dateStr.replaceAll("-", ".");
}
function clampPercent(value) {
    if (Number.isNaN(value)) return 0;
    return Math.max(0, Math.min(100, value));
}

const LOADING_LINES = [
    "당신의 기록을 조심히 읽고 있어요.",
    "반복된 흐름을 하나의 장면으로 묶고 있어요.",
    "정답이 아니라, ‘당신의 언어’를 지키려 하고 있어요.",
    "조금만 더요. 곧 첫 장면이 열려요.",
];

/** -----------------------------
 *  Page
 * ----------------------------- */
const MetaAnalysisPage = () => {
    const [PageLoading, setPageLoading] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [isUpserting, setIsUpserting] = useState(false);
    /**
     * ✅ 예시: READY 응답 (Outer/Inner/Trust까지 보려면 READY가 편함)
     * PREPARING을 보고 싶으면 status를 "PREPARING"으로 바꿔봐!
     */


    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await getMetaLatestForMe();
                setData(result);
            } catch (err) {
                setError(err.message);
            } finally {
                setPageLoading(false);
            }
        };

        fetchData();
    }, []);


    const isPreparing = data?.status === "PREPARING";
    const isReady = data?.status === "READY";

    // ✅ 프론트 화면 단계(라우트는 하나인데 화면은 step으로 바뀜)
    const [step, setStep] = useState("GATE"); // "GATE" | "LOADING" | "OUTER" | "INNER" | "TRUST"

    // ✅ 성능: 현재 step만 렌더링할 거라 데이터는 한 번만 유지
    const result = data?.resultJson;

    const progressPercent = useMemo(() => {
        const required = Number(data?.requiredCount ?? 0);
        const current = Number(data?.currentCount ?? 0);
        if (!required) return 0;
        return clampPercent(Math.round((current / required) * 100));
    }, [data?.requiredCount, data?.currentCount]);

    // ✅ 이전 분석 결과 보기 노출 조건(안전하게 이중 체크)
    const hasPreviousResult = Boolean(data?.createdAt && data?.resultJson);

    const periodText = `${formatYMD(data?.periodStart)} ~ ${formatYMD(data?.periodEnd)}`;

    // 언마운트 가드
    const mountedRef = useRef(true);
    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // Gate에서 "분석 시작하기" 눌렀을 때
    const handleStartAnalysis = async () => {
        if (!isReady) return;
        if (isUpserting) return;

        try {
            setIsUpserting(true);
            setError(null);

            // ✅ 로딩 스텝으로 전환(여기서 "로딩 페이지"가 화면에 보임)
            setStep("LOADING");
            window.scrollTo({ top: 0, behavior: "smooth" });

            // ✅ 서버 분석 생성/갱신
            const updated = await upsertMeta();

            if (!mountedRef.current) return;
            setData(updated);

            // ✅ 결과로 진입
            setStep("OUTER");
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (err) {
            if (!mountedRef.current) return;

            setError(err?.message ?? "분석 생성에 실패했어요.");
            setStep("GATE"); // 실패 시 다시 준비 화면으로
        } finally {
            if (mountedRef.current) {
                setIsUpserting(false);
            }
        }
    };

    const handleGoGate = () => {
        setStep("GATE");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    if (PageLoading) return <div className="text-center">불러오는 중...</div>;
    return (
        <div className="w-full">
            <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-6 md:py-10">
                {/* ✅ 스텝 표시 (가볍게) */}
                <div className="mb-3 text-xs text-textSecondary">
                    {step === "GATE" && "0 / 3 · 준비"}
                    {step === "OUTER" && "1 / 3 · 외적의 나"}
                    {step === "INNER" && "2 / 3 · 내면의 나"}
                    {step === "TRUST" && "3 / 3 · 마치며"}
                </div>

                {/* ------------------------------------------------
         *  STEP: GATE (PREPARING / READY)
         * ------------------------------------------------ */}

                {/* ✅ LOADING 화면 */}
                {step === "LOADING" && <MetaLoadingBlock />}

                {step === "GATE" && (
                    <>
                        {/* 0) 헤더 카드 */}
                        <CardMotion index={0}>
                            <section className="rounded-2xl bg-surface/70 shadow-sm p-6 md:p-8">
                                <h1 className="text-2xl md:text-3xl font-bold text-textPrimary leading-snug">
                                    {isPreparing && (
                                        <>
                                            아직 흐름을 준비하고 있어요.
                                            <br className="sm:hidden" /> 조금만 더 기록이 모이면 열려요
                                        </>
                                    )}
                                    {isReady && (
                                        <>
                                            이제 흐름을 살펴볼 수 있어요.
                                            <br className="sm:hidden" /> 천천히, 한 단계씩 들어가볼까요
                                        </>
                                    )}
                                    {!isPreparing && !isReady && (
                                        <>
                                            흐름을 불러오는 중이에요.
                                            <br className="sm:hidden" /> 잠시만 기다려주세요
                                        </>
                                    )}
                                </h1>

                                <p className="mt-4 text-sm md:text-base leading-relaxed text-textSecondary">
                                    이 분석은 최근 30일을 기준으로, 하루에 하나씩 선별된 기록의 흐름을 바탕으로 만들어져요.
                                    <br />
                                    정답을 주기보다, 당신의 기록을 다시 바라볼 수 있게 돕는 작은 거울이 되고자 해요.
                                </p>
                                <p>*현재 시범 운영중인 BETA서비스입니다.*</p>
                            </section>
                        </CardMotion>

                        {/* 1) 기간 + 진행도 카드 */}
                        <CardMotion index={1}>
                            <section className="mt-6 rounded-2xl bg-surface/70 shadow-sm p-6 md:p-8">
                                <p className="text-sm text-textSecondary mb-2">이번 분석 기준</p>

                                <div className="rounded-2xl bg-white/45 shadow-sm p-5 md:p-6 border-2 border-primary-dark/40">
                                    <div className="flex flex-col gap-4">
                                        <div>
                                            <div className="text-sm font-semibold text-textPrimary">분석 기간</div>
                                            <div className="mt-1 text-sm text-textSecondary">{periodText}</div>
                                        </div>

                                        <div>
                                            <div className="flex items-end justify-between gap-3">
                                                <div className="text-sm font-semibold text-textPrimary">기록 준비도</div>
                                                <div className="text-xs text-textSecondary">
                                                    {data?.currentCount ?? 0} / {data?.requiredCount ?? 0}
                                                </div>
                                            </div>

                                            <div className="mt-2 w-full rounded-full bg-white/40 border border-primary-dark/20 overflow-hidden h-3">
                                                <div
                                                    className="h-3 rounded-full bg-primary-dark/50 transition-all"
                                                    style={{ width: `${progressPercent}%` }}
                                                />
                                            </div>

                                            <p className="mt-2 text-xs md:text-sm text-textSecondary leading-relaxed">
                                                기록은 많을수록 좋기보다,{" "}
                                                <span className="font-semibold text-textPrimary">시간의 결이 이어질수록</span> 선명해져요.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </CardMotion>

                        {/* 2) PREPARING */}
                        {isPreparing && (
                            <CardMotion index={2}>
                                <section className="mt-6 rounded-2xl bg-surface/70 shadow-sm p-6 md:p-8">
                                    <p className="text-sm text-textSecondary mb-2">지금 할 수 있는 것</p>

                                    <div className="rounded-2xl bg-white/45 shadow-sm p-5 md:p-6 border-2 border-primary-dark/40">
                                        <h2 className="text-lg font-bold text-textPrimary">조금만 더 기록이 쌓이면 열려요</h2>
                                        <p className="mt-2 text-sm md:text-base leading-relaxed text-textSecondary">
                                            당신의 모습을 비춰주기 위해서는 서로 다른 날짜에 작성된 최소 10개의 감정글이 필요해요.
                                            <br />

                                        </p>

                                        <ul className="mt-4 list-disc list-inside space-y-2 text-textSecondary text-sm md:text-base">
                                            {(data?.actions ?? []).map((msg, idx) => (
                                                <li key={idx}>{msg}</li>
                                            ))}
                                        </ul>

                                        <div className="mt-5 flex flex-col sm:flex-row gap-3">
                                            <PrimaryButton onClick={() => alert("예시) 글쓰기 페이지로 이동")}>
                                                오늘의 감정 기록하기
                                            </PrimaryButton>
                                            <SecondaryButton onClick={() => alert("예시) 기록 목록 보기")}>
                                                내 기록 보러가기
                                            </SecondaryButton>
                                        </div>
                                    </div>
                                </section>
                            </CardMotion>
                        )}

                        {/* 3) READY */}
                        {isReady && (
                            <CardMotion index={2}>
                                <section className="mt-6 rounded-2xl bg-surface/70 shadow-sm p-6 md:p-8">
                                    <p className="text-sm text-textSecondary mb-2">분석 시작</p>

                                    <div className="rounded-2xl bg-white/45 shadow-sm p-5 md:p-6 border-2 border-primary-dark/40">
                                        <h2 className="text-lg font-bold text-textPrimary">이제 흐름을 열어볼 수 있어요</h2>
                                        <p className="mt-2 text-sm md:text-base leading-relaxed text-textSecondary">
                                            준비가 되었어요. 분석은{" "}
                                            <span className="font-semibold text-textPrimary">외적의 나 → 내면의 나 → 마치며</span>{" "}
                                            순서로, 한 걸음씩 천천히 진행돼요.
                                        </p>

                                        <div className="mt-5 flex flex-col sm:flex-row gap-3">
                                            <PrimaryButton onClick={handleStartAnalysis}>분석 시작하기</PrimaryButton>

                                            {hasPreviousResult && (
                                                <SecondaryButton
                                                    onClick={() => {
                                                        // 예시: 이전 결과도 같은 흐름이라면 Outer로 진입시켜도 됨
                                                        setStep("OUTER");
                                                        window.scrollTo({ top: 0, behavior: "smooth" });
                                                    }}
                                                >
                                                    이전 분석 결과 보기
                                                </SecondaryButton>
                                            )}
                                        </div>

                                        {!hasPreviousResult && (
                                            <p className="mt-3 text-xs text-textSecondary">
                                                이전 분석 결과가 아직 없어요. 이번 분석이 첫 장면이 될 거예요.
                                            </p>
                                        )}
                                    </div>
                                </section>
                            </CardMotion>
                        )}
                    </>
                )}

                {/* ------------------------------------------------
         *  STEP: OUTER
         * ------------------------------------------------ */}
                {step === "OUTER" && (
                    <OuterView
                        periodText={periodText}
                        outer={result?.outer}
                        onBack={handleGoGate}
                        onNext={() => {
                            setStep("INNER");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                    />
                )}

                {/* ------------------------------------------------
         *  STEP: INNER
         * ------------------------------------------------ */}
                {step === "INNER" && (
                    <InnerView
                        inner={result?.inner}
                        onPrev={() => {
                            setStep("OUTER");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        onNext={() => {
                            setStep("TRUST");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                    />
                )}

                {/* ------------------------------------------------
         *  STEP: TRUST
         * ------------------------------------------------ */}
                {step === "TRUST" && (
                    <TrustView
                        periodText={periodText}
                        createdAt={data?.createdAt}
                        updatedAt={data?.updatedAt}
                        clarity={result?.clarity}
                        evidence={result?.evidenceNarrative?.howChosen ?? []}
                        onPrev={() => {
                            setStep("INNER");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        onDone={() => {
                            setStep("GATE");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default MetaAnalysisPage;

/** --------------------------------
 *  LOADING UI (한 파일 안에)
 * -------------------------------- */
function MetaLoadingBlock() {
    const [idx, setIdx] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIdx((prev) => (prev + 1) % LOADING_LINES.length);
        }, 1800);
        return () => clearInterval(timer);
    }, []);

    return (
        <>
            <CardMotion index={0}>
                <section className="rounded-2xl bg-surface/70 shadow-sm p-6 md:p-8 items-center">
                    <p className="text-sm text-textSecondary mb-2">분석 중</p>
                    <h2 className="text-2xl md:text-3xl font-bold text-textPrimary leading-snug">
                        흐름을 조용히 정리하고 있어요
                    </h2>
                    <p className="mt-4 text-sm md:text-base leading-relaxed text-textSecondary">
                        {LOADING_LINES[idx]}
                    </p>

                    <div className="mt-10 w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </section>
            </CardMotion>

            <CardMotion index={1}>
                <section className="mt-6 rounded-2xl bg-surface/60 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-textPrimary">잠깐만요</h3>
                    <p className="mt-3 text-sm md:text-base leading-relaxed text-textSecondary">
                        분석은 빠르게 결론을 내기보다, 가능한 한 부드럽게 이어지도록 만들고 있어요.
                    </p>
                </section>
            </CardMotion>
        </>
    );
}

/** -----------------------------
 *  View: Outer
 * ----------------------------- */
function OuterView({ periodText, outer, onBack, onNext }) {
    const safeOuter = outer ?? {};
    return (
        <>
            <CardMotion index={0}>
                <section className="rounded-2xl bg-surface/70 shadow-sm p-6 md:p-8">
                    <p className="text-sm text-textSecondary mb-2">Step 1 · 외적의 나</p>
                    <h2 className="text-2xl md:text-3xl font-bold text-textPrimary leading-snug">
                        겉으로 드러난 나의 모습
                    </h2>
                    <p className="mt-3 text-sm md:text-base leading-relaxed text-textSecondary">
                        반복된 표현과 반응을 바탕으로, 기록 속에서 드러난 “겉의 움직임”을 정리했어요.
                        <br />
                        <span className="text-xs text-textSecondary">분석 기간: {periodText}</span>
                    </p>

                    <div className="mt-5 flex flex-col sm:flex-row gap-3">
                        <SecondaryButton onClick={onBack}>준비 화면으로</SecondaryButton>
                        <PrimaryButton onClick={onNext}>내면의 나로 들어가기</PrimaryButton>
                    </div>
                </section>
            </CardMotion>

            <CardMotion index={1}>
                <section className="mt-6 rounded-2xl bg-surface/70 shadow-sm p-6 md:p-8">
                    <p className="text-lg font-bold text-textPrimary mb-2">당신의 외적인 모습</p>
                    <div className="rounded-2xl bg-white/45 shadow-sm p-5 md:p-6 border-2 border-primary-dark/40">
                        <p className="text-sm md:text-base leading-relaxed text-textSecondary">
                            {safeOuter.summary ?? "아직 표시할 요약이 없어요."}
                        </p>

                        {!!safeOuter.keywords?.length && (
                            <div className="mt-4">
                                <div className="text-sm font-bold text-textPrimary">자주 나타난 단어</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {safeOuter.keywords.map((k, idx) => (
                                        <span
                                            key={idx}
                                            className="inline-flex items-center rounded-lg bg-primary-dark/90 px-2 py-1 text-xs font-semibold"
                                        >
                                            {k}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </CardMotion>

            <OuterBlocks indexStart={2} outer={safeOuter} />
        </>
    );
}

function OuterBlocks({ indexStart, outer }) {
    const blocks = [
        { title: "트리거", items: outer.triggers },
        { title: "감정 흐름", items: outer.emotionFlows },
        { title: "대처 패턴", items: outer.copingPatterns },
        { title: "강점 신호", items: outer.strengthSignals },
        { title: "민감 포인트", items: outer.sensitivePoints },
    ];

    return (
        <CardMotion index={indexStart}>
            <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {blocks.map((b, i) => (
                    <div key={i} className="rounded-2xl bg-surface/60 shadow-sm p-6">
                        <h3 className="text-lg font-bold text-textPrimary">{b.title}</h3>

                        {b.items?.length ? (
                            <ul className="mt-3 list-disc pl-5 space-y-2 text-sm md:text-base text-textSecondary leading-relaxed">
                                {b.items.map((t, idx) => (
                                    <li key={idx}>{t}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="mt-3 text-sm text-textSecondary">표시할 내용이 아직 없어요.</p>
                        )}
                    </div>
                ))}
            </section>
        </CardMotion>
    );
}

/** -----------------------------
 *  View: Inner
 * ----------------------------- */
function InnerView({ inner, onPrev, onNext }) {
    const safeInner = inner ?? {};
    const hasGap = Boolean(safeInner.outerInnerGap && safeInner.gapExplanation);

    return (
        <>
            <CardMotion index={0}>
                <section className="rounded-2xl bg-surface/70 shadow-sm p-6 md:p-8">
                    <p className="text-sm text-textSecondary mb-2">Step 2 · 내면의 나</p>
                    <h2 className="text-2xl md:text-3xl font-bold text-textPrimary leading-snug">
                        그 이면에 놓인 방향과 욕구
                    </h2>
                    <p className="mt-3 text-sm md:text-base leading-relaxed text-textSecondary">
                        겉의 반응을 지나, 기록 속에서 반복된 “내면의 이유”를 조심스럽게 정리했어요.
                    </p>

                    <div className="mt-5 flex flex-col sm:flex-row gap-3">
                        <SecondaryButton onClick={onPrev}>외적의 나로</SecondaryButton>
                        <PrimaryButton onClick={onNext}>마치며</PrimaryButton>
                    </div>
                </section>
            </CardMotion>

            <CardMotion index={1}>
                <section className="mt-6 rounded-2xl bg-surface/70 shadow-sm p-6 md:p-8">
                    <p className="text-lg font-bold text-textPrimary mb-2">내면은 어때보일까?</p>
                    <div className="rounded-2xl bg-white/45 shadow-sm p-5 md:p-6 border-2 border-primary-dark/40">
                        <p className="text-sm md:text-base leading-relaxed text-textSecondary">
                            {safeInner.summary ?? "아직 표시할 요약이 없어요."}
                        </p>

                        {!!safeInner.keywords?.length && (
                            <div className="mt-4">
                                <div className="text-sm font-bold text-textPrimary">자주 나타난 단어</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {safeInner.keywords.map((k, idx) => (
                                        <span
                                            key={idx}
                                            className="inline-flex items-center rounded-lg bg-primary-dark/90 px-2 py-1 text-xs font-semibold"
                                        >
                                            {k}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </CardMotion>

            <CardMotion index={2}>
                <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoListCard title="핵심 가치" items={safeInner.coreValues} />
                    <InfoListCard title="필요" items={safeInner.needs} />
                    <InfoListCard title="내적 동기" items={safeInner.innerMotivations} />
                    <InfoListCard
                        title="내면-외면 간격"
                        items={hasGap ? [safeInner.outerInnerGap, safeInner.gapExplanation] : []}
                        emptyText="뚜렷한 간격은 아직 관찰되지 않았어요."
                    />
                </section>
            </CardMotion>
        </>
    );
}

function InfoListCard({ title, items, emptyText = "표시할 내용이 아직 없어요." }) {
    return (
        <div className="rounded-2xl bg-surface/60 shadow-sm p-6">
            <h3 className="text-lg font-bold text-textPrimary">{title}</h3>
            {items?.length ? (
                <ul className="mt-3 list-disc pl-5 space-y-2 text-sm md:text-base text-textSecondary leading-relaxed">
                    {items.map((t, idx) => (
                        <li key={idx}>{t}</li>
                    ))}
                </ul>
            ) : (
                <p className="mt-3 text-sm text-textSecondary">{emptyText}</p>
            )}
        </div>
    );
}

/** -----------------------------
 *  View: Trust
 * ----------------------------- */
function TrustView({ periodText, createdAt, updatedAt, clarity, evidence, onPrev, onDone }) {
    const safeClarity = clarity ?? {};
    const [showAllEvidence, setShowAllEvidence] = useState(false);

    const evidenceToShow = showAllEvidence ? evidence : evidence.slice(0, 3);

    return (
        <>
            <CardMotion index={0}>
                <section className="rounded-2xl bg-surface/70 shadow-sm p-6 md:p-8">
                    <p className="text-sm text-textSecondary mb-2">Step 3 · 마치며</p>
                    <h2 className="text-2xl md:text-3xl font-bold text-textPrimary leading-snug">
                        이 분석은 이렇게 만들어졌어요
                    </h2>
                    <p className="mt-3 text-sm md:text-base leading-relaxed text-textSecondary">
                        어떤 기록들이 선택되었는지, 어떤 이유로 그렇게 읽혔는지 투명하게 남겨둘게요.
                    </p>

                    <div className="mt-5 flex flex-col sm:flex-row gap-3">
                        <SecondaryButton onClick={onPrev}>내면의 나로</SecondaryButton>
                        <PrimaryButton onClick={onDone}>처음으로</PrimaryButton>
                    </div>
                </section>
            </CardMotion>

            <CardMotion index={1}>
                <section className="mt-6 rounded-2xl bg-surface/70 shadow-sm p-6 md:p-8">
                    <p className="text-lg font-bold text-textPrimary">선명도</p>
                    <p className="mb-2 text-sm text-textSecondary leading-relaxed">
                        이번 분석이 당신을 얼만큼 비추어 보았을까요?
                    </p>

                    <div className="rounded-2xl bg-white/45 shadow-sm p-5 md:p-6 border-2 border-primary-dark/40">
                        <div className="flex items-end justify-between">
                            <div className="text-sm font-semibold text-textPrimary">총 선명도</div>
                            <div className="text-2xl font-extrabold text-textPrimary">
                                {safeClarity.clarityScore ?? 0}
                            </div>
                        </div>
                        <div className="mt-2 w-full rounded-full bg-white/40 border border-primary-dark/20 overflow-hidden h-3">
                            <div
                                className="h-3 rounded-full bg-primary-dark/50 transition-all"
                                style={{ width: `${safeClarity.clarityScore}%` }}
                            />
                        </div>

                        {!!safeClarity.clarityReasons?.length && (
                            <ul className="mt-3 list-disc pl-5 space-y-2 text-sm md:text-base text-textSecondary leading-relaxed">
                                {safeClarity.clarityReasons.map((t, idx) => (
                                    <li key={idx}>{t}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>
            </CardMotion>

            <CardMotion index={2}>
                <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoListCard title="아직 잘 보이지 않는 부분" items={safeClarity.notVisibleYet} />
                    <InfoListCard title="다음 기록을 위한 제안" items={safeClarity.nextActions} />
                </section>
            </CardMotion>

            <CardMotion index={3}>
                <section className="mt-6 rounded-2xl bg-surface/70 shadow-sm p-6 md:p-8">
                    <p className="text-lg font-bold text-textPrimary">지난 나의 기록들</p>
                    <p className="mb-2 text-sm text-textSecondary leading-relaxed">
                        EUNOIA는 당신의 이 기록들을 바라봤어요.
                    </p>
                    <div className="rounded-2xl bg-white/45 shadow-sm p-5 md:p-6 border-2 border-primary-dark/40">
                        <ul className="space-y-3">
                            {evidenceToShow.map((e, idx) => (
                                <li
                                    key={`${e.entryId}-${idx}`}
                                    className="rounded-xl bg-white/35 border border-primary-dark/20 p-4"
                                >
                                    <div className="text-sm font-bold text-textPrimary">Entry #{e.entryId}</div>
                                    <div className="mt-1 text-sm text-textSecondary leading-relaxed">Hint : {e.whySelected}</div>
                                </li>
                            ))}
                        </ul>

                        {evidence.length > 3 && (
                            <div className="mt-4">
                                <SecondaryButton onClick={() => setShowAllEvidence((v) => !v)}>
                                    {showAllEvidence ? "접기" : `전체 보기 (${evidence.length}개)`}
                                </SecondaryButton>
                            </div>
                        )}
                    </div>
                </section>
            </CardMotion>

            <CardMotion index={4}>
                <section className="mt-6 rounded-2xl bg-surface/70 shadow-sm p-6 md:p-8">
                    <p className="text-lg font-bold text-textPrimary mb-2">Info</p>

                    <div className="rounded-2xl bg-white/45 shadow-sm p-5 md:p-6 border-2 border-primary-dark/40">
                        <div className="text-sm text-textSecondary">
                            <div>
                                <span className="font-semibold text-textPrimary">분석 기간</span> · {periodText}
                            </div>
                            <div className="mt-1">
                                <span className="font-semibold text-textPrimary">생성</span> · {createdAt ?? "-"}
                            </div>
                            <div className="mt-1">
                                <span className="font-semibold text-textPrimary">갱신</span> · {updatedAt ?? "-"}
                            </div>
                        </div>

                        <div className="mt-4 rounded-xl bg-white/35 border border-primary-dark/20 p-4">
                            <p className="text-sm text-textSecondary leading-relaxed">
                                이 결과는 진단이나 판단이 아니라, 기록의 흐름을 비추는 하나의 거울이에요. <br />
                                해석은 언제든 달라질 수 있고, 선택은 늘 당신에게 있어요.
                            </p>
                        </div>
                    </div>
                </section>
            </CardMotion>
        </>
    );
}
