import { useEffect, useState } from "react";
import CardMotion from "../../components/motion/CardMotion";
import EunoiaPageLinkButton from "../../components/common/EunoiaPageLinkButton";

// 추후 api 파일에 만들 함수들
// import { getMyPageSummary, getEmotionCalendar, getMyEmotionEntries } from "../../api/EunoiaApi";

const MyPage = () => {
    const [profile, setProfile] = useState(null);
    const [calendarData, setCalendarData] = useState([]);
    const [entries, setEntries] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMyPageData = async () => {
            try {
                // TODO: 실제 API 연결 전까지는 더미 데이터
                const profileDummy = {
                    nickname: "개구리",
                    profileImageUrl: null,
                    totalEntryCount: 12,
                    latestEmotion: "-",
                    message: "최근 당신은 새로운 흐름을 다시 잡아가고 있어요."
                };

                const calendarDummy = [
                    { date: "2026-05-01", emotion: "기대" },
                    { date: "2026-04-30", emotion: "불안" },
                    { date: "2026-04-28", emotion: "평온" }
                ];

                const entriesDummy = [
                    {
                        id: 1,
                        entryDate: "2026-05-01",
                        emotionTag: "기대",
                        content: "오늘은 다시 EUNOIA를 다듬어보고 싶다는 생각이 들었다."
                    },
                    {
                        id: 2,
                        entryDate: "2026-04-30",
                        emotionTag: "불안",
                        content: "요즘 취업 준비에만 매몰된 것 같아서 조금 지쳤다."
                    }
                ];



                setProfile(profileDummy);
                setCalendarData(calendarDummy);
                setEntries(entriesDummy);

                /*
                const [profile, calendar, entries] = await Promise.all([
                    getMyPageSummary(),
                    getEmotionCalendar(),
                    getMyEmotionEntries()
                ]);

                setProfile(profile);
                setCalendarData(calendar);
                setEntries(entries);
                */
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMyPageData();
    }, []);

    if (loading) {
        return <div className="text-center">마이페이지를 불러오는 중...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center">{error}</div>;
    }

    if (!profile && entries.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full px-4 text-center">
                <CardMotion index={0}>
                    <div className="bg-surface/80 backdrop-blur-sm rounded-2xl shadow-md p-6 max-w-md border border-primary-dark/20">
                        <h2 className="text-lg font-semibold text-textPrimary mb-2">
                            아직 돌아볼 기록이 없어요.
                        </h2>

                        <p className="text-sm text-textSecondary leading-relaxed mb-4">
                            첫 기록을 남기면,<br />
                            이곳에 당신의 감정 흐름이 천천히 쌓이게 돼요.
                        </p>

                        <div className="mt-5 flex justify-center">
                            <EunoiaPageLinkButton to="/write" message="감정글 작성" />
                        </div>
                    </div>
                </CardMotion>
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans px-4 py-8">
            <div className="max-w-5xl mx-auto space-y-6">

                <CardMotion index={0}>
                    <section className="bg-surface/80 backdrop-blur-sm rounded-2xl shadow-md p-6 border border-primary-dark/20">
                        <h1 className="text-2xl font-semibold text-textPrimary mb-2">
                            마이페이지
                        </h1>
                        <p className="text-sm text-textSecondary">
                            지금까지의 감정 기록을 조용히 돌아보는 공간이에요.
                        </p>
                    </section>
                </CardMotion>

                <CardMotion index={1}>
                    <section className="bg-surface/80 backdrop-blur-sm rounded-2xl shadow-md p-6 border border-primary-dark/20">
                        <h2 className="text-lg font-semibold text-textPrimary mb-4">
                            나의 기록 요약
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                            {/* 왼쪽: 프로필 이미지 영역 */}
                            <div className="flex justify-center md:justify-start">
                                <div className="w-64 h-64 rounded-2xl bg-primary-light/30 border border-primary-dark/20 shadow-sm flex items-center justify-center overflow-hidden">
                                    {profile.profileImageUrl ? (
                                        <img
                                            src={profile.profileImageUrl}
                                            alt="프로필이미지"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <img
                                            src="src/assets/myPage/default_M.png"
                                            alt="프로필이미지"
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* 오른쪽: 사용자 요약 정보 영역 */}
                            <div className="md:col-span-2 space-y-4 text-center md:text-left">
                                <div>
                                    <p className="text-sm text-textSecondary mb-1">
                                        오늘도 기록을 이어가고 있는
                                    </p>

                                    <h3 className="text-2xl font-semibold text-textPrimary">
                                        {profile.nickname}
                                    </h3>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="rounded-xl bg-white/40 border border-primary-dark/10 p-3">
                                        <p className="text-textSecondary text-xs mb-1">
                                            총 작성 글
                                        </p>
                                        <p className="text-lg font-semibold text-textPrimary">
                                            {profile.totalEntryCount}개
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-white/40 border border-primary-dark/10 p-3">
                                        <p className="text-textSecondary text-xs mb-1">
                                            최근 감정
                                        </p>
                                        <p className="text-lg font-semibold text-textPrimary">
                                            {profile.latestEmotion}
                                        </p>
                                    </div>
                                </div>

                                <p className="text-sm text-textSecondary/90 italic leading-relaxed">
                                    {profile.message}
                                </p>
                            </div>
                        </div>
                    </section>
                </CardMotion>

                <CardMotion index={2}>
                    <section className="bg-surface/80 backdrop-blur-sm rounded-2xl shadow-md p-6 border border-primary-dark/20">
                        <h2 className="text-lg font-semibold text-textPrimary mb-4">
                            감정 캘린더
                        </h2>

                        <div className="grid grid-cols-7 gap-2">
                            {Array.from({ length: 35 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="aspect-square rounded-md bg-primary-light/20 border border-primary-dark/10"
                                />
                            ))}
                        </div>

                        <p className="text-xs text-textSecondary mt-4">
                            감정이 기록된 날은 색으로 표시될 예정이에요.
                        </p>
                    </section>
                </CardMotion>

                <CardMotion index={3}>
                    <section className="bg-surface/80 backdrop-blur-sm rounded-2xl shadow-md p-6 border border-primary-dark/20">
                        <h2 className="text-lg font-semibold text-textPrimary mb-4">
                            작성했던 감정글
                        </h2>

                        <div className="space-y-3">
                            {entries.map((entry) => (
                                <article
                                    key={entry.id}
                                    className="rounded-xl border border-primary-dark/10 bg-white/40 p-4"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-medium text-textPrimary">
                                            {entry.entryDate}
                                        </p>
                                        <span className="text-xs px-2 py-1 rounded-full bg-primary-light/30 text-textSecondary">
                                            {entry.emotionTag}
                                        </span>
                                    </div>

                                    <p className="text-sm text-textSecondary line-clamp-2">
                                        {entry.content}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </section>
                </CardMotion>

            </div>
        </div>
    );
};

export default MyPage;