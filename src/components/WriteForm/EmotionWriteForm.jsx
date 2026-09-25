import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postEmotionEntry } from '../../api/EunoiaApi';
import { useApiError } from '../../hooks/useApiError';

const EmotionWriteForm = () => {
    const navigate = useNavigate();
    const [content, setContent] = useState('');
    const { handleApiError } = useApiError();
    const [emotionTag, setEmotionTag] = useState('');
    const [entryDate, setEntryDate] = useState(() => {
        const today = new Date().toISOString().split('T')[0];
        return today;
    });

    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await postEmotionEntry({
                content,
                emotionTag,
            });

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

            {/* <div>
                <label className="block mb-1 font-semibold">🙂 감정 태그</label>
                <select
                    className="w-full p-2 border rounded"
                    value={emotionTag}
                    onChange={(e) => setEmotionTag(e.target.value)}
                    required
                >
                    <option value="">-- 감정을 선택하세요 --</option>
                    <option value="기쁨">기쁨</option>
                    <option value="슬픔">슬픔</option>
                    <option value="불안">불안</option>
                    <option value="분노">분노</option>
                    <option value="기대">기대</option>
                </select>
            </div> */}

            {/* <div>
                <label className="block mb-1 font-semibold">📅 작성 날짜</label>
                <input
                    type="date"
                    className="p-2 border rounded"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                />
            </div> */}

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
