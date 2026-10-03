import { useEffect, useId, useRef, useState } from "react";
import Dialog from "../../components/common/Dialog";
import {
    MIN_ZOOM,
    MAX_ZOOM,
    hasValidSize,
    initialCrop,
    panBy,
    zoomTo,
    zoomByWheel,
    cropByKey,
    imageLayout,
} from "./profileImageCrop";
import { renderCroppedBlob } from "./profileImageCanvas";
import { IMAGE_FILE_ERRORS } from "./profileImageFile";
import { PROFILE_COPY } from "./profileSettingsView";

// 편집 틀의 한 변(px) — 모달 안쪽 폭이 가장 좁은 화면(320px)에서도 들어가는 크기. 서버로 보내는 이미지는 별개로 512×512
export const CROP_VIEW_SIZE = 240;

const BUTTON_BASE =
    "min-h-[44px] flex-1 rounded-lg border-2 px-4 text-sm font-semibold shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark/60 disabled:cursor-not-allowed disabled:opacity-60";

// 고른 사진을 원형 틀 안에서 끌어 옮기고 확대하는 편집 모달
// - 이동: 드래그(마우스·터치), 화살표 키 / 확대: 슬라이더, 마우스 휠, + − 키 — 어떤 경우에도 원이 사진으로 꽉 차도록 범위를 제한한다(좌표 계산은 profileImageCrop.js)
// - [적용하기]를 누르면 틀 안의 영역을 512×512 JPEG로 만들어 onApply(blob)로 넘긴다. 올리는 일(요청·오류)은 부모가 맡고 busy·errorMessage로 알려 준다
// - 핀치 확대는 첫 버전에서 슬라이더로 대신한다
const ProfileImageCropper = ({ file, busy = false, errorMessage = null, onApply, onCancel }) => {
    const titleId = useId();
    const hintId = useId();
    const viewRef = useRef(null);
    const imageRef = useRef(null);
    const dragRef = useRef(null);

    const [src, setSrc] = useState(null);
    const [natural, setNatural] = useState(null); // { width, height } — 사진이 불러와지면
    const [crop, setCrop] = useState(null);
    const [loadFailed, setLoadFailed] = useState(false);
    const [renderError, setRenderError] = useState(null);

    // 고른 파일을 화면에 띄울 주소로 — 닫히면 해제
    useEffect(() => {
        const url = URL.createObjectURL(file);
        setSrc(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const handleLoad = (event) => {
        const { naturalWidth: width, naturalHeight: height } = event.currentTarget;
        if (!hasValidSize(width, height)) {
            setLoadFailed(true);
            return;
        }
        setNatural({ width, height });
        setCrop(initialCrop(width, height));
    };

    const ready = Boolean(natural && crop) && !loadFailed;

    // 마우스 휠 확대 — 스크롤을 막아야 해서 passive가 아닌 리스너를 직접 단다(React의 onWheel은 passive라 preventDefault가 안 됨)
    useEffect(() => {
        const element = viewRef.current;
        if (!element || !natural) return undefined;

        const onWheel = (event) => {
            event.preventDefault();
            setCrop((current) => (current ? zoomByWheel(current, event.deltaY, natural.width, natural.height) : current));
        };
        element.addEventListener("wheel", onWheel, { passive: false });
        return () => element.removeEventListener("wheel", onWheel);
    }, [natural]);

    const handlePointerDown = (event) => {
        if (!ready || busy) return;
        if (event.pointerType === "mouse" && event.button !== 0) return;
        event.currentTarget.setPointerCapture?.(event.pointerId);
        dragRef.current = { x: event.clientX, y: event.clientY };
    };

    const handlePointerMove = (event) => {
        const drag = dragRef.current;
        if (!drag || !natural) return;
        const dx = event.clientX - drag.x;
        const dy = event.clientY - drag.y;
        dragRef.current = { x: event.clientX, y: event.clientY };
        setCrop((current) => (current ? panBy(current, dx, dy, natural.width, natural.height, CROP_VIEW_SIZE) : current));
    };

    const endDrag = () => {
        dragRef.current = null;
    };

    const handleKeyDown = (event) => {
        if (!ready || busy) return;
        const next = cropByKey(crop, event.key, natural.width, natural.height, CROP_VIEW_SIZE, { shift: event.shiftKey });
        if (!next) return; // Tab·Escape 등은 그대로 — 모달이 처리
        event.preventDefault();
        setCrop(next);
    };

    const handleZoomChange = (event) => {
        if (!natural) return;
        setCrop((current) => zoomTo(current, Number(event.target.value), natural.width, natural.height));
    };

    const handleApply = async () => {
        if (!ready || busy) return;
        setRenderError(null);
        let blob;
        try {
            blob = await renderCroppedBlob(imageRef.current, crop);
        } catch {
            setRenderError(PROFILE_COPY.cropRenderFailed);
            return;
        }
        onApply(blob);
    };

    const layout = ready ? imageLayout(crop, natural.width, natural.height, CROP_VIEW_SIZE) : null;
    const message = loadFailed ? IMAGE_FILE_ERRORS.load : (renderError ?? errorMessage);

    return (
        <Dialog open onClose={onCancel} busy={busy} labelledBy={titleId} describedBy={hintId} initialFocusRef={viewRef}>
            <h2 id={titleId} className="text-lg font-semibold text-textPrimary">
                {PROFILE_COPY.cropTitle}
            </h2>
            {/* whitespace-pre-line: 두 문장 사이의 줄바꿈(\n)을 그대로 보여준다 — 없으면 HTML이 \n을 공백 하나로 합쳐 한 줄로 이어진다 */}
            <p id={hintId} className="mt-1 whitespace-pre-line text-sm text-textSecondary">
                {`${PROFILE_COPY.cropHint}\n${PROFILE_COPY.cropKeyHint}`}
            </p>

            {/* 편집 틀 — 사진 위에 원형 구멍이 뚫린 어두운 막을 덮어 어디가 잘리는지 보여준다 */}
            <div
                ref={viewRef}
                role="group"
                aria-label={PROFILE_COPY.cropViewLabel}
                aria-describedby={hintId}
                tabIndex={0}
                onKeyDown={handleKeyDown}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                style={{ width: CROP_VIEW_SIZE, height: CROP_VIEW_SIZE, touchAction: "none" }}
                className={`relative mx-auto mt-4 select-none overflow-hidden rounded-lg bg-primary-light/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark/60 ${
                    ready && !busy ? "cursor-grab active:cursor-grabbing" : ""
                }`}
            >
                {src && !loadFailed && (
                    <img
                        ref={imageRef}
                        src={src}
                        alt=""
                        draggable={false}
                        onLoad={handleLoad}
                        onError={() => setLoadFailed(true)}
                        className="absolute max-w-none"
                        style={
                            layout
                                ? { width: layout.width, height: layout.height, left: layout.left, top: layout.top }
                                : { opacity: 0 }
                        }
                    />
                )}
                {!ready && !loadFailed && (
                    <p className="absolute inset-0 flex items-center justify-center text-sm text-textSecondary">
                        {PROFILE_COPY.cropLoading}
                    </p>
                )}
                {ready && (
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_999px_rgba(0,0,0,0.45)] ring-2 ring-white/80"
                    />
                )}
            </div>

            <div className="mt-4 flex items-center gap-3">
                <label htmlFor={`${hintId}-zoom`} className="shrink-0 text-sm text-textSecondary">
                    {PROFILE_COPY.cropZoomLabel}
                </label>
                <input
                    id={`${hintId}-zoom`}
                    type="range"
                    min={MIN_ZOOM}
                    max={MAX_ZOOM}
                    step={0.01}
                    value={crop?.zoom ?? MIN_ZOOM}
                    disabled={!ready || busy}
                    onChange={handleZoomChange}
                    aria-valuetext={`${Math.round((crop?.zoom ?? MIN_ZOOM) * 100)}%`}
                    className="w-full accent-primary-dark disabled:opacity-50"
                />
            </div>

            {message && (
                <p role="alert" className="mt-3 text-sm text-red-500">
                    {message}
                </p>
            )}

            <div className="mt-6 flex gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={busy}
                    className={`${BUTTON_BASE} border-primary-dark/40 bg-white/60 text-textPrimary hover:bg-white/90 hover:shadow-md`}
                >
                    {PROFILE_COPY.cropCancel}
                </button>
                <button
                    type="button"
                    onClick={handleApply}
                    disabled={!ready || busy}
                    className={`${BUTTON_BASE} border-primary-dark/60 bg-primary-dark text-white hover:bg-primary-dark/90 disabled:cursor-wait`}
                >
                    {busy ? PROFILE_COPY.cropApplying : PROFILE_COPY.cropApply}
                </button>
            </div>
        </Dialog>
    );
};

export default ProfileImageCropper;
