import { useCallback, useState } from "react";
import CardMotion from "../../components/motion/CardMotion";
import { useAsyncSection } from "../../hooks/useAsyncSection";
import {
    getMyProfile,
    getMyRecordSummary,
    getLatestAnalysis,
    getEmotionCalendar,
    getRecentEntries,
} from "../../api/EunoiaApi";
import EunoiaPageLinkButton from "../../components/common/EunoiaPageLinkButton";
import ProfileAvatar from "../../components/common/ProfileAvatar";
import EmotionCalendar from "./EmotionCalendar";
import { currentYearMonth, shiftYearMonth, canGoNext } from "./calendarView";
import {
    daysTogether,
    formatTogetherText,
    resolveLatestEmotion,
    formatEntryCount,
    normalizeRecentEntries,
} from "./myPageView";
const CARD_CLASS =
    "bg-surface/80 backdrop-blur-sm rounded-2xl shadow-md p-6 border border-primary-dark/20";
const STAT_CLASS = "rounded-xl bg-white/40 border border-primary-dark/10 p-2.5 sm:p-3";

const SectionError = ({ message, onRetry }) => (
    <div role="alert" className="text-sm text-red-500">
        <p>{message}</p>
        <button type="button" onClick={onRetry} className="mt-1 underline">
            다시 불러오기
        </button>
    </div>
);

/* -----------------------------
 *  ① 프로필 + ② 기록 지표 — 한 카드
 *  넓은 화면에서는 [프로필] [지표 3칸] [설정] 한 줄, 좁은 화면에서는 [프로필 | 설정] 아래에 지표
 *  한 카드 안이어도 프로필·지표·최근 감정은 각자 따로 불러와서, 하나가 실패해도 나머지는 보임
 * ----------------------------- */
