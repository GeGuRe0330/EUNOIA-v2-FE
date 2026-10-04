// 마이페이지 화면용 순수 로직 — 화면(MyPage)과 분리해 테스트 가능하게 둠

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// 가입일 문자열("2026-08-15T10:30:00" 등)과 오늘의 달력 날짜 차이로 "가입 N일째"를 구함(가입 당일 = 1일째)
// Date 객체로 시각을 비교하지 않고 날짜만 UTC 자정으로 맞춰 빼서 시간대·시각에 흔들리지 않음
// 형식이 틀렸거나 존재하지 않는 날짜, 미래 날짜면 null
export const daysTogether = (createdAt, now = new Date()) => {
    const match = DATE_PATTERN.exec(String(createdAt ?? ""));
    if (!match) return null;

    const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
    const joined = new Date(Date.UTC(year, month - 1, day));
    if (joined.getUTCMonth() !== month - 1 || joined.getUTCDate() !== day) return null;

    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((today - joined.getTime()) / MS_PER_DAY);
    return diffDays >= 0 ? diffDays + 1 : null;
};

export const formatTogetherText = (days) => (days == null ? null : `함께한 지 ${days}일째`);

// 최근 감정 — 분석이 끝난 SUCCESS의 emotionDetected만 인정(④번과 같은 fail-closed: 알려진 status만)
// 분석이 없거나(null) FAILED(감정 필드가 null)이거나 값이 비어 있으면 null
export const resolveLatestEmotion = (latest) => {
    if (latest?.status !== "SUCCESS") return null;
    const emotion = typeof latest.emotionDetected === "string" ? latest.emotionDetected.trim() : "";
    return emotion || null;
};

export const formatEntryCount = (count) => (Number.isFinite(count) ? `${count}개` : "-");
