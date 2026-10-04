import { describe, expect, it } from "vitest";
import {
    MIN_ZOOM,
    MAX_ZOOM,
    clampZoom,
    hasValidSize,
    visibleSide,
    screenScale,
    clampCenter,
    initialCrop,
    panBy,
    zoomTo,
    zoomByWheel,
    cropByKey,
    imageLayout,
    sourceRect,
} from "./profileImageCrop";

const VIEW = 256;
// 가로형(4:3), 세로형(3:4), 정사각
const LANDSCAPE = { w: 2000, h: 1500 };
const PORTRAIT = { w: 1500, h: 2000 };
const SQUARE = { w: 1000, h: 1000 };

describe("hasValidSize", () => {
    it.each([[100, 100, true], [0, 100, false], [100, 0, false], [-1, 5, false], [NaN, 5, false], [Infinity, 5, false]])(
        "%s x %s → %s",
        (w, h, expected) => expect(hasValidSize(w, h)).toBe(expected)
    );
});

describe("clampZoom", () => {
    it("최소·최대 안으로 가둔다", () => {
        expect(clampZoom(0.2)).toBe(MIN_ZOOM);
        expect(clampZoom(99)).toBe(MAX_ZOOM);
        expect(clampZoom(2.5)).toBe(2.5);
    });

    it("숫자가 아니면 최소 확대", () => {
        expect(clampZoom(NaN)).toBe(MIN_ZOOM);
        expect(clampZoom(undefined)).toBe(MIN_ZOOM);
    });
});

describe("visibleSide / screenScale", () => {
    it("확대 1에서는 짧은 변이 틀에 꼭 맞는다 — 가로형·세로형 모두", () => {
        expect(visibleSide(LANDSCAPE.w, LANDSCAPE.h, 1)).toBe(1500);
        expect(visibleSide(PORTRAIT.w, PORTRAIT.h, 1)).toBe(1500);
        expect(screenScale(LANDSCAPE.w, LANDSCAPE.h, 1, VIEW) * 1500).toBeCloseTo(VIEW);
    });

    it("확대하면 비치는 영역은 줄고 화면 배율은 커진다", () => {
        expect(visibleSide(SQUARE.w, SQUARE.h, 2)).toBe(500);
        expect(screenScale(SQUARE.w, SQUARE.h, 2, VIEW)).toBeCloseTo((VIEW / 1000) * 2);
    });

    it("범위를 벗어난 확대 값은 가둔 값으로 계산한다", () => {
        expect(visibleSide(SQUARE.w, SQUARE.h, 100)).toBe(1000 / MAX_ZOOM);
    });
});

describe("clampCenter", () => {
    it("확대 1의 가로형: 짧은 변(세로) 방향은 움직일 수 없고 긴 변(가로)으로만 움직인다", () => {
        const { w, h } = LANDSCAPE;
        const half = 1500 / 2;
        expect(clampCenter({ x: 0, y: 0 }, w, h, 1)).toEqual({ x: half, y: half });
        expect(clampCenter({ x: 9999, y: 9999 }, w, h, 1)).toEqual({ x: w - half, y: h - half });
        // 세로는 half(750)와 h - half(750)이 같아 한 점뿐
        expect(clampCenter({ x: 1000, y: 100 }, w, h, 1).y).toBe(750);
    });

    it("확대 1의 세로형: 가로 방향이 고정된다", () => {
        expect(clampCenter({ x: 0, y: 1000 }, PORTRAIT.w, PORTRAIT.h, 1).x).toBe(750);
    });

    it("안쪽에 있는 값은 그대로 둔다", () => {
        expect(clampCenter({ x: 500, y: 500 }, SQUARE.w, SQUARE.h, 2)).toEqual({ x: 500, y: 500 });
    });

    it("경계 정확히(비치는 영역이 가장자리에 닿음)는 허용한다", () => {
        expect(clampCenter({ x: 250, y: 750 }, SQUARE.w, SQUARE.h, 2)).toEqual({ x: 250, y: 750 });
        expect(clampCenter({ x: 249, y: 751 }, SQUARE.w, SQUARE.h, 2)).toEqual({ x: 250, y: 750 });
    });
});

describe("initialCrop", () => {
    it("최소 확대 + 이미지 한가운데", () => {
        expect(initialCrop(2000, 1500)).toEqual({ zoom: MIN_ZOOM, center: { x: 1000, y: 750 } });
    });
});

