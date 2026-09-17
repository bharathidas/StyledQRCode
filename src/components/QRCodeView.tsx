import {
    CSSProperties,
    Fragment,
    KeyboardEvent,
    MouseEvent,
    ReactElement,
    useCallback,
    useEffect,
    useRef,
    useState,
    useSyncExternalStore
} from "react";
import classNames from "classnames";
import QRCodeStyling, { FileExtension } from "qr-code-styling";

import { buildOptions, FrameSpec, frameFontFamily, frameGeometry, isSideFrame, StyleSettings } from "../utils/options";
import { blobToBase64, copyImage, downloadBlob, exportImage, MIME, printImage } from "../utils/export";
import { isScannable } from "../utils/scan";
import { formatRemaining } from "../utils/settings";
import { useLatest } from "../utils/useLatest";

export interface ToolbarButton {
    key: string;
    label: string;
    onClick: () => Promise<void> | void;
}

export interface ToolbarSpec {
    png: boolean;
    svg: boolean;
    jpeg: boolean;
    webp: boolean;
    copy: boolean;
    print: boolean;
    save: boolean;
    fileName: string;
    buttonClass: string;
    position: "top" | "bottom";
    labelDownload: string;
    labelCopy: string;
    labelCopied: string;
    labelPrint: string;
    labelSave: string;
    labelSaved: string;
    /** Extra buttons supplied by the container (ZIP, sheet exports). */
    extra?: ToolbarButton[];
}

export interface Base64Spec {
    format: FileExtension;
    dataUri: boolean;
    /** Milliseconds to wait after the last change before writing. */
    debounce: number;
    onSaved: (value: string) => void;
}

export interface ExpirySpec {
    at: Date;
    label: string;
    expiredLabel: string;
    blur: boolean;
    onExpire?: () => void;
}

export interface QRCodeViewProps {
    data: string;
    settings: StyleSettings;
    frame?: FrameSpec;
    caption?: string;
    ariaLabel?: string;
    toolbar?: ToolbarSpec;
    checkScannability: boolean;
    scanWarning?: string;
    onScanResult?: (scannable: boolean) => void;
    /** Runs after every render with the encoded value and the scannability result (undefined when not checked). */
    onRender?: (value: string, scannable: boolean | undefined) => void;
    base64?: Base64Spec;
    expiry?: ExpirySpec;
    onClick?: () => void;
    sizeMode?: "fixed" | "fit";
    /** Render only once the widget scrolls into view. */
    lazy?: boolean;
    /** Message shown instead of a code (for example when the payload is too long). */
    notice?: string;
    className?: string;
    style?: CSSProperties;
    tabIndex?: number;
}

/** One-second clock for the countdown, exposed as an external store. */
const subscribeClock = (onTick: () => void): (() => void) => {
    const id = setInterval(onTick, 1000);
    return () => clearInterval(id);
};
const subscribeNever = (): (() => void) => () => undefined;
const getSecond = (): number => Math.floor(Date.now() / 1000);

const DOWNLOADS: Array<{
    key: keyof Pick<ToolbarSpec, "png" | "svg" | "jpeg" | "webp">;
    extension: FileExtension;
    label: string;
}> = [
    { key: "png", extension: "png", label: "PNG" },
    { key: "svg", extension: "svg", label: "SVG" },
    { key: "jpeg", extension: "jpeg", label: "JPEG" },
    { key: "webp", extension: "webp", label: "WEBP" }
];

/** Tracks whether an element has ever been on screen (sticky), for lazy rendering. */
function useEverVisible(ref: { current: HTMLElement | null }, enabled: boolean): boolean {
    const [visible, setVisible] = useState(!enabled);
    useEffect(() => {
        if (!enabled || visible) {
            return;
        }
        const element = ref.current;
        if (!element || typeof IntersectionObserver === "undefined") {
            setTimeout(() => setVisible(true), 0);
            return;
        }
        const observer = new IntersectionObserver(
            entries => {
                if (entries.some(entry => entry.isIntersecting)) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "200px" }
        );
        observer.observe(element);
        return () => observer.disconnect();
    }, [enabled, visible, ref]);
    return visible;
}

