import { describe, expect, it } from "vitest";
import { formatEntryDate, iconCenterY } from "./chartData";

describe("formatEntryDate", () => {
    it("yyyy-MM-dd를 MM/DD로 바꾼다", () => {
        expect(formatEntryDate("2026-09-26")).toBe("09/26");
        expect(formatEntryDate("2026-01-05")).toBe("01/05");
    });

    it("날짜 문자열을 그대로 자르므로 타임존에 따라 하루가 밀리지 않는다", () => {
        const env = globalThis.process.env;
        const original = env.TZ;
        env.TZ = "America/Los_Angeles"; // UTC보다 늦은 시간대
        try {
            // Date를 거치면 UTC 자정이 로컬로 하루 전이 됨 — 이 테스트가 공허하지 않다는 확인(시간대가 실제로 바뀌었는지)
            expect(new Date("2026-09-26").getDate()).toBe(25);
            expect(formatEntryDate("2026-09-26")).toBe("09/26");
        } finally {
            if (original === undefined) delete env.TZ;
            else env.TZ = original;
        }
    });

    it("시각이 붙은 ISO 문자열도 날짜 부분만 본다", () => {
        expect(formatEntryDate("2026-09-26T13:45:00")).toBe("09/26");
    });

    it.each([undefined, null, "", "not-a-date"])("날짜가 아니면(%s) 빈 문자열", (value) => {
        expect(formatEntryDate(value)).toBe("");
    });
});

describe("iconCenterY", () => {
    // 축 길이 200px → 점수 1점 = 2px
    it("눈금 값보다 낮은 점수 자리면 아래로(y가 커짐), 높은 점수 자리면 위로 옮긴다", () => {
        expect(iconCenterY({ y: 150, height: 200, value: 25, at: 12.5 })).toBe(175);
        expect(iconCenterY({ y: 50, height: 200, value: 75, at: 87.5 })).toBe(25);
    });

    it("같은 점수면 눈금 위치 그대로", () => {
        expect(iconCenterY({ y: 150, height: 200, value: 25, at: 25 })).toBe(150);
    });

    it("축 길이를 모르면(undefined·NaN·무한대) 눈금 위치 그대로", () => {
        expect(iconCenterY({ y: 80, height: undefined, value: 25, at: 12.5 })).toBe(80);
        expect(iconCenterY({ y: 80, height: NaN, value: 25, at: 12.5 })).toBe(80);
        expect(iconCenterY({ y: 80, height: Infinity, value: 25, at: 12.5 })).toBe(80);
    });
});
