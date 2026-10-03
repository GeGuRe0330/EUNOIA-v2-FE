import { OUTPUT_SIZE, sourceRect } from "./profileImageCrop";

// 편집이 끝난 영역을 OUTPUT_SIZE(512)×OUTPUT_SIZE 정사각 JPEG로 그려 서버로 보낼 파일(Blob)을 만든다
// - 어떤 원본(JPEG·PNG·WebP)이든 JPEG로 내보내 서버가 JPEG·PNG만 읽어도 되게 한다(서버 WebP 의존성 회피)
// - 투명한 PNG는 JPEG가 투명을 지원하지 않아 검게 나오므로 흰 배경을 먼저 칠한다
// - 휴대폰 사진의 회전 정보(EXIF 방향)는 브라우저가 <img>에 이미 반영해 naturalWidth/Height와 drawImage 모두 회전된 모습 기준이다
// 캔버스는 jsdom에서 동작하지 않아 이 파일은 단위 테스트 대신 브라우저에서 확인한다(좌표는 profileImageCrop.js가 테스트)
export const renderCroppedBlob = (image, crop) =>
    new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas");
        canvas.width = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;
        const context = canvas.getContext("2d");
        if (!context) {
            reject(new Error("canvas unavailable"));
            return;
        }

        const { sx, sy, side } = sourceRect(crop, image.naturalWidth, image.naturalHeight);
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
        context.imageSmoothingQuality = "high";
        context.drawImage(image, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
            "image/jpeg",
            0.9
        );
    });
