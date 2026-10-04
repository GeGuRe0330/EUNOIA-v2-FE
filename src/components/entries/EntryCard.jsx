import { Link } from "react-router-dom";

// 감정글 카드 한 장 — 마이페이지 최근 글과 열람 목록이 함께 씀. entry는 normalizeEntries의 결과 { id, dateText, content, emotion }
// to가 있으면 카드 전체가 그 경로(상세)로 가는 링크다 — 키보드 포커스(focus-visible)와 호버 효과(메타 분석 "지난 분석" 항목과 같은 결)를 준다
const CARD_CLASS =
    "group rounded-xl border border-primary-dark/10 bg-white/40 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-white/65 hover:shadow-md hover:border-primary-dark/40";

const BODY_CLASS = "flex items-center justify-between gap-3 rounded-xl p-4";

// onOpen: 링크를 누르는 순간(이동 직전) 부르는 콜백 — 열람 목록이 그 시점의 스크롤 위치·불러온 글을 저장해 두려고 쓴다
// state: 이동할 때 함께 넘길 상태 — 열람 목록이 "어느 목록에서 왔는지"를 넘겨 상세에서 삭제한 뒤 그 목록으로 돌아가게 한다
const EntryCard = ({ entry, to, state, onOpen }) => {
    const body = (
        <>
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
        </>
    );

    return (
        <li className={CARD_CLASS}>
            {to ? (
                <Link
                    to={to}
                    state={state}
                    onClick={onOpen}
                    className={`${BODY_CLASS} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark/60`}
                >
                    {body}
                </Link>
            ) : (
                <div className={BODY_CLASS}>{body}</div>
            )}
        </li>
    );
};

export default EntryCard;