describe("panBy", () => {
    const crop = { zoom: 2, center: { x: 500, y: 500 } };

    it("오른쪽으로 끌면 이미지가 손을 따라 오른쪽으로 — center는 왼쪽(작은 x)으로", () => {
        const next = panBy(crop, 64, 0, SQUARE.w, SQUARE.h, VIEW);
        // 배율 = (256/1000)*2 = 0.512 → 64px = 125 원본 px
        expect(next.center.x).toBeCloseTo(500 - 64 / 0.512);
        expect(next.center.y).toBe(500);
    });

    it("아래로 끌면 center는 위쪽(작은 y)으로", () => {
        expect(panBy(crop, 0, 32, SQUARE.w, SQUARE.h, VIEW).center.y).toBeLessThan(500);
    });

    it("끌어도 비치는 영역이 원본 밖으로 나가지 않는다 — 빈 영역이 생기지 않는다", () => {
        const far = panBy(crop, 100000, 100000, SQUARE.w, SQUARE.h, VIEW);
        expect(far.center).toEqual({ x: 250, y: 250 });
        const farOther = panBy(crop, -100000, -100000, SQUARE.w, SQUARE.h, VIEW);
        expect(farOther.center).toEqual({ x: 750, y: 750 });
    });

    it("확대 1의 정사각은 어디로 끌어도 움직이지 않는다", () => {
        const start = initialCrop(SQUARE.w, SQUARE.h);
        expect(panBy(start, 50, -50, SQUARE.w, SQUARE.h, VIEW)).toEqual(start);
    });

    it("확대 값은 바꾸지 않는다", () => {
        expect(panBy(crop, 10, 10, SQUARE.w, SQUARE.h, VIEW).zoom).toBe(2);
    });
});

describe("zoomTo / zoomByWheel", () => {
    it("확대하면 zoom만 바뀌고 center는 유지된다(안쪽이면)", () => {
        const next = zoomTo({ zoom: 1, center: { x: 500, y: 500 } }, 2, SQUARE.w, SQUARE.h);
        expect(next).toEqual({ zoom: 2, center: { x: 500, y: 500 } });
    });

    it("축소하면 비치는 영역이 커져 center가 다시 가둬진다 — 가장자리에서 축소해도 빈 영역이 없다", () => {
        const atEdge = { zoom: 4, center: { x: 125, y: 125 } }; // 한 변 250의 절반
        const next = zoomTo(atEdge, 1, SQUARE.w, SQUARE.h);
        expect(next.center).toEqual({ x: 500, y: 500 });
    });

    it("범위 밖 확대 값은 가둔다", () => {
        expect(zoomTo(initialCrop(1000, 1000), 50, 1000, 1000).zoom).toBe(MAX_ZOOM);
        expect(zoomTo(initialCrop(1000, 1000), 0, 1000, 1000).zoom).toBe(MIN_ZOOM);
    });

    it("휠을 위로 굴리면 확대, 아래로 굴리면 축소", () => {
        const crop = { zoom: 2, center: { x: 500, y: 500 } };
        expect(zoomByWheel(crop, -100, 1000, 1000).zoom).toBeGreaterThan(2);
        expect(zoomByWheel(crop, 100, 1000, 1000).zoom).toBeLessThan(2);
    });

    it("휠로도 한계를 넘지 않는다", () => {
        expect(zoomByWheel({ zoom: MAX_ZOOM, center: { x: 500, y: 500 } }, -10000, 1000, 1000).zoom).toBe(MAX_ZOOM);
        expect(zoomByWheel({ zoom: MIN_ZOOM, center: { x: 500, y: 500 } }, 10000, 1000, 1000).zoom).toBe(MIN_ZOOM);
    });
});

