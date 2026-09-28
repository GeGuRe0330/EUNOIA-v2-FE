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
        version: "v2.0.0",
        lastUpdated: "2026-09-28",
        status: "전반적인 리메이크 완성",
        tags: ["전체 구조 재설계", "DB 안정성 강화", "보안 체계 정비", "Java 17 → 21 전환"],
        comment: "이번 업데이트(v2.0.0)는 눈에 보이는 무언가를 새로 더하기보다, 여러분의 기록을 더 안전하게 지키고, 앞으로 있을 새로운 서비스의 확장을 더욱 용이하게 하기 위한 업데이트입니다.\n\n초기 EUNOIA가 감정을 어떻게 말로 건넬 것인가를 고민하는 시간이었다면, 이번엔 서비스 안쪽을 꼼꼼히 다시 다졌습니다.\n\n일기를 쓰고 나면 감정이 분석되고, 기록이 쌓이면 다시 [비춰지는 내 모습]으로 이어지는 과정도 한층 매끄러워졌습니다. 당신은 그저 오늘의 마음을 적기만 하면 되고, 나머지는 EUNOIA가 조용히 이어받습니다. [비춰지는 내 모습]은 이번 업데이트를 거치며 실제 기록들로 여러 차례 확인을 마쳐, 이제 조금 더 믿고 열어보셔도 좋은 모습이 되었습니다. 함께 보여드리는 이야기가 어느 날의 기록에서 비롯됐는지도 더 또렷하게 알 수 있도록 다듬었습니다.\n\n이번 리메이크를 통해 앞으로 추가될 새로운 기능을 더욱 안전하고 다양하게 보여드릴 기반을 마련하였습니다. 지금 당장은 눈에는 잘 띄지 않지만, 당신이 남긴 기록을 지키기 위한 장치들도 함께 더해졌습니다.\n\nEUNOIA는 여전히 감정을 해석하거나 판단하지 않습니다. 다만 이번엔, 그 조심스러운 태도를 조금 더 오래, 조금 더 편안하게 지켜드릴 수 있게 되었습니다.\n\nEUNOIA는 여전히 질문을 남깁니다. 그리고 이제, 그 질문을 더 믿고 마주할 수 있는 자리에서 건넵니다.",
    };


    const updates = [
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
                "   - 로그인/회원가입/관리자 승인 화면 재연동",
                "   - 감정 분석을 이벤트 기반 비동기 처리로 전환, 진행 상태를 실시간으로 안내",
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
            title: "[비춰지는 내모습] UI 개선",
            desc: "더욱 이쁜 모습으로 만들어올게요.",
            severity: "warn",
            hint: "레이아웃 재설계 검토중",
        }
    ];

    const roadmap = [
        {
            quarter: "NEXT",
            title: "다음 업데이트 (예정)",
            items: [
                "캘린더, 내 감정글 목록 등을 관리할 수 있는 마이페이지를 구상중이에요.",
                "전체적인 UI의 톤을 개선할지 고민중이에요.",
            ],
        },
        {
            quarter: "SOON",
            title: "추가 예정인 서비스",
            items: [
                "EUNOIA 챗봇[디스코드(음성채팅) 연동]",
            ],
        },
    ];

    const backlog = [
        "비춰지는 내모습 서비스 개선",
        "출석/성장 시스템(새싹 → 나무 컨셉)",
        "테마 토글(감성/코드 느낌) 확장",
        "마이페이지",
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
