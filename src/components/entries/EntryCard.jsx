// 감정글 카드 한 장 — 마이페이지 최근 글과 열람 목록이 함께 씀. entry는 normalizeEntries의 결과 { id, dateText, content, emotion }
// 클릭하면 상세로 갈 카드라는 걸 호버로 알림(메타 분석 "지난 분석" 항목과 같은 결) — 상세(⑧)가 생기면
// 이 li 안쪽을 <Link>로 바꾸고 키보드 포커스 스타일(focus-visible)도 함께 추가
const EntryCard = ({ entry }) => (
    <li className="group flex items-center justify-between gap-3 cursor-pointer rounded-xl border border-primary-dark/10 bg-white/40 p-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-white/65 hover:shadow-md hover:border-primary-dark/40">
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
);

export default EntryCard;
