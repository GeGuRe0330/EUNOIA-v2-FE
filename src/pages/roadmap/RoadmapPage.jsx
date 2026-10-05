import CardMotion from "../../components/motion/CardMotion";

// 뱃지 컴포넌트
const Badge = ({ children, tone = "primary" }) => {
    const toneMap = {
        primary: "bg-primary-dark/90",
        secondary: "bg-secondary-light/80",
        ok: "bg-emerald-500/70",
        warn: "bg-amber-500/70",
        danger: "bg-rose-500/70",
        neutral: "bg-white/35",
    };

    return (
        <span
            className={`inline-flex items-center rounded-lg px-2 py-1 text-xs font-semibold shadow-sm border-[1px] border-primary/70 ${toneMap[tone] || toneMap.primary}`}
        >
            {children}
        </span>
    );
};

const RoadmapPage = () => {
    const meta = {
        version: "v2.1.0",
        lastUpdated: "2026-10-04",
        status: "기록을 돌아보는 공간 추가",
        tags: ["마이페이지", "지난 감정글 열람", "감정글 삭제", "프로필 설정", "프로필 사진"],
        comment: "이번 업데이트(v2.1.0)는 지난번과 달리, 눈에 보이는 변화가 가득합니다.\n\n지난 v2.0.0이 서비스 안쪽을 다지는 시간이었다면, 이번에는 사용자 개인화에 초점을 맞췄습니다. 일기를 쓰고 EUNOIA의 이야기를 듣는 데서 한 걸음 더 나아가, 내가 남긴 기록들을 다시 펼쳐 보고 되짚어 볼 수 있게 되었습니다.\n\n초기 설계 단계에서는 지난 기록 열람 기능을 의도적으로 제외했었습니다. 매 순간을 바라보는 것이 중요하다는 판단이었으나, 여러 피드백과 고민 끝에 도입하는 편이 더 낫겠다는 결론에 이르렀습니다.\n\n새로 생긴 [마이페이지]에서는 함께한 시간과 기록 지표, 그리고 감정 캘린더를 만날 수 있습니다. 캘린더에서 기록이 있는 날을 누르면 그날 쓴 글로 바로 이어지고, 지난 감정글은 기간을 정해 찾아볼 수 있습니다. 글을 열면 내가 쓴 그대로의 원문과, 그 글에 대한 EUNOIA의 이야기를 함께 볼 수 있습니다.\n\n지우고 싶은 기록은 직접 지울 수 있게 했습니다. 한 번 지운 글은 되돌릴 수 없다는 점 유의해주세요.\n\n이제 닉네임과 비밀번호를 바꾸고, 나만의 프로필 사진을 올릴 수 있습니다.\n\nEUNOIA는 여전히 감정을 해석하거나 판단하지 않습니다. 다만 이번엔, 당신이 남긴 마음을 당신이 언제든 다시 꺼내 볼 수 있도록 곁에 두었습니다.\n\nEUNOIA는 여전히 질문을 남깁니다. 그리고 이제, 그 질문에 당신이 어떻게 답해 왔는지도 돌아볼 수 있습니다.",
    };


    const updates = [
        {
            date: "2026-10-04",
            version: "v2.1.1",
            keywords: ["버그픽스", "이벤트 오류", "버튼 개선", "운영 로그 개선"],
            items: [
                "[감정 기록하기] 감정 일기 길이가 150자가 넘어가면 오류가 발생하는 현상 수정.",
                "\u00A0\u00A0\u00A0- 기존 스프링 이벤트로 본문 전체를 넘겼지만, 이에 컬럼 최대 글자수를 넘어가 DB에 저장이 실패하는 상황 발생.",
                "\u00A0\u00A0\u00A0- 작성 후 이벤트 자체에 본문을 담지 않고, 조회하도록 로직 변경.",
                "운영 로그 개선",
                "\u00A0\u00A0\u00A0- 기존 작성 후 AI 응답을 풀링하는 정상 로그가 운영 로그에 계속 남는 상황 발생.",
                "\u00A0\u00A0\u00A0- INFO, DEBUG 로 로그레벨을 분할 및 관리",
                "[마이페이지] 버튼 디자인 개선",
                "\u00A0\u00A0\u00A0- [마이페이지]에서 프로필 설정 & 캘린더 월 변경 버튼이 모바일에서 이모지로 오출력되는 현상 발생.",
                "\u00A0\u00A0\u00A0- PC·모바일 디자인 일관성을 위해 lucide-react로 해당부분 변경.",
                "\u00A0\u00A0\u00A0- 추가로 대시보드 감정 점수 차트의 이모지를 단색 아이콘으로 통일"
            ],
            tone: "ok",
        },
        {
            date: "2026-10-04",
            version: "v2.1.0",
            keywords: ["마이페이지", "지난 감정글 열람", "감정글 삭제", "프로필 설정", "프로필 사진"],
            items: [
                "[마이페이지] 추가",
                "\u00A0\u00A0\u00A0- 프로필(닉네임·함께한 날), 기록 지표(총 작성 글·이번 달 글·최근 감정)",
                "\u00A0\u00A0\u00A0- 감정 캘린더: 기록이 있는 날을 한눈에 보고, 날짜를 누르면 그날의 글로 이동",
                "\u00A0\u00A0\u00A0- 최근에 쓴 감정글 바로가기",
                "[지난 감정글] 열람 화면 추가",
                "\u00A0\u00A0\u00A0- 시작일·종료일을 정해 기간별로 조회, 스크롤하면 이어서 자동으로 불러오기",
                "\u00A0\u00A0\u00A0- 글을 열었다가 돌아와도 보던 목록과 위치 그대로 유지",
                "감정글 상세 화면 추가: 쓴 그대로의 원문과, 그 글에 대한 EUNOIA의 이야기를 함께 (접어 두었다가 펼쳐 보기)",
                "감정글 삭제 기능 추가 (삭제 전에 한 번 더 확인, 삭제하면 그 글에 대한 EUNOIA의 이야기도 함께 사라짐)",
                "[프로필 설정] 추가: 닉네임·성별·나이 변경, 비밀번호 변경",
                "프로필 사진 업로드 추가",
                "\u00A0\u00A0\u00A0- 원형 틀 안에서 사진의 위치와 크기를 직접 조정",
                "\u00A0\u00A0\u00A0- 언제든 기본 이미지로 되돌리기, 사진은 본인에게만 보이며 위치 정보 등은 저장하지 않음",
                "내비게이션(PC·모바일)에 프로필 사진과 [마이페이지] 버튼 추가",
                "일기 날짜와 이번 달 기록 수가 한국 시간 기준으로 정확히 계산되도록 수정",
                "화면 안내 문구를 EUNOIA의 어조에 맞게 전반적으로 정리",
            ],
            tone: "ok",
        },
        {
            date: "2026-09-28",
            version: "v2.0.0",
            keywords: ["전체 구조 재설계", "DB 마이그레이션", "보안 체계 정비", "비춰지는 내모습 정식 전환"],
            items: [
                "백엔드 전체 구조 재설계 (모듈 구조로 전면 재설계)",
                "기존 MAVEN → GRADLE로 변경",
                "데이터베이스를 Oracle에서 MySQL로 전면 이전",
                "Java 17 → 21, Spring Boot 최신 버전으로 업그레이드",
                "CSRF/CORS/세션 쿠키 보안 체계 재정비",
                "프론트엔드 API 연동 계층 전면 재작성",
                "\u00A0\u00A0\u00A0- 로그인/회원가입/관리자 승인 화면 재연동",
                "\u00A0\u00A0\u00A0- 감정 분석을 이벤트 기반 비동기 처리로 전환, 진행 상태를 실시간으로 안내",
                "[비춰지는 내 모습] 실제 데이터로 전 과정 재검증 후 (BETA) 라벨 제거",
                "[비춰지는 내 모습]에 지난 분석 결과를 다시 열어볼 수 있는 이력 화면 추가",
                "[비춰지는 내 모습] 근거 기록 표시를 내부 번호에서 실제 작성 날짜로 변경",
                "오류 상황 안내 문구를 전반적으로 이해하기 쉬운 말로 정리",
            ],
            tone: "ok",
        },
        {
            date: "2026-02-02",
            version: "v1.2.0",
            keywords: ["비춰지는 내모습", "분석 테이블 수정", "DB안정화"],
            items: [
                "새로운 기능 [비춰지는 내 모습] 추가 (BETA)",
                "새로운 기능 추가에 따라 기존 DB 설계 소폭 변경",
            ],
            tone: "ok",
        },
        {
            date: "2026-01-27",
            version: "v1.1.2",
            keywords: ["EUNOIA 철학 강화", "감정 표현 방식 개선", "UI 안정성"],
            items: [
                "감정 분석 요청 & 응답 로직 안정화 및 최적화",
                "WarmMessage 영역의 역할 재정의 및 문구 톤 개선",
                "기존 [EUNOIA가 당신에게 해주고 싶은 말]을 [지금의 감정을 비춰보는 말]로 변경",
                "응원 중심 메시지에서 감정 동행·자기이해 중심 표현으로 전환",
                "로딩 페이지 영역이 과도하게 확장되던 UI 버그 수정"
            ],
            tone: "ok",
        },
        {
            date: "2026-01-12",
            version: "v1.1.1",
            keywords: ["메인 대시보드 개편", "감정글 작성 유도 페이지 추가", "UI 개선", "UX 개선", "애니메이션 효과 추가", "버그 픽스"],
            items: [
                "메인 대시보드 개편",
                "\u00A0\u00A0\u00A0- 레이아웃 구조 변경 ( PC, 테블릿 PC 환경 )",
                "\u00A0\u00A0\u00A0- 문장 포멧터 로직 변경",
                "\u00A0\u00A0\u00A0- 컨텐츠 카드 UI 변경",
                "\u00A0\u00A0\u00A0- 감정 흐름 카드의 구조 & UI 변경",
                "\u00A0\u00A0\u00A0- [EUNOIA가 본 당신] 카드에 커튼 애니매이션 추가",
                "\u00A0\u00A0\u00A0- [EUNOIA가 본 당신] 카드 폰트를 손글씨 폰트로 변경",
                "나눔손글씨 나무정원 폰트 추가 (출처 : 네이버 폰트)",
                "최초 회원 가입 후 로그인 시 감정 기록 유도 컴포넌트 추가",
                "모바일 네비게이션 버튼 보더 수정",
                "모바일 네비게이션 애니매이션 추가",
                "분석 로딩페이지 UI 보더 라운드 추가",
                "[유노이아란?] 페이지 인스타그램 버튼에 스타일이 적용 안되던 현상 수정",
            ],
            tone: "ok",
        },
        {
            date: "2026-01-10",
            version: "v1.0.1",
            keywords: ["로드맵 페이지 추가", "버그 픽스", "UI 개선", "UX 개선"],
            items: [
                "히스토리 & 개발 현황을 알 수 있는 로드맵 페이지 추가",
                "로그인 페이지에서 새로고침 시 스프링 로그인 페이지로 리다이렉팅 되던 현상 수정",
                "분석 로직을 소폭 개선하여 분석시간 단축",
                "감정 차트의 비정상적인 점수 출력 문제 수정",
                "감정 차트 디자인 수정",
                "UI디자인 소폭 수정",
                "모바일 환경에서 영어 폰트가 깨지는 현상 수정",
                "모바일 환경( 아이폰 사파리 )에서 감정글 작성 시 화면이 줌인 되는 현상 수정",
                "회원가입 성공 시 너무 빨리 로그인 페이지로 리다이렉팅 되는 현상 수정",
            ],
            tone: "ok",
        },
        {
            date: "2026-01-09",
            version: "v1.0.0",
            keywords: ["배포 완료", "회원가입 안정화"],
            items: [
                "회원가입 → 승인(PENDING/ACTIVE) 플로우 정상 동작",
                "예외/응답 표준화(ApiResponse + ErrorCode) 정리 & 적용",
                "프론트 axios 에러 정규화 & 페이지 단 에러 처리 안정화",
            ],
            tone: "ok",
        },
        {
            date: "2026-01-05",
            version: "v0.9.9",
            keywords: ["전역 에러 처리", "로딩 UX 개선"],
            items: [
                "배포 전 스프링부트 컨트롤러 안정화",
                "api요청 로직 안정화",
                "배포 전 백엔드 & 프론트엔드 예외처리 표준화",
                "useApiError 패턴 도입",
                "모바일 환경 전용 화면 추가 + 모바일 전용 네비게이션 추가",
                "로딩 최소 유지 타이머 + 취소 가드 적용",
            ],
            tone: "ok",
        },
    ];


    const issues = [
        {
            title: "[감정 기록하기] UI 변경 + 기능 개선",
            desc: "조금 더 특별하게 감정일기를 쓸 수 있도록 고민중이에요.",
            severity: "ok",
            hint: "기존 기본적인 기록 구현 개선 고민중",
        },
        {
            title: "모니터링 시스템 구축",
            desc: "AI 토큰 관리 + 운영간 분석 지표로 사용될 모니터링 시스템을 구상중이에요.",
            severity: "ok",
            hint: "GRANFANA 기반 별도 대시보드 페이지 or EUNOIA 자체 페이지 고려중",
        },
        {
            title: "EUNOIA 마스코트 캐릭터 구상중",
            desc: "EUNOIA의 마스코트가 될 캐릭터를 구상중이에요.",
            severity: "ok",
            hint: "아이디어 구상 단계",
        },
        {
            title: "[EUNOIA 챗봇]",
            desc: "기존 감정 일기를 또 다른 경험으로 만들어줄 실시간 챗봇을 구상중이에요.",
            severity: "ok",
            hint: "마스코트 + 대화 히스토리 처리방침 기술적 검토중.",
        },
    ];

    const roadmap = [
        {
            quarter: "NEXT",
            title: "다음 업데이트 (예정)",
            items: [
                "EUNOIA 마스코트",
                "EUNOIA 챗봇",
                "모니터링 시스템",
            ],
        },
        {
            quarter: "SOON",
            title: "추가 예정인 서비스",
            items: [
                "EUNOIA 챗봇 디스코드 연동",
            ],
        },
    ];

    const backlog = [
        "EUNOIA 마스코트",
        "EUNOIA 챗봇",
        "출석/성장 시스템(새싹 → 나무 컨셉)",
        "심리테스트",
        "치킨🍗",
        "피자🍕",
        "햄버거🍔",
    ];

    return (
        <div className="w-full">
            <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-6 md:py-10">
                {/* 0) 헤더 요약 카드 */}
                <CardMotion index={0}>
                    <section className="rounded-2xl bg-surface/70 shadow-sm p-6 md:p-8">
                        <p className="text-sm text-textSecondary mb-2">현황판</p>

                        <h1 className="text-2xl md:text-3xl font-bold text-textPrimary leading-snug">
                            EUNOIA 업데이트 & 히스토리
                        </h1>

                        <div className="mt-4 rounded-2xl bg-white/45 shadow-sm p-5 md:p-6 border-2 border-primary-dark/40">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge tone="ok">{meta.status}</Badge>
                                <Badge tone="neutral">{meta.version}</Badge>
                                <Badge tone="neutral">Last: {meta.lastUpdated}</Badge>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                                {meta.tags.map((t) => (
                                    <Badge key={t} tone="primary">
                                        {t}
                                    </Badge>
                                ))}
                            </div>

                            <p className="mt-4 text-sm md:text-base leading-relaxed text-textSecondary whitespace-pre-line">
                                {meta.comment}
                            </p>
                        </div>
                    </section>
                </CardMotion>

                {/* 1) 업데이트 내역 */}
                <CardMotion index={1}>
                    <section className="mt-6 rounded-2xl bg-surface/70 shadow-sm p-6 md:p-8">
                        <p className="text-sm text-textSecondary mb-2">업데이트 내역</p>
                        <div className="mt-2 max-h-[420px] md:max-h-[520px] overflow-y-auto pr-2">
                            <div className="space-y-4">
                                {updates.map((u) => (
                                    <div key={`${u.date}-${u.version}`} className="rounded-2xl bg-white/40 p-5 border-2 border-primary-dark/40">
                                        {/* 상단 메타 정보 */}
                                        <div className="md:flex md:items-center gap-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge tone="neutral">{u.date}</Badge>
                                                <Badge tone="neutral">{u.version}</Badge>
                                            </div>
                                            {/* 키워드 뱃지 */}
                                            <div className="mt-1 md:mt-0 flex flex-wrap items-center gap-1">
                                                {u.keywords.map((kw) => (
                                                    <Badge key={kw} tone={u.tone}>{kw}</Badge>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 상세 내역 */}
                                        <ul className="mt-3 text-sm md:text-base text-textSecondary leading-relaxed list-disc pl-5 space-y-2">
                                            {u.items.map((it, idx) => (
                                                <li key={idx}>{it}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}

                            </div>
                        </div>
                    </section>
                </CardMotion>


                {/* 2) 현재 확인 & 작업중인 현상 */}
                <CardMotion index={2}>
                    <section className="mt-6 rounded-2xl bg-surface/70 shadow-sm p-6 md:p-8">
                        <p className="text-sm text-textSecondary mb-2">현재 확인 & 작업중인 현상</p>

                        <div className="mt-4 grid grid-cols-1  gap-4">
                            {issues.map((i, idx) => (
                                <div key={idx} className="rounded-2xl bg-surface/60 shadow-sm p-6 border-2 border-primary-dark/40">
                                    <div className="flex items-center justify-between gap-3">
                                        <h2 className="text-lg font-bold text-textPrimary">{i.title}</h2>
                                    </div>
                                    <Badge tone={i.severity}>
                                        {i.severity === "warn"
                                            ? "작업중"
                                            : i.severity === "danger"
                                                ? "긴급수정중"
                                                : i.severity === "ok"
                                                    ? "작업대기중"
                                                    : "원인파악중"}
                                    </Badge>

                                    <p className="mt-3 text-sm md:text-base leading-relaxed text-textSecondary whitespace-pre-line">
                                        {i.desc}
                                    </p>

                                    <div className="mt-4 rounded-xl bg-white/80 p-4 border-[1px] border-primary-dark/20">
                                        <p className="text-xs font-semibold text-textSecondary">작업현황</p>
                                        <p className="mt-1 text-sm leading-relaxed text-textSecondary whitespace-pre-line">{i.hint}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </CardMotion>

                {/* 3) 로드맵 */}
                <CardMotion index={3}>
                    <section className="mt-6 rounded-2xl bg-surface/70 shadow-sm p-6 md:p-8">
                        <p className="text-sm text-textSecondary mb-2">로드맵</p>

                        <div className="mt-4 space-y-4">
                            {roadmap.map((r, idx) => (
                                <div key={idx} className="rounded-2xl bg-white/40 p-5 border-2 border-primary-dark/40">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge tone="secondary">{r.quarter}</Badge>
                                        <h2 className="text-lg font-bold text-textPrimary">{r.title}</h2>
                                    </div>

                                    <ul className="mt-3 text-sm md:text-base text-textSecondary leading-relaxed list-disc pl-5 space-y-2">
                                        {r.items.map((it, i2) => (
                                            <li key={i2}>{it}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </section>
                </CardMotion>

                {/* 4) 아이디어 백로그 */}
                <CardMotion index={4}>
                    <section className="mt-6 rounded-2xl bg-surface/70 shadow-sm p-6 md:p-8 ">
                        <p className="text-sm text-textSecondary mb-2">아이디어 백로그</p>

                        <div className="mt-4 rounded-2xl bg-white/40 p-5 border-2 border-primary-dark/40">
                            <p className="text-sm md:text-base leading-relaxed text-textSecondary">
                                현재 개발자의 머릿속
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {backlog.map((b) => (
                                    <Badge key={b} tone="neutral">
                                        {b}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </section>
                </CardMotion>

                {/* 5) Footer note */}
                <CardMotion index={5}>
                    <section className="mt-6 rounded-2xl bg-surface/70 shadow-sm p-6 md:p-8">
                        <h2 className="text-lg font-bold text-textPrimary">개발자의 마음</h2>
                        <p className="mt-3 text-sm md:text-base leading-relaxed text-textSecondary whitespace-pre-line">
                            {"궁극적으로 여러분들과 함께 만드는 EUNOIA가 제 목표입니다.\n 사용하시면서 개선점이나 새로운 아이디어는 언제든 제시해주신다면 적극 반영할게요!"}
                        </p>
                        <p className="mt-4 text-xs text-textSecondary">© EUNOIA · 지리산개구리</p>
                    </section>
                </CardMotion>
            </div>
        </div>
    );
};

export default RoadmapPage;
