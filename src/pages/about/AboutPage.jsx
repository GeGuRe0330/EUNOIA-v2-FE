import CardMotion from "../../components/motion/CardMotion";
import profileImg from "../../assets/aboutPage/profile.png";

const AboutPage = () => {
    return (
        <div className="w-full">
            <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-6 md:py-10">
                {/* 0) 제작자 소개 카드 */}
                <CardMotion index={0}>
                    <section className="rounded-2xl bg-surface/70 shadow-sm p-6 md:p-8">
                        <p className="text-sm text-textSecondary mb-2">제작자</p>

                        <div className="rounded-2xl bg-white/45 shadow-sm p-5 md:p-6 border-2 border-primary-dark/40">
                            <div className="flex items-center gap-4">
                                <img
                                    src={profileImg}
                                    alt="제작자 프로필 이미지"
                                    className="w-[125px] h-[125px] md:w-[200px] md:h-[200px] rounded-2xl object-cover shadow-sm"
                                />

                                <div className="min-w-0">
                                    <div className="text-lg md:text-xl font-bold text-textPrimary">
                                        지리산개구리
                                    </div>
                                    <div className="text-sm text-textSecondary">EUNOIA Creator</div>

                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <span className="inline-flex items-center rounded-lg bg-primary-dark/90 px-2 py-1 text-xs font-semibold">
                                            React
                                        </span>
                                        <span className="inline-flex items-center rounded-lg bg-primary-dark/90 px-2 py-1 text-xs font-semibold">
                                            Spring Boot
                                        </span>
                                        <span className="inline-flex items-center rounded-lg bg-primary-dark/90 px-2 py-1 text-xs font-semibold">
                                            Emotion UX
                                        </span>
                                        <span className="inline-flex items-center rounded-lg bg-secondary-light/80 px-2 py-1 text-xs font-semibold">
                                            ENFP
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <p className="mt-4 text-sm md:text-base leading-relaxed text-textSecondary">
                                감정 “정리”가 아니라 “이해”가 되도록,
                                흐름을 남기는 서비스를 만들고 있어요.
                            </p>

                            <div className="mt-4 flex flex-col sm:flex-row gap-3">
                                <a
                                    href="https://github.com/GeGuRe0330"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center rounded-xl bg-primary/50 hover:bg-primary-dark/30 transition px-4 py-2 text-sm font-semibold shadow-sm border-[1px] border-primary/70"
                                >
                                    GitHub
                                </a>
                                <a
                                    href="https://www.instagram.com/little_woojin0330?igsh=NG5hb2xsM2s5ODQ%3D&utm_source=qr"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center rounded-xl bg-primary/50 hover:bg-primary-dark/30 transition px-4 py-2 text-sm font-semibold shadow-sm border-[1px] border-primary/70"
                                >
                                    Instagram
                                </a>
                            </div>
                        </div>
                    </section>
                </CardMotion>

                {/* 1) EUNOIA 소개 카드 */}
                <CardMotion index={1}>
                    <section className="mt-6 rounded-2xl bg-surface/70 shadow-sm p-6 md:p-8">
                        <p className="text-sm text-textSecondary mb-2">EUNOIA 소개</p>

                        <h1 className="text-2xl md:text-3xl font-bold text-textPrimary leading-snug">
                            감정의 흐름을 따라
                            <br className="sm:hidden" /> 나를 마주하는 여정
                        </h1>

                        <p className="mt-4 text-sm md:text-base leading-relaxed text-textSecondary">
                            <span className="font-semibold text-textPrimary">EUNOIA(유노이아)</span>는 그리스어로
                            ‘아름다운 사고방식’을 뜻합니다.
                            <br />
                            이 서비스는 감정을 억지로 정리하거나 정답을 강요하지 않습니다.
                            다만 글로 남겨진 감정의 흔적을 모아, “흐름”을 비추는 작은 거울이 되고자 합니다.
                        </p>
                    </section>
                </CardMotion>

                {/* 2) Why (2열 그리드 전체를 하나의 덩어리로) */}
                <CardMotion index={2}>
                    <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-2xl bg-surface/60 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-textPrimary">왜 만들었을까?</h2>
                            <p className="mt-3 text-sm md:text-base leading-relaxed text-textSecondary">
                                감정을 말로 표현하기 어려운 날이 있고,
                                글을 쓰려 해도 생각이 정리되지 않은 채 흘러가기도 합니다.
                                EUNOIA는 그런 날들을 위해, “설명”보다 “바라보는 거울”을 먼저 건네는 서비스를 꿈꾸며 시작했습니다.
                            </p>
                        </div>

                        <div className="rounded-2xl bg-surface/60 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-textPrimary">EUNOIA는 무엇을 하지?</h2>
                            <p className="mt-3 text-sm md:text-base leading-relaxed text-textSecondary">
                                감정을 정의하려 하기보다,
                                기록된 글을 통해 감정의 변화와 반복을 “흐름”으로 바라볼 수 있게 돕습니다.
                                언젠가 여러분이 보다 깊은 자기 이해를 할 수 있도록 EUNOIA는 옆에서 여러분을 그저 비춰줄것입니다.
                            </p>
                        </div>
                    </section>
                </CardMotion>

                {/* 3) How it works */}
                <CardMotion index={3}>
                    <section className="mt-6 rounded-2xl bg-surface/70 shadow-sm p-6 md:p-8">
                        <h2 className="text-xl font-bold text-textPrimary">어떻게 흐름을 만들까?</h2>

                        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="rounded-xl bg-white/40 p-5 border-2 border-primary-dark/40">
                                <p className="text-xs font-semibold text-textSecondary">STEP 1</p>
                                <h3 className="mt-1 font-bold text-textPrimary">글을 씁니다</h3>
                                <p className="mt-2 text-sm leading-relaxed text-textSecondary">
                                    특정한 형식을 요구하지 않아요. 제목이 없어도, 정리가 덜 되어도 괜찮습니다.
                                    원한다면 감정 태그를 남길 수 있고, 태그 없이 흘러가도 괜찮습니다.
                                </p>
                            </div>

                            <div className="rounded-xl bg-white/40 p-5 border-2 border-primary-dark/40">
                                <p className="text-xs font-semibold text-textSecondary">STEP 2</p>
                                <h3 className="mt-1 font-bold text-textPrimary">감정이 쌓입니다</h3>
                                <p className="mt-2 text-sm leading-relaxed text-textSecondary">
                                    하루하루의 기록은 감정의 궤적이 됩니다.
                                    반복과 변화, 강도를 시각적으로 확인하며 ‘내 안에서 자주 일어나는 반응’을 더 쉽게 알아차릴 수 있어요.
                                </p>
                            </div>

                            <div className="rounded-xl bg-white/40 p-5 border-2 border-primary-dark/40">
                                <p className="text-xs font-semibold text-textSecondary">STEP 3</p>
                                <h3 className="mt-1 font-bold text-textPrimary">나를 마주합니다</h3>
                                <p className="mt-2 text-sm leading-relaxed text-textSecondary">
                                    별도의 회고를 강요하지 않습니다.
                                    있었던 사실을 정리하기보다, 그 순간 느껴졌던 감정에 먼저 귀 기울여요. 그 안에서 진심을 새롭게 마주할 수도 있어요.
                                </p>
                            </div>

                            <div className="rounded-xl bg-white/40 p-5 border-2 border-primary-dark/40">
                                <p className="text-xs font-semibold text-textSecondary">STEP 4</p>
                                <h3 className="mt-1 font-bold text-textPrimary">흐름으로 이해합니다</h3>
                                <p className="mt-2 text-sm leading-relaxed text-textSecondary">
                                    EUNOIA는 정답을 주기보다,
                                    감정의 흐름을 비추는 거울이 되어 당신이 선택한 길을 ‘정답으로 만들어갈 수 있게’ 돕고 싶습니다.
                                </p>
                            </div>
                        </div>
                    </section>
                </CardMotion>

                {/* 4) Goals & Stack (그리드 전체를 하나의 덩어리로) */}
                <CardMotion index={4}>
                    <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-2xl bg-surface/60 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-textPrimary">EUNOIA의 목표</h2>
                            <ul className="mt-3 text-sm md:text-base text-textSecondary leading-relaxed list-disc pl-5 space-y-2">
                                <li>감정 일기 / 자유 글쓰기</li>
                                <li>감정 흐름 및 키워드 시각화</li>
                                <li>사용자에게 ‘나를 이해할 수 있는 거울’ 같은 공간이 되기</li>
                            </ul>
                        </div>

                        <div className="rounded-2xl bg-surface/60 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-textPrimary">기술 스택</h2>
                            <ul className="mt-3 text-sm md:text-base text-textSecondary leading-relaxed list-disc pl-5 space-y-2">
                                <li>Frontend: React (Vite), Axios</li>
                                <li>Backend: Spring Boot, JPA</li>
                                <li>DB: Oracle</li>
                                <li>Visualization: 차트 기반 시각화</li>
                                <li>Animation: Framer Motion</li>
                            </ul>
                        </div>
                    </section>
                </CardMotion>

                {/* 5) Footer note */}
                <CardMotion index={5}>
                    <section className="mt-6 rounded-2xl bg-surface/70 shadow-sm p-6 md:p-8">
                        <h2 className="text-lg font-bold text-textPrimary">마무리</h2>
                        <p className="mt-3 text-sm md:text-base leading-relaxed text-textSecondary">
                            때때로 자신이 왜 이러는지 말로 설명을 못할 때가 있습니다.
                            EUNOIA는 그럴 때 정답 없는 감정들을 찾아 하나의 조각을 만들고,
                            그 조각들이 언젠가 나를 더 잘 이해하는 단서가 되길 바라는 마음에서 시작되었습니다.
                        </p>
                        <p className="mt-4 text-xs text-textSecondary">
                            © EUNOIA · 만든이: 지리산개구리
                        </p>
                    </section>
                </CardMotion>
            </div>
        </div>
    );
};

export default AboutPage;
