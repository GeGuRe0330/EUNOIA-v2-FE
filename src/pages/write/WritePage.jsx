import EmotionWriteForm from "../../components/WriteForm/EmotionWriteForm";
import CardMotion from "../../components/motion/CardMotion";

const WritePage = () => {
    return (
        <div className="min-h-screen font-sans px-4 py-8">
            {/* 카드: 오늘의 감정 요약 */}
            <CardMotion index={0}>
                <div className="bg-surface shadow-sm rounded-xl p-4 mb-4">
                    <h2 className="font-bold text-lg text-textPrimary">
                        감정 일기 쓰기
                    </h2>
                    <p className="mt-2 text-textSecondary">
                        주제, 형식에 상관없이 머릿속 떠오르는 감정을 표현해봐요.
                    </p>
                </div>
            </CardMotion>

            {/* 감정 작성 폼 */}
            <CardMotion index={1}>
                <div className="mt-8">
                    <EmotionWriteForm />
                </div>
            </CardMotion>
        </div>
    );
};

export default WritePage;
