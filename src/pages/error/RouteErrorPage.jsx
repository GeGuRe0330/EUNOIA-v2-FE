import { useRouteError } from 'react-router-dom';

// 라우트 loader/렌더링 오류 화면 — 예: requireAuth에서 서버 장애로 로그인 여부를 판단할 수 없을 때
const RouteErrorPage = () => {
    const error = useRouteError();

    // API 오류(normalizeApiError 결과, status 있음)만 메시지를 보여주고, 코드 오류는 범용 문구로
    const message = typeof error?.status === 'number'
        ? error.message
        : '잠시 후 다시 시도해 주세요.';

    return (
        <div className="min-h-screen w-full flex items-center justify-center font-sans text-textPrimary px-4">
            <div className="w-full max-w-md rounded-2xl bg-white/70 backdrop-blur shadow-sm border border-black/5 p-6 md:p-7 text-center">
                <h1 className="text-lg font-semibold mb-2">화면을 불러오지 못했어요.</h1>
                <p className="text-sm text-gray-600 mb-6">{message}</p>
                <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="w-full rounded-xl py-3 text-sm font-medium bg-black text-white hover:opacity-90 transition"
                >
                    다시 시도
                </button>
            </div>
        </div>
    );
};

export default RouteErrorPage;
