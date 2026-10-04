import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { entriesPathForDate } from "../../utils/entryView";
import {
    buildMonthGrid,
    indexCalendarDays,
    formatYearMonthLabel,
    formatDayLabel,
    todayDateString,
    isFutureDate,
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

// 기록 없는 지난 날 — 글자는 투명도 없이 textSecondary 그대로(배경 대비 약 6:1). 이전에 /60을 줘서 2.6:1로 떨어졌던 것을 바로잡음
const BLANK_CLASS = "bg-primary-light/20 border-primary-dark/10 text-textSecondary";
// 오늘 이후 날짜 — 아직 오지 않은 날이라 배경·테두리를 걷고 흐리게(기록이 있을 수 없는 칸이라 호버·클릭 대상도 아님)
const FUTURE_CLASS = "border-transparent bg-transparent text-textSecondary opacity-40";
const LEVEL_BORDER_CLASS = "border-primary-dark/20 text-textPrimary";
// 기록은 있지만 분석이 없거나 실패한 날 — 색 대신 점선 테두리로 "기록 있음"만 알림
const NO_SCORE_CLASS = "bg-white/40 border-dashed border-primary-dark/50 text-textPrimary";

// 클릭할 수 있는 날(기록 있는 날)의 호버 효과 — 메타 분석 "지난 분석" 항목과 같은 결(살짝 떠오름 + 그림자 + 테두리 강조)
const CLICKABLE_CLASS =
    "cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:border-primary-dark/60";

// 월 이동 화살표는 글자(◀ ▶)가 아니라 SVG — 모바일 OS가 이 문자들을 색 있는 이모지로 바꿔 그리는 것을 피한다
const NAV_BUTTON_CLASS =
    "inline-flex items-center justify-center rounded-lg border border-primary-dark/20 px-3 py-1.5 text-sm text-textSecondary " +
    "hover:bg-primary-light/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent";

const DayCell = ({ cell, info, isToday, isFuture }) => {
    if (!cell) return <div role="cell" aria-hidden="true" />;

    // 미래 > 기록 없음 > 분석 없는 기록(점선) > 점수 명암 순으로 정함
    let stateClass;
    if (isFuture) stateClass = FUTURE_CLASS;
    else if (!info) stateClass = BLANK_CLASS;
    else if (info.level === null) stateClass = NO_SCORE_CLASS;
    else stateClass = `${LEVEL_CLASSES[info.level]} ${LEVEL_BORDER_CLASS}`;

    const label = formatDayLabel(cell.date, info?.entryCount);

    return (
        <div
            role="cell"
            aria-label={info ? undefined : label}
            aria-current={isToday ? "date" : undefined}
            className={`relative h-12 sm:h-16 rounded-md border flex items-center justify-center text-sm ${stateClass} ${
                isToday ? "ring-2 ring-primary-dark/60" : ""
            } ${info ? CLICKABLE_CLASS : ""}`}
        >
            {/* 기록 있는 날은 그날의 글 목록(열람 화면)으로 가는 링크 — 칸 전체가 눌리고, 링크의 aria-label이 날짜와 글 수를 읽어줌 */}
            {info ? (
                <Link
                    to={entriesPathForDate(cell.date)}
                    aria-label={label}
                    className="absolute inset-0 flex items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark"
                >
                    {cell.day}
                </Link>
            ) : (
                cell.day
            )}
            {info && info.entryCount > 1 && (
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute right-1 top-0.5 text-[11px] font-semibold leading-none text-textPrimary"
                >
                    ×{info.entryCount}
                </span>
            )}
        </div>
    );
};

// 월 단위 감정 캘린더 — 글이 있는 날을 점수 기반 명암으로 칠함 (감정 종류별 색이 아님: emotionDetected가 자유 문자열이라 매핑 불가)
// 기록 있는 날을 누르면 그날의 글 목록(/entries?from=…&to=…, 하루는 시작일=종료일)으로 이동
// days는 서버 응답 그대로 받고, 달 밖·잘못된 항목 거르기는 indexCalendarDays가 함
const EmotionCalendar = ({ yearMonth, days, loading, canNext, onPrev, onNext }) => {
    const weeks = buildMonthGrid(yearMonth);
    const indexed = indexCalendarDays(days, yearMonth);
    const today = todayDateString();

    return (
        <div aria-busy={loading}>
            <div className="flex items-center justify-between mb-4">
                <button type="button" onClick={onPrev} aria-label="이전 달" className={NAV_BUTTON_CLASS}>
                    <ChevronLeft aria-hidden="true" className="h-5 w-5" />
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
                    <ChevronRight aria-hidden="true" className="h-5 w-5" />
                </button>
            </div>

            {/* 보기 전용 표라 role="table"로 둠 — "grid"는 화살표 키로 칸을 옮기는 위젯이라는 약속이라 키보드 이동이 없는 지금은 맞지 않음.
                날짜 이동(⑦)이 붙어 칸이 링크가 돼도 표 안의 링크로 접근 가능하고, 화살표 이동까지 구현할 때 grid로 올리면 됨 */}
            <div role="table" aria-label={`${formatYearMonthLabel(yearMonth)} 감정 캘린더`}>
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

                <div role="rowgroup" className={`space-y-1.5 sm:space-y-2 transition-opacity ${loading ? "opacity-60" : ""}`}>
                    {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} role="row" className="grid grid-cols-7 gap-1.5 sm:gap-2">
                            {week.map((cell, cellIndex) => (
                                <DayCell
                                    key={cell?.date ?? `blank-${cellIndex}`}
                                    cell={cell}
                                    info={cell ? indexed[cell.date] : undefined}
                                    isToday={cell?.date === today}
                                    isFuture={cell ? isFutureDate(cell.date) : false}
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

                {/* 범례와 같은 글자 크기 — 넓은 화면(sm 이상)에선 범례와 같은 줄 우측 끝, 좁은 화면에선 범례보다 위에 한 줄 전체로 좌측 정렬 */}
                <p className="order-first w-full text-left sm:order-none sm:ml-auto sm:w-auto sm:text-right">
                    기록이 있는 날을 누르면 그날의 감정일기를 볼 수 있어요.
                </p>
            </div>
        </div>
    );
};

export default EmotionCalendar;
