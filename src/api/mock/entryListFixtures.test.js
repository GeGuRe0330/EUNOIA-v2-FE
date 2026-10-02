import { describe, expect, it } from "vitest";
import {
    MOCK_ENTRY_ID_BASE,
    isMockEntryId,
    buildAllEntries,
    pageEntries,
    withoutDeleted,
    applyDeletionsToCalendar,
    applyDeletionsToSummary,
} from "./entryListFixtures";
import { buildCalendarMonth, buildSummary } from "./myPageFixtures";

// 더미 삭제 반영이 목록·캘린더·지표를 서로 어긋나지 않게 하는지 — 화면 단계에서 삭제 흐름을 믿고 확인할 수 있어야 해서 확인한다
const now = new Date("2026-10-25T12:00:00");

describe("더미 삭제 반영", () => {
    const all = buildAllEntries(now);
    const twoOnSameDay = all.filter((e) => e.entryDate === "2026-10-12"); // 10/12는 글이 2건

    it("withoutDeleted: 지운 글만 빼고 순서를 지킨다", () => {
        const result = withoutDeleted(all, [all[0].id, all[3].id]);
        expect(result).toHaveLength(all.length - 2);
        expect(result.map((e) => e.id)).toEqual(all.filter((e) => ![all[0].id, all[3].id].includes(e.id)).map((e) => e.id));
    });

    it("withoutDeleted: 없는 id나 빈 목록은 그대로다", () => {
        expect(withoutDeleted(all, [])).toHaveLength(all.length);
        expect(withoutDeleted(all, [99999])).toHaveLength(all.length);
    });

    it("캘린더: 지운 글이 있던 날의 글 수가 줄고, 0이 되면 그 날이 빠진다", () => {
        const calendar = buildCalendarMonth("2026-10", now);
        expect(calendar.days.find((d) => d.date === "2026-10-12").entryCount).toBe(2);

        const afterOne = applyDeletionsToCalendar(calendar, [twoOnSameDay[0]]);
        expect(afterOne.days.find((d) => d.date === "2026-10-12").entryCount).toBe(1);

        const afterBoth = applyDeletionsToCalendar(calendar, twoOnSameDay);
        expect(afterBoth.days.find((d) => d.date === "2026-10-12")).toBeUndefined();
        expect(afterBoth.days).toHaveLength(calendar.days.length - 1);
    });

    it("캘린더: 지운 글이 없으면 그대로고, 입력을 바꾸지 않는다", () => {
        const calendar = buildCalendarMonth("2026-10", now);
        const copy = JSON.stringify(calendar);
        expect(applyDeletionsToCalendar(calendar, [])).toEqual(calendar);
        applyDeletionsToCalendar(calendar, twoOnSameDay);
        expect(JSON.stringify(calendar)).toBe(copy);
    });

    it("캘린더와 목록이 삭제 뒤에도 같은 날의 글 수로 일치한다(api-spec의 일치 규칙)", () => {
        const deleted = [twoOnSameDay[0]];
        const calendar = applyDeletionsToCalendar(buildCalendarMonth("2026-10", now), deleted);
        const day = calendar.days.find((d) => d.date === "2026-10-12");
        const listed = pageEntries(withoutDeleted(all, deleted.map((e) => e.id)), { from: "2026-10-12", to: "2026-10-12" }).items;
        expect(listed).toHaveLength(day.entryCount);
    });

    it("지표: 총 글 수와 이번 달 글 수가 지운 만큼 줄고 0 아래로 내려가지 않는다", () => {
        const summary = buildSummary(now);
        const thisMonth = all.filter((e) => e.entryDate.startsWith("2026-10-"));
        const lastMonth = all.find((e) => e.entryDate.startsWith("2026-09-"));

        const afterThisMonth = applyDeletionsToSummary(summary, [thisMonth[0]], "2026-10");
        expect(afterThisMonth.totalEntryCount).toBe(summary.totalEntryCount - 1);
        expect(afterThisMonth.monthEntryCount).toBe(summary.monthEntryCount - 1);

        // 지난 달 글을 지우면 총 글 수만 줄고 이번 달 글 수는 그대로
        const afterLastMonth = applyDeletionsToSummary(summary, [lastMonth], "2026-10");
        expect(afterLastMonth.totalEntryCount).toBe(summary.totalEntryCount - 1);
        expect(afterLastMonth.monthEntryCount).toBe(summary.monthEntryCount);

        expect(applyDeletionsToSummary({ totalEntryCount: 0, monthEntryCount: 0 }, [thisMonth[0]], "2026-10")).toEqual({
            totalEntryCount: 0,
            monthEntryCount: 0,
        });
    });
});

describe("더미 글의 id 범위", () => {
    const all = buildAllEntries(now);

    it("더미 id는 900001부터 중복 없이 이어진다(실제 id 1, 2, 3…과 겹치지 않음)", () => {
        const ids = all.map((e) => e.id);
        expect(Math.min(...ids)).toBe(MOCK_ENTRY_ID_BASE + 1);
        expect(new Set(ids).size).toBe(ids.length);
        expect(ids.every(isMockEntryId)).toBe(true);
    });

    it("최신 글일수록 id가 크다(최신순 정렬과 같은 방향)", () => {
        const ids = all.map((e) => e.id);
        expect(ids).toEqual([...ids].sort((a, b) => b - a));
    });

    it("isMockEntryId는 더미 범위의 정수만 true다", () => {
        expect(isMockEntryId(900001)).toBe(true);
        expect(isMockEntryId(MOCK_ENTRY_ID_BASE)).toBe(false);
        expect(isMockEntryId(6)).toBe(false);
        expect(isMockEntryId(84)).toBe(false);
        expect(isMockEntryId("900001")).toBe(false);
        expect(isMockEntryId(900001.5)).toBe(false);
        expect(isMockEntryId(null)).toBe(false);
    });
});