const ProfileBlock = () => {
    const { status, data: profile, message, reload } = useAsyncSection(getMyProfile);
    const togetherText = status === "ready" ? formatTogetherText(daysTogether(profile.createdAt)) : null;

    return (
        <div className="min-w-0 lg:order-1">
            {status === "loading" && (
                <div className="flex items-center gap-4 animate-pulse" aria-busy="true">
                    <div className="w-24 h-24 rounded-full bg-primary-light/40" />
                    <div className="space-y-2">
                        <div className="h-5 w-32 rounded bg-primary-light/40" />
                        <div className="h-4 w-24 rounded bg-primary-light/30" />
                    </div>
                </div>
            )}

            {status === "error" && <SectionError message={message} onRetry={reload} />}

            {status === "ready" && (
                <div className="flex items-center gap-4 min-w-0">
                    <ProfileAvatar gender={profile.gender} sizeClass="w-24 h-24" />

                    <div className="min-w-0">
                        <h1 className="text-xl font-semibold text-textPrimary truncate">{profile.nickname}</h1>
                        {togetherText && <p className="text-sm text-textSecondary">{togetherText}</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

// 설정 화면은 별도 브랜치(⑨)에서 만들 예정 — 그때 연결. 프로필 조회가 실패해도 접근할 수 있도록 프로필과 따로 둠
const SettingsButton = () => (
    <button
        type="button"
        disabled
        aria-label="프로필 수정하기 (준비 중)"
        title="준비 중이에요"
        className="group shrink-0 inline-flex items-center gap-2 rounded-lg border-2 border-primary-dark/40 bg-white/60 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-sm font-semibold text-textPrimary shadow-sm cursor-not-allowed transition-all duration-150 hover:-translate-y-0.5 hover:bg-white/80 hover:shadow-md hover:border-primary-dark/70 lg:order-3"
    >
        <span
            aria-hidden="true"
            className="text-2xl leading-none transition-transform duration-300 group-hover:rotate-90"
        >
            ⚙
        </span>
        {/* 좁은 화면에서는 아이콘만 — 글자는 aria-label이 대신 읽어줌 */}
        <span className="hidden sm:inline">프로필 수정하기</span>
    </button>
);

const StatCard = ({ label, status, message, onRetry, children }) => (
    <div className={STAT_CLASS}>
        <p className="text-textSecondary text-xs mb-1">{label}</p>
        {status === "loading" && (
            <div className="h-5 sm:h-6 w-12 sm:w-16 rounded bg-primary-light/40 animate-pulse" aria-busy="true" />
        )}
        {status === "error" && <SectionError message={message} onRetry={onRetry} />}
        {status === "ready" && (
            <p className="text-sm sm:text-lg font-semibold text-textPrimary break-keep">{children}</p>
        )}
    </div>
);

// 총 작성 글 / 이번 달 글 / 최근 감정 — 최근 감정은 지표와 별개로 불러옴
const StatsBlock = () => {
    const summary = useAsyncSection(getMyRecordSummary);
    const latest = useAsyncSection(getLatestAnalysis);

    return (
        <div role="group" aria-label="기록 지표" className="col-span-2 lg:col-span-1 lg:order-2 grid grid-cols-3 gap-3 text-sm">
            <StatCard
                label="총 작성 글"
                status={summary.status}
                message={summary.message}
                onRetry={summary.reload}
            >
                {formatEntryCount(summary.data?.totalEntryCount)}
            </StatCard>

            <StatCard
                label="이번 달 글"
                status={summary.status}
                message={summary.message}
                onRetry={summary.reload}
            >
                {formatEntryCount(summary.data?.monthEntryCount)}
            </StatCard>

            <StatCard
                label="최근 감정"
                status={latest.status}
                message={latest.message}
                onRetry={latest.reload}
            >
                {resolveLatestEmotion(latest.data) ?? "아직 없어요"}
            </StatCard>
        </div>
    );
};

const SummarySection = () => (
    <section className={CARD_CLASS}>
        <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-5 lg:grid-cols-[auto_1fr_auto] lg:gap-x-8">
            <ProfileBlock />
            <SettingsButton />
            <StatsBlock />
        </div>
    </section>
);

/* -----------------------------
 *  ③ 감정 캘린더 — 월 단위로 따로 불러옴(월을 옮기면 그 달만 다시 호출)
 *  날짜 클릭 → 열람 화면 이동은 ⑦에서 연결
 * ----------------------------- */
const CalendarSection = () => {
    const [yearMonth, setYearMonth] = useState(() => currentYearMonth());

    // 월이 바뀔 때만 새 함수가 만들어져 useAsyncSection이 그 달을 다시 불러옴
    const fetchMonth = useCallback(() => getEmotionCalendar(yearMonth), [yearMonth]);
    const { status, data, message, reload } = useAsyncSection(fetchMonth);

    const moveMonth = (delta) => setYearMonth((current) => shiftYearMonth(current, delta) ?? current);

    return (
        <section className={CARD_CLASS}>
            <EmotionCalendar
                yearMonth={yearMonth}
                days={status === "ready" ? data?.days : []}
                loading={status === "loading"}
                canNext={canGoNext(yearMonth)}
                onPrev={() => moveMonth(-1)}
                onNext={() => moveMonth(1)}
            />

            {status === "error" && (
                <div className="mt-4">
                    <SectionError message={message} onRetry={reload} />
                </div>
            )}

            {status === "ready" && !(data?.days?.length > 0) && (
                <p className="mt-4 text-sm text-textSecondary">이 달에는 기록한 날이 없어요.</p>
            )}
        </section>
    );
};

/* -----------------------------
 *  ④ 최근 감정글 — 3~5개
 *  [전체 보기]는 열람 화면(⑦), 카드 클릭 → 상세는 ⑧에서 연결 — 지금은 표시만
 * ----------------------------- */
const RECENT_ENTRY_LIMIT = 5;

const fetchRecentEntries = () => getRecentEntries(RECENT_ENTRY_LIMIT);

const RecentEntriesSection = () => {
    const { status, data, message, reload } = useAsyncSection(fetchRecentEntries);
    const entries = normalizeRecentEntries(data);

    return (
        <section aria-label="최근 감정글" className={CARD_CLASS}>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-textPrimary">최근 감정글</h2>

                {/* 열람 화면(⑦)이 생기면 /entries로 연결 */}
                <button
                    type="button"
                    disabled
                    aria-label="전체 보기 (준비 중)"
                    title="준비 중이에요"
                    className="text-sm text-textSecondary opacity-50 cursor-not-allowed"
                >
                    전체 보기 →
                </button>
            </div>

            {status === "loading" && (
                <div className="space-y-3 animate-pulse" aria-busy="true">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-20 rounded-xl bg-primary-light/30" />
                    ))}
                </div>
            )}

            {status === "error" && <SectionError message={message} onRetry={reload} />}

            {status === "ready" && entries.length === 0 && (
                <div className="py-6 text-center">
                    <p className="text-sm font-medium text-textPrimary mb-1">아직 돌아볼 기록이 없어요.</p>
                    <p className="text-sm text-textSecondary leading-relaxed mb-5">
                        첫 기록을 남기면,
                        <br />
                        이곳에 당신의 감정 흐름이 천천히 쌓이게 돼요.
                    </p>
                    <EunoiaPageLinkButton to="/write" message="감정글 작성" />
                </div>
            )}

            {status === "ready" && entries.length > 0 && (
                <ul className="space-y-3">
                    {entries.map((entry) => (
                        // 클릭하면 상세로 갈 카드라는 걸 호버로 알림(메타 분석 "지난 분석" 항목과 같은 결) — 상세(⑧)가 생기면
                        // 이 li 안쪽을 <Link>로 바꾸고 키보드 포커스 스타일(focus-visible)도 함께 추가
                        <li
                            key={entry.id}
                            className="group flex items-center justify-between gap-3 cursor-pointer rounded-xl border border-primary-dark/10 bg-white/40 p-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-white/65 hover:shadow-md hover:border-primary-dark/40"
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-textPrimary">{entry.dateText}</p>
                                    {entry.emotion && (
                                        <span className="text-xs px-2 py-1 rounded-full bg-primary-light/30 text-textSecondary">
                                            {entry.emotion}
                                        </span>
                                    )}
                                </div>

                                <p className="text-sm text-textSecondary line-clamp-2">{entry.content}</p>
                            </div>

                            <span
                                aria-hidden="true"
                                className="text-primary-dark text-lg transition-transform duration-150 group-hover:translate-x-1"
                            >
                                →
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
};

const MyPage = () => {
    return (
        <div className="min-h-screen font-sans px-4 py-8">
            <div className="max-w-5xl mx-auto space-y-6">
                <CardMotion index={0}>
                    <SummarySection />
                </CardMotion>

                <CardMotion index={1}>
                    <CalendarSection />
                </CardMotion>

                <CardMotion index={2}>
                    <RecentEntriesSection />
                </CardMotion>
            </div>
        </div>
    );
};

export default MyPage;