/** Renders one QR code with its frame, caption, countdown, warnings and toolbar. */
export function QRCodeView(props: QRCodeViewProps): ReactElement {
    const {
        data,
        settings,
        frame,
        caption,
        ariaLabel,
        toolbar,
        checkScannability,
        scanWarning,
        base64,
        expiry,
        onClick,
        notice,
        sizeMode = "fixed",
        lazy = false
    } = props;

    const rootRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const qrRef = useRef<QRCodeStyling | undefined>(undefined);
    const visible = useEverVisible(rootRef, lazy);
    // Results are keyed by the render they belong to, so a new render hides stale ones without a reset.
    const [scan, setScan] = useState<{ key: string; ok: boolean | undefined } | undefined>(undefined);
    const [failure, setFailure] = useState<{ key: string; message: string } | undefined>(undefined);
    const [busy, setBusy] = useState(false);
    const [flash, setFlash] = useState<"copied" | "saved" | undefined>(undefined);

    // Callbacks live in refs so a new function identity never re-renders the code.
    const onScanResultRef = useLatest(props.onScanResult);
    const onRenderRef = useLatest(props.onRender);
    const base64Ref = useLatest(base64);
    const frameRef = useLatest(frame);
    const onExpireRef = useLatest(expiry?.onExpire);

    const options = buildOptions(data, settings);
    const size = options.width ?? settings.size;
    const optionsKey = JSON.stringify(options);
    const frameKey = frame ? JSON.stringify(frame) : "";
    const renderKey = `${optionsKey}|${frameKey}|${checkScannability}|${base64?.format}|${base64?.dataUri}`;
    const active = Boolean(data) && visible && !notice;

    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }
        if (!active) {
            container.innerHTML = "";
            qrRef.current = undefined;
            return;
        }

        let qr: QRCodeStyling;
        try {
            // Always a fresh instance: the library's update() merges into the previous options (a removed
            // logo would stay) and keeps its export canvas at the first size, so exports would go stale.
            container.innerHTML = "";
            qr = new QRCodeStyling(options);
            qr.append(container);
            qrRef.current = qr;
        } catch (error) {
            const message = String(error);
            setTimeout(() => setFailure({ key: renderKey, message }), 0);
            return;
        }

        let cancelled = false;
        let saveTimer: ReturnType<typeof setTimeout> | undefined;
        const instance = qr;
        (async () => {
            let ok: boolean | undefined;
            if (checkScannability) {
                ok = await isScannable(instance);
                if (cancelled) {
                    return;
                }
                setScan({ key: renderKey, ok });
                if (ok !== undefined) {
                    onScanResultRef.current?.(ok);
                }
            }
            onRenderRef.current?.(data, ok);
            const save = base64Ref.current;
            if (save) {
                await new Promise<void>(resolve => {
                    saveTimer = setTimeout(resolve, Math.max(0, save.debounce));
                });
                if (cancelled) {
                    return;
                }
                const blob = await exportImage(instance, save.format, size, frameRef.current);
                if (cancelled || !blob) {
                    return;
                }
                const encoded = await blobToBase64(blob);
                if (!cancelled) {
                    save.onSaved(save.dataUri ? `data:${MIME[save.format]};base64,${encoded}` : encoded);
                }
            }
        })().catch(error => {
            if (!cancelled) {
                setFailure({ key: renderKey, message: String(error) });
            }
        });
        return () => {
            cancelled = true;
            if (saveTimer) {
                clearTimeout(saveTimer);
            }
        };
        // renderKey captures every value in options, frame and the export settings.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, data, renderKey, size]);

    const scanOk = active && checkScannability && scan?.key === renderKey ? scan.ok : undefined;
    const renderError = active && failure?.key === renderKey ? failure.message : undefined;

    // Expiry countdown: the clock is an external store that ticks every second while an expiry is set,
    // so the snapshot is fresh on every render and never stale after the expiry changes.
    const expiresAtMs = expiry?.at.getTime();
    const second = useSyncExternalStore(expiresAtMs === undefined ? subscribeNever : subscribeClock, getSecond);
    const remaining = expiresAtMs === undefined ? undefined : expiresAtMs - second * 1000;
    const expired = remaining !== undefined && remaining <= 0;
    const expireFiredFor = useRef<number | undefined>(undefined);
    useEffect(() => {
        if (expired && expireFiredFor.current !== expiresAtMs) {
            expireFiredFor.current = expiresAtMs;
            onExpireRef.current?.();
        }
    }, [expired, expiresAtMs, onExpireRef]);

    const run = useCallback(
        async (task: (qr: QRCodeStyling) => Promise<void>): Promise<void> => {
            const qr = qrRef.current;
            if (!qr || busy) {
                return;
            }
            setBusy(true);
            try {
                await task(qr);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error("Styled QR Code:", error);
            } finally {
                setBusy(false);
            }
        },
        [busy]
    );
    const showFlash = (kind: "copied" | "saved"): void => {
        setFlash(kind);
        setTimeout(() => setFlash(current => (current === kind ? undefined : current)), 1500);
    };

    const fileName = toolbar?.fileName?.trim() || "qr-code";
    const download = (extension: FileExtension): Promise<void> =>
        run(async qr => {
            const blob = await exportImage(qr, extension, size, frame);
            if (blob) {
                downloadBlob(blob, `${fileName}.${extension}`);
            }
        });
    const copy = (): Promise<void> =>
        run(async qr => {
            const blob = await exportImage(qr, "png", size, frame);
            if (blob && (await copyImage(blob))) {
                showFlash("copied");
            }
        });
    const print = (): Promise<void> =>
        run(async qr => {
            const blob = await exportImage(qr, "png", size, frame);
            if (blob) {
                printImage(blob, fileName);
            }
        });
    const saveNow = (): Promise<void> =>
        run(async qr => {
            const save = base64Ref.current;
            if (!save) {
                return;
            }
            const blob = await exportImage(qr, save.format, size, frame);
            if (blob) {
                const encoded = await blobToBase64(blob);
                save.onSaved(save.dataUri ? `data:${MIME[save.format]};base64,${encoded}` : encoded);
                showFlash("saved");
            }
        });

    const stop = (event: MouseEvent): void => event.stopPropagation();
    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
        if (onClick && (event.key === "Enter" || event.key === " ") && event.target === event.currentTarget) {
            event.preventDefault();
            onClick();
        }
    };

    const disabled = busy || !active || expired;
    const button = (key: string, label: string, handler: () => void, extraClass?: string): ReactElement => (
        <button
            key={key}
            type="button"
            className={classNames("btn", toolbar?.buttonClass, "mxt-qr__button", extraClass)}
            disabled={disabled}
            onClick={handler}
        >
            {label}
        </button>
    );
    const hasButtons =
        toolbar &&
        (toolbar.png ||
            toolbar.svg ||
            toolbar.jpeg ||
            toolbar.webp ||
            toolbar.copy ||
            toolbar.print ||
            toolbar.save ||
            (toolbar.extra?.length ?? 0) > 0);
    const toolbarElement =
        toolbar && hasButtons ? (
            <div className={classNames("mxt-qr__toolbar", `mxt-qr__toolbar--${toolbar.position}`)} onClick={stop}>
                {DOWNLOADS.filter(item => toolbar[item.key]).map(item =>
                    button(
                        item.key,
                        toolbar.labelDownload ? `${toolbar.labelDownload} ${item.label}` : item.label,
                        () => download(item.extension)
                    )
                )}
                {toolbar.copy &&
                    button(
                        "copy",
                        flash === "copied" ? toolbar.labelCopied : toolbar.labelCopy,
                        copy,
                        flash === "copied" ? "mxt-qr__button--done" : undefined
                    )}
                {toolbar.print && button("print", toolbar.labelPrint, print)}
                {toolbar.save &&
                    base64 &&
                    button(
                        "save",
                        flash === "saved" ? toolbar.labelSaved : toolbar.labelSave,
                        saveNow,
                        flash === "saved" ? "mxt-qr__button--done" : undefined
                    )}
                {(toolbar.extra ?? []).map(extra =>
                    button(extra.key, extra.label, () => {
                        extra.onClick();
                    })
                )}
            </div>
        ) : null;

    const fit = sizeMode === "fit";
    const code = (
        <div
            className={classNames("mxt-qr__code", { "mxt-qr__code--empty": !active, "mxt-qr__code--fit": fit })}
            style={fit ? { width: "100%" } : { width: size, height: size }}
            role="img"
            aria-label={ariaLabel}
        >
            {/* The library owns everything inside this div; React never renders children into it. */}
            <div ref={containerRef} className="mxt-qr__canvas" />
            {notice && <span className="mxt-qr__notice">{notice}</span>}
        </div>
    );

    // The frame wrapper always exists and the children are keyed, so the code container keeps its
    // DOM identity when the frame is toggled; the library's SVG lives inside it and must not be re-parented.
    const geometry = frameGeometry(size);
    const side = isSideFrame(frame);
    const icon = frame?.iconUrl ? (
        <img
            className="mxt-qr__frame-icon"
            src={frame.iconUrl}
            alt=""
            style={{ width: geometry.font * 1.1, height: geometry.font * 1.1 }}
        />
    ) : frame?.iconClass ? (
        <span className={classNames("mxt-qr__frame-icon", frame.iconClass)} aria-hidden="true" />
    ) : null;
    const label = frame ? (
        <div
            key={`label-${frame.position}`}
            className={classNames("mxt-qr__frame-label", `mxt-qr__frame-label--${frame.style}`)}
            style={{
                ...(side ? { width: geometry.bar } : { height: geometry.bar, lineHeight: `${geometry.bar}px` }),
                fontSize: geometry.font,
                fontFamily: frameFontFamily(frame),
                color: frame.style === "outline" ? frame.textColor : frame.textColor,
                ...(frame.style !== "solid" ? { backgroundColor: frame.color } : {})
            }}
        >
            <span
                className="mxt-qr__frame-text"
                style={frame.style === "pill" ? { backgroundColor: frame.color } : undefined}
            >
                {icon}
                {frame.label}
            </span>
        </div>
    ) : null;
    const frameStyle: CSSProperties | undefined = frame
        ? {
              padding: frame.style === "pill" ? 0 : geometry.border,
              borderRadius: frame.radius,
              ...(frame.style === "solid" ? { backgroundColor: frame.color } : {}),
              ...(frame.style === "outline"
                  ? { border: `${Math.round(geometry.border * 0.4)}px solid ${frame.color}` }
                  : {})
          }
        : undefined;
    const stage = (
        <div
            className={classNames("mxt-qr__frame", {
                [`mxt-qr__frame--${frame?.position}`]: Boolean(frame),
                [`mxt-qr__frame--${frame?.style}`]: Boolean(frame),
                "mxt-qr__frame--side": side,
                "mxt-qr__frame--none": !frame,
                "mxt-qr__frame--fit": fit
            })}
            style={frameStyle}
        >
            {frame?.position === "top" || frame?.position === "left" ? label : null}
            <Fragment key="code">{code}</Fragment>
            {frame?.position === "bottom" || frame?.position === "right" ? label : null}
        </div>
    );

    return (
        <div
            ref={rootRef}
            className={classNames("mxt-qr", props.className, {
                "mxt-qr--clickable": Boolean(onClick),
                "mxt-qr--expired": expired,
                "mxt-qr--blur": expired && expiry?.blur,
                "mxt-qr--busy": busy,
                "mxt-qr--fit": fit
            })}
            style={props.style}
            tabIndex={props.tabIndex ?? (onClick ? 0 : undefined)}
            role={onClick ? "button" : undefined}
            onClick={onClick}
            onKeyDown={onClick ? handleKeyDown : undefined}
        >
            {toolbar?.position === "top" && toolbarElement}
            <div className="mxt-qr__stage">
                {stage}
                {expired && expiry && (
                    <div className="mxt-qr__expired" role="status">
                        {expiry.expiredLabel}
                    </div>
                )}
            </div>
            {expiry && remaining !== undefined && remaining > 0 && expiry.label && (
                <div className="mxt-qr__countdown">{expiry.label.replace("[time]", formatRemaining(remaining))}</div>
            )}
            {caption && <div className="mxt-qr__caption">{caption}</div>}
            {renderError && (
                <div className="mxt-qr__warning mxt-qr__warning--error" role="alert">
                    {renderError}
                </div>
            )}
            {scanOk === false && scanWarning && (
                <div className="mxt-qr__warning" role="status">
                    {scanWarning}
                </div>
            )}
            {toolbar?.position !== "top" && toolbarElement}
        </div>
    );
}
