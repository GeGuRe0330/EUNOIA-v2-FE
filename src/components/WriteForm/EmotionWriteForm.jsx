import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postEmotionEntry } from '../../api/EunoiaApi';
import { useApiError } from '../../hooks/useApiError';

const EmotionWriteForm = () => {
    const navigate = useNavigate();
    const [content, setContent] = useState('');
    const { handleApiError } = useApiError();

    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 작성 날짜는 보내지 않음 — 서버가 오늘로 채움
            const res = await postEmotionEntry({ content });

            const entryId = res.id;

            navigate('/loading', { state: { entryId } });
        } catch (err) {
            handleApiError(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-surface p-6 rounded-xl shadow-md space-y-4">
            <h2 className="text-xl font-bold">📝 감정 일기 쓰기</h2>

            <textarea
                className="
                            w-full
                            p-4
                            border border-black/10
                            rounded-xl
                            bg-white/70
                            text-base md:text-lg
                            leading-relaxed
                            resize-none
                            min-h-[180px] md:min-h-[260px]
                            focus:outline-none
                            focus:ring-2 focus:ring-primary-dark/30
                            transition
                            "
                placeholder="오늘의 감정을 자유롭게 적어보세요..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
            />

            <button
                type="submit"
                className="w-full bg-primary text-white p-3 rounded-lg font-semibold hover:bg-primary-dark"
                disabled={isLoading}
            >
                {isLoading ? '저장 중...' : '작성하기'}
            </button>
        </form>
    );
};

export default EmotionWriteForm;
