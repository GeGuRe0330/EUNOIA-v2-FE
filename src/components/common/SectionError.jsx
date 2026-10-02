// 화면의 한 영역이 불러오기에 실패했을 때의 안내 — 그 영역만 오류를 보이고 나머지 화면은 그대로 둠
const SectionError = ({ message, onRetry, retryLabel = "다시 불러오기" }) => (
    <div role="alert" className="text-sm text-red-500">
        <p>{message}</p>
        <button type="button" onClick={onRetry} className="mt-1 underline">
            {retryLabel}
        </button>
    </div>
);

export default SectionError;