describe("cropByKey", () => {
    const crop = { zoom: 2, center: { x: 500, y: 500 } };
    const move = (key, options) => cropByKey(crop, key, SQUARE.w, SQUARE.h, VIEW, options);

    it("화살표는 이미지를 그 방향으로 움직인다(center는 반대)", () => {
        expect(move("ArrowRight").center.x).toBeLessThan(500);
        expect(move("ArrowLeft").center.x).toBeGreaterThan(500);
        expect(move("ArrowDown").center.y).toBeLessThan(500);
        expect(move("ArrowUp").center.y).toBeGreaterThan(500);
    });

    it("Shift를 누르면 더 크게 움직인다", () => {
        const small = 500 - move("ArrowRight").center.x;
        const big = 500 - move("ArrowRight", { shift: true }).center.x;
        expect(big).toBeCloseTo(small * 4);
    });

    it("+/-는 확대/축소", () => {
        expect(move("+").zoom).toBeGreaterThan(2);
        expect(move("=").zoom).toBeGreaterThan(2);
        expect(move("-").zoom).toBeLessThan(2);
    });

    it("관계없는 키는 null — 호출한 쪽이 기본 동작(Tab 이동 등)을 막지 않도록", () => {
        expect(move("Tab")).toBeNull();
        expect(move("a")).toBeNull();
    });
});

describe("imageLayout", () => {
    it("확대 1의 가로형: 높이가 틀과 같고 가로는 넘치며 가운데가 틀의 가운데에 온다", () => {
        const crop = initialCrop(LANDSCAPE.w, LANDSCAPE.h);
        const layout = imageLayout(crop, LANDSCAPE.w, LANDSCAPE.h, VIEW);
        expect(layout.height).toBeCloseTo(VIEW);
        expect(layout.width).toBeCloseTo((VIEW * 2000) / 1500);
        expect(layout.left + layout.width / 2).toBeCloseTo(VIEW / 2);
        expect(layout.top).toBeCloseTo(0);
    });

    it("이미지는 어떤 상태에서도 틀을 빈틈없이 덮는다", () => {
        for (const size of [LANDSCAPE, PORTRAIT, SQUARE]) {
            for (const zoom of [1, 1.7, 4]) {
                for (const center of [{ x: 0, y: 0 }, { x: size.w, y: size.h }, { x: size.w / 2, y: size.h / 2 }]) {
                    const clamped = { zoom, center: clampCenter(center, size.w, size.h, zoom) };
                    const l = imageLayout(clamped, size.w, size.h, VIEW);
                    expect(l.left).toBeLessThanOrEqual(1e-6);
                    expect(l.top).toBeLessThanOrEqual(1e-6);
                    expect(l.left + l.width).toBeGreaterThanOrEqual(VIEW - 1e-6);
                    expect(l.top + l.height).toBeGreaterThanOrEqual(VIEW - 1e-6);
                }
            }
        }
    });
});

describe("sourceRect", () => {
    it("확대 1의 가로형 가운데: 가운데의 정사각을 잘라 낸다", () => {
        expect(sourceRect(initialCrop(2000, 1500), 2000, 1500)).toEqual({ sx: 250, sy: 0, side: 1500 });
    });

    it("확대하면 더 작은 영역을 잘라 낸다", () => {
        const rect = sourceRect({ zoom: 2, center: { x: 500, y: 500 } }, 1000, 1000);
        expect(rect).toEqual({ sx: 250, sy: 250, side: 500 });
    });

    it("항상 원본 안에 있다 — 가장자리 center도", () => {
        for (const size of [LANDSCAPE, PORTRAIT, SQUARE]) {
            for (const zoom of [1, 3, 4]) {
                const r = sourceRect({ zoom, center: { x: -500, y: 99999 } }, size.w, size.h);
                expect(r.sx).toBeGreaterThanOrEqual(-1e-9);
                expect(r.sy).toBeGreaterThanOrEqual(-1e-9);
                expect(r.sx + r.side).toBeLessThanOrEqual(size.w + 1e-9);
                expect(r.sy + r.side).toBeLessThanOrEqual(size.h + 1e-9);
            }
        }
    });

    it("편집 화면(imageLayout)에서 틀에 보이는 영역과 같은 곳을 잘라 낸다", () => {
        const crop = { zoom: 2.3, center: { x: 800, y: 600 } };
        const { w, h } = LANDSCAPE;
        const clamped = { zoom: crop.zoom, center: clampCenter(crop.center, w, h, crop.zoom) };
        const layout = imageLayout(clamped, w, h, VIEW);
        const rect = sourceRect(clamped, w, h);
        const scale = layout.width / w;
        // 틀의 왼쪽 위(0,0)에 해당하는 원본 좌표 = (0 - left) / scale
        expect(rect.sx).toBeCloseTo(-layout.left / scale);
        expect(rect.sy).toBeCloseTo(-layout.top / scale);
        expect(rect.side * scale).toBeCloseTo(VIEW);
    });
});
