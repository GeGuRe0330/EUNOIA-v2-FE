// 프로필 이미지 크롭 편집의 좌표 계산 — 화면(편집 모달)과 분리한 순수 함수
//
// 모델: 원형 틀(한 변 viewSize px의 정사각 안)에 이미지를 비춘다.
//  - zoom: 1이면 이미지의 **짧은 변이 틀에 꼭 맞는 크기**(빈 영역이 생기지 않는 최소 확대), 커질수록 확대
//  - center: 틀의 한가운데에 놓인 **원본 이미지 위의 점**(원본 픽셀 좌표). 이동은 이 점을 옮기는 것
//  - 틀에 비치는 원본 영역은 한 변이 min(가로, 세로) / zoom 인 정사각이고, 그 영역이 원본 밖으로 나가지 않게 center를 가둔다

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;
// 서버로 보내는 정사각 이미지의 한 변(px). 프로필 설정의 아바타가 160px이라 2~3배 화면에서는 320~480px이 필요해 512로 둔다(256이면 고해상도 화면에서 흐려짐)
export const OUTPUT_SIZE = 512;
export const KEY_PAN_STEP = 12; // 화살표 키 한 번의 이동(화면 px)
export const KEY_ZOOM_STEP = 0.1;

const isPositive = (n) => Number.isFinite(n) && n > 0;

export const hasValidSize = (width, height) => isPositive(width) && isPositive(height);

export const clampZoom = (zoom) => {
    if (!Number.isFinite(zoom)) return MIN_ZOOM;
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
};

// 틀에 비치는 원본 영역의 한 변(원본 px)
export const visibleSide = (width, height, zoom) => Math.min(width, height) / clampZoom(zoom);

// 원본 1px이 화면에서 차지하는 크기(화면 px / 원본 px)
export const screenScale = (width, height, zoom, viewSize) => (viewSize / Math.min(width, height)) * clampZoom(zoom);

// 비치는 영역이 원본 밖으로 나가지 않도록 center를 가둔다
export const clampCenter = (center, width, height, zoom) => {
    const half = visibleSide(width, height, zoom) / 2;
    const clamp = (value, size) => Math.min(size - half, Math.max(half, value));
    return { x: clamp(center.x, width), y: clamp(center.y, height) };
};

// 처음 상태 — 최소 확대, 이미지의 한가운데
export const initialCrop = (width, height) => ({ zoom: MIN_ZOOM, center: { x: width / 2, y: height / 2 } });

// 화면에서 (dx, dy)px 끌었을 때 — 이미지가 손을 따라 움직이므로 center는 반대 방향으로
export const panBy = (crop, dx, dy, width, height, viewSize) => {
    const scale = screenScale(width, height, crop.zoom, viewSize);
    return {
        zoom: crop.zoom,
        center: clampCenter({ x: crop.center.x - dx / scale, y: crop.center.y - dy / scale }, width, height, crop.zoom),
    };
};

// 확대 비율을 바꾼다 — 틀의 가운데를 기준으로 하되, 줄어들면 비치는 영역이 커지므로 center를 다시 가둔다
export const zoomTo = (crop, zoom, width, height) => {
    const next = clampZoom(zoom);
    return { zoom: next, center: clampCenter(crop.center, width, height, next) };
};

// 마우스 휠 — 위로 굴리면(deltaY < 0) 확대, 부드럽게 지수로
export const zoomByWheel = (crop, deltaY, width, height) =>
    zoomTo(crop, crop.zoom * Math.exp(-deltaY * 0.0015), width, height);

// 화살표 키·+/- 키 → 새 crop. 해당하지 않는 키는 null(호출한 쪽이 기본 동작을 막지 않도록)
export const cropByKey = (crop, key, width, height, viewSize, { shift = false } = {}) => {
    const step = shift ? KEY_PAN_STEP * 4 : KEY_PAN_STEP;
    // 화살표 방향 = 이미지가 움직이는 방향(손으로 끄는 것과 같음)
    if (key === "ArrowLeft") return panBy(crop, -step, 0, width, height, viewSize);
    if (key === "ArrowRight") return panBy(crop, step, 0, width, height, viewSize);
    if (key === "ArrowUp") return panBy(crop, 0, -step, width, height, viewSize);
    if (key === "ArrowDown") return panBy(crop, 0, step, width, height, viewSize);
    if (key === "+" || key === "=") return zoomTo(crop, crop.zoom + KEY_ZOOM_STEP, width, height);
    if (key === "-" || key === "_") return zoomTo(crop, crop.zoom - KEY_ZOOM_STEP, width, height);
    return null;
};

// 편집 화면에서 <img>를 놓을 위치·크기(틀의 왼쪽 위가 원점) — center가 틀의 한가운데에 오도록
export const imageLayout = (crop, width, height, viewSize) => {
    const scale = screenScale(width, height, crop.zoom, viewSize);
    return {
        width: width * scale,
        height: height * scale,
        left: viewSize / 2 - crop.center.x * scale,
        top: viewSize / 2 - crop.center.y * scale,
    };
};

// 캔버스에 그릴 때 쓸 원본 영역(drawImage의 sx, sy, sWidth, sHeight)
export const sourceRect = (crop, width, height) => {
    const side = visibleSide(width, height, crop.zoom);
    const center = clampCenter(crop.center, width, height, crop.zoom);
    return { sx: center.x - side / 2, sy: center.y - side / 2, side };
};
