// [MOCK] 더미 글(id 900001~)의 상세·분석 더미 — 백엔드 연동(⑩)까지만 쓰고 그때 제거한다.
// 상세 화면은 실제 API를 쓰지만, 더미 목록의 카드는 실제 서버에 없는 글이라 그대로 두면 404가 되어 화면을 확인할 수 없다.
// 그래서 더미 id(isMockEntryId)에 한해 상세·분석을 더미로 돌려준다. 실제 id는 그대로 실제 서버로 간다.

// GET /emotion-entries/{id} 응답 모양 — { id, memberId, content, entryDate }
export const buildMockEntryDetail = (entry) => ({
    id: entry.id,
    memberId: 1,
    content: entry.content,
    entryDate: entry.entryDate,
});

// GET /analyses/by-entry/{id} 응답 본문 또는 null(= 서버가 404 "처리 중"을 줄 때)
//  감정이 있는 글(SUCCESS) → 성공 분석
//  감정이 없는 글(분석 없음/FAILED) → id가 짝수면 FAILED(서버 문구만, 나머지 필드 null), 홀수면 null(처리 중, 404)
//  — 한 화면 흐름에서 성공·실패·처리 중을 모두 볼 수 있게 섞어 둔다
export const buildMockAnalysis = (entry) => {
    if (entry.emotionDetected === null) {
        if (entry.id % 2 !== 0) return null;

        return {
            entryId: entry.id,
            memberId: 1,
            status: "FAILED",
            reason: "감정 분석에 실패했어요.",
            emotionDetected: null,
            keywords: null,
            insightSummary: null,
            flowHint: null,
            emotionSummary: null,
            emotionScore: null,
            warmMessages: null,
        };
    }

    const emotion = entry.emotionDetected;
    return {
        entryId: entry.id,
        memberId: 1,
        status: "SUCCESS",
        reason: null,
        emotionDetected: emotion,
        keywords: `${emotion}, 일상, 마음`,
        insightSummary: `이 글에서는 ${emotion}이 가장 또렷하게 느껴져요. 하루의 작은 장면들이 그 마음을 조용히 받쳐 주고 있어요.`,
        flowHint: `평소의 마음 → ${emotion} → 조금씩 정리되는 마음`,
        emotionSummary: `${emotion}이 중심에 있는 하루예요. 크게 흔들리지는 않지만 마음이 어디에 머무는지가 글에 잘 드러나요.`,
        emotionScore: (entry.id % 61) + 35,
        warmMessages: [
            `${emotion}을 느끼는 것도 괜찮아요.`,
            "오늘의 마음을 이렇게 적어 둔 것만으로도 충분해요.",
            "서두르지 않아도 마음은 제 속도로 정리돼요.",
        ],
    };
};
