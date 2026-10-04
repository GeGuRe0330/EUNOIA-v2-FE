import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderCroppedBlob } from "./profileImageCanvas";
import { OUTPUT_SIZE, initialCrop, sourceRect } from "./profileImageCrop";

// jsdom에는 캔버스가 없어 그리기 API를 가짜로 대체하고 "무엇을 어떤 순서로 그리는지"를 확인한다.
// 실제 픽셀(회전·투명 PNG·화질)은 브라우저에서만 확인할 수 있다.
describe("renderCroppedBlob", () => {
    let calls;
    let toBlobResult;
    let contextAvailable;
    let canvasSize;

    const image = { naturalWidth: 2000, naturalHeight: 1500 };

    beforeEach(() => {
        calls = [];
        toBlobResult = new Blob(["jpeg"], { type: "image/jpeg" });
        contextAvailable = true;
        canvasSize = null;

        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function () {
            canvasSize = { width: this.width, height: this.height };
            if (!contextAvailable) return null;
            return {
                set fillStyle(v) { calls.push(["fillStyle", v]); },
                set imageSmoothingQuality(v) { calls.push(["imageSmoothingQuality", v]); },
                fillRect: (...a) => calls.push(["fillRect", ...a]),
                drawImage: (...a) => calls.push(["drawImage", ...a]),
            };
        });
        vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback, type, quality) => {
            calls.push(["toBlob", type, quality]);
            callback(toBlobResult);
        });
    });

    afterEach(() => vi.restoreAllMocks());

    it("정해진 크기(OUTPUT_SIZE)의 정사각 캔버스에 그린다", async () => {
        await renderCroppedBlob(image, initialCrop(2000, 1500));
        expect(canvasSize).toEqual({ width: OUTPUT_SIZE, height: OUTPUT_SIZE });
        expect(OUTPUT_SIZE).toBe(512);
    });

    it("흰 배경을 먼저 칠한 뒤 사진을 그린다(투명 PNG가 검게 나오지 않도록)", async () => {
        await renderCroppedBlob(image, initialCrop(2000, 1500));
        const names = calls.map(([name]) => name);
        expect(calls.find(([n]) => n === "fillStyle")[1]).toBe("#ffffff");
        expect(names.indexOf("fillRect")).toBeGreaterThanOrEqual(0);
        expect(names.indexOf("fillRect")).toBeLessThan(names.indexOf("drawImage"));
        expect(calls.find(([n]) => n === "fillRect").slice(1)).toEqual([0, 0, OUTPUT_SIZE, OUTPUT_SIZE]);
    });

    it("편집 틀 안의 영역(sourceRect)만 잘라 캔버스 전체에 그린다", async () => {
        const crop = { zoom: 2, center: { x: 1000, y: 750 } };
        await renderCroppedBlob(image, crop);
        const { sx, sy, side } = sourceRect(crop, 2000, 1500);
        expect(calls.find(([n]) => n === "drawImage")).toEqual([
            "drawImage", image, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE,
        ]);
    });

    it("JPEG(품질 0.9)로 내보내고 만든 파일을 돌려준다", async () => {
        const blob = await renderCroppedBlob(image, initialCrop(2000, 1500));
        expect(calls.find(([n]) => n === "toBlob")).toEqual(["toBlob", "image/jpeg", 0.9]);
        expect(blob).toBe(toBlobResult);
    });

    it("캔버스를 쓸 수 없으면 실패한다", async () => {
        contextAvailable = false;
        await expect(renderCroppedBlob(image, initialCrop(2000, 1500))).rejects.toThrow();
    });

    it("파일 만들기가 실패(null)하면 실패한다", async () => {
        toBlobResult = null;
        await expect(renderCroppedBlob(image, initialCrop(2000, 1500))).rejects.toThrow();
    });
});
