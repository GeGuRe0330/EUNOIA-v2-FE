const pad = (n) => String(n).padStart(2, "0");

// 오늘 "YYYY-MM-DD" (로컬 날짜 기준) — toISOString은 UTC로 바뀌어 하루 밀릴 수 있어 쓰지 않음
export const todayDateString = (now = new Date()) =>
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
