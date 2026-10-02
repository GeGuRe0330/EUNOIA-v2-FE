import {
    buildMonthGrid,
    indexCalendarDays,
    formatYearMonthLabel,
    formatDayLabel,
    todayDateString,
} from "./calendarView";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 점수 단계(1~5, 높을수록 안정)별 명암 — Tailwind가 클래스를 찾을 수 있게 문자열을 통째로 둠
const LEVEL_CLASSES = {
    1: "bg-primary-dark/10",
    2: "bg-primary-dark/25",
    3: "bg-primary-dark/40",
    4: "bg-primary-dark/55",
    5: "bg-primary-dark/70",
};

const BLANK_CLASS = "bg-primary-light/20 border-primary-dark/10 text-textSecondary/60";
const LEVEL_BORDER_CLASS = "border-primary-dark/20 text-textPrimary";
// 기록은 있지만 분석이 없거나 실패한 날 — 색 대신 점선 테두리로 "기록 있음"만 알림
const NO_SCORE_CLASS = "bg-white/40 border-dashed border-primary-dark/50 text-textPrimary";

// 클릭할 수 있는 날(기록 있는 날)의 호버 효과 — 메타 분석 "지난 분석" 항목과 같은 결(살짝 떠오름 + 그림자 + 테두리 강조)
// 열람 화면(⑦)이 생기면 이 칸을 <Link>로 바꾸고 키보드 포커스 스타일(focus-visible)도 함께 추가
const CLICKABLE_CLASS =
    "cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:border-primary-dark/60";

const NAV_BUTTON_CLASS =
    "rounded-lg border border-primary-dark/20 px-3 py-1.5 text-sm text-textSecondary " +
    "hover:bg-primary-light/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent";

const DayCell = ({ cell, info, isToday }) => {
    if (!cell) return <div role="gridcell" aria-hidden="true" />;

    const stateClass = !info
        ? BLANK_CLASS
        : info.level === null
          ? NO_SCORE_CLASS
          : `${LEVEL_CLASSES[info.level]} ${LEVEL_BORDER_CLASS}`;

    return (
        <div
            role="gridcell"
            aria-label={formatDayLabel(cell.date, info?.entryCount)}
            aria-current={isToday ? "date" : undefined}
            className={`relative h-12 sm:h-16 rounded-md border flex items-center justify-center text-sm ${stateClass} ${
                isToday ? "ring-2 ring-primary-dark/60" : ""
            } ${info ? CLICKABLE_CLASS : ""}`}
        >
            {cell.day}
            {info && info.entryCount > 1 && (
                <span
                    aria-hidden="true"
                    className="absolute right-1 top-0.5 text-[10px] leading-none text-textSecondary"
                >
                    ×{info.entryCount}
                </span>
            )}
        </div>
    );
};

// 월 단위 감정 캘린더 — 글이 있는 날을 점수 기반 명암으로 칠함 (감정 종류별 색이 아님: emotionDetected가 자유 문자열이라 매핑 불가)
// 날짜 클릭 이동은 열람 화면(⑦)이 생긴 뒤 연결 — 지금은 표시만
// days는 서버 응답 그대로 받고, 달 밖·잘못된 항목 거르기는 indexCalendarDays가 함
const EmotionCalendar = ({ yearMonth, days, loading, canNext, onPrev, onNext }) => {
    const weeks = buildMonthGrid(yearMonth);
    const indexed = indexCalendarDays(days, yearMonth);
    const today = todayDateString();

    return (
        <div aria-busy={loading}>
            <div className="flex items-center justify-between mb-4">
                <button type="button" onClick={onPrev} aria-label="이전 달" className={NAV_BUTTON_CLASS}>
                    ◀
                </button>

                <h2 aria-live="polite" className="text-lg font-semibold text-textPrimary">
                    {formatYearMonthLabel(yearMonth)}
                </h2>

                <button
                    type="button"
                    onClick={onNext}
                    disabled={!canNext}
                    aria-label="다음 달"
                    className={NAV_BUTTON_CLASS}
                >
                    ▶
                </button>
            </div>

            <div role="grid" aria-label={`${formatYearMonthLabel(yearMonth)} 감정 캘린더`}>
                <div role="row" className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    {WEEKDAYS.map((weekday) => (
                        <div
                            key={weekday}
                            role="columnheader"
                            className="text-center text-xs text-textSecondary"
                        >
                            {weekday}
                        </div>
                    ))}
                </div>

                <div className={`space-y-1.5 sm:space-y-2 transition-opacity ${loading ? "opacity-60" : ""}`}>
                    {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} role="row" className="grid grid-cols-7 gap-1.5 sm:gap-2">
                            {week.map((cell, cellIndex) => (
                                <DayCell
                                    key={cell?.date ?? `blank-${cellIndex}`}
                                    cell={cell}
                                    info={cell ? indexed[cell.date] : undefined}
                                    isToday={cell?.date === today}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* 범례 — 색은 "그날 글의 안정도" 단계, 점선은 기록은 있지만 분석이 없는 날 */}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-textSecondary">
                <div className="flex items-center gap-1.5">
                    <span>덜 안정적</span>
                    {[1, 2, 3, 4, 5].map((level) => (
                        <span
                            key={level}
                            aria-hidden="true"
                            className={`h-3 w-5 rounded-sm border border-primary-dark/20 ${LEVEL_CLASSES[level]}`}
                        />
                    ))}
                    <span>더 안정적</span>
                </div>

                <div className="flex items-center gap-1.5">
                    <span
                        aria-hidden="true"
                        className="h-3 w-5 rounded-sm border border-dashed border-primary-dark/50 bg-white/40"
                    />
                    <span>분석 없는 기록</span>
                </div>
            </div>
        </div>
    );
};

export default EmotionCalendar;
