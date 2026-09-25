const EmotionSummaryCard = ({ summary }) => {
    // 문장 포멧터
    function formatBySentence(text) {
        if (!text) return text;

        // 문장 끝(. ! ?) 뒤에 공백이 있으면 줄바꿈으로 변경. 내용이 끝나면 종료.
        return text.replace(/([.!?])\s+(?=[^.!?])/g, "$1\n");
    }
    return (
        <div className="bg-surface shadow-md rounded-xl p-4">
            <h2 className="text-lg font-bold text-textPrimary">오늘의 감정 요약</h2>
            <p className="mt-1 text-textSecondary rounded-2xl bg-white/45 shadow-sm p-4 md:p-3 border border-primary-dark/25 text-sm whitespace-pre-line">{formatBySentence(summary)}</p>
        </div>
    );
};

export default EmotionSummaryCard;
