import QRCodeStyling, { FileExtension, Options } from "qr-code-styling";
import { FrameSpec, frameFontFamily, frameGeometry, isSideFrame } from "./options";

export const MIME: Record<FileExtension, string> = {
    png: "image/png",
    svg: "image/svg+xml",
    jpeg: "image/jpeg",
    webp: "image/webp"
};

const escapeXml = (value: string): string =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The library returns a Buffer under Node; the widget only ever runs in a browser. */
export async function rawBlob(qr: QRCodeStyling, extension: FileExtension): Promise<Blob | null> {
    const raw = await qr.getRawData(extension);
    return raw instanceof Blob ? raw : null;
}

export function loadImage(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(blob);
        const image = new Image();
        image.onload = () => {
            URL.revokeObjectURL(url);
            resolve(image);
        };
        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Could not load the rendered QR code image"));
        };
        image.src = url;
    });
}

function loadImageUrl(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Could not load " + url));
        image.src = url;
    });
}

/** Fetches a URL and returns it as a data URI so exported SVGs stay self-contained. */
async function toDataUri(url: string): Promise<string> {
    if (url.startsWith("data:")) {
        return url;
    }
    const blob = await (await fetch(url)).blob();
    return `data:${blob.type};base64,${await blobToBase64(blob)}`;
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    const radius = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

const canvasToBlob = (canvas: HTMLCanvasElement, type: string): Promise<Blob | null> =>
    new Promise(resolve => canvas.toBlob(blob => resolve(blob), type, 0.92));

export interface FrameLayout {
    width: number;
    height: number;
    codeX: number;
    codeY: number;
    /** Label bar rectangle (before rotation for side labels). */
    label: { x: number; y: number; w: number; h: number };
    /** Text rotation in degrees for side labels. */
    rotate: 0 | -90 | 90;
    border: number;
    bar: number;
    font: number;
}

/** Where the code and the label bar sit for the given frame position. */
export function frameLayout(size: number, frame: FrameSpec): FrameLayout {
    const { border, bar, font } = frameGeometry(size);
    if (isSideFrame(frame)) {
        const width = size + 2 * border + bar;
        const height = size + 2 * border;
        const left = frame.position === "left";
        return {
            width,
            height,
            codeX: left ? border + bar : border,
            codeY: border,
            label: { x: left ? border / 2 : size + border + border / 2, y: 0, w: bar, h: height },
            rotate: left ? -90 : 90,
            border,
            bar,
            font
        };
    }
    const width = size + 2 * border;
    const height = size + 2 * border + bar;
    const top = frame.position === "top";
    return {
        width,
        height,
        codeX: border,
        codeY: top ? border + bar : border,
        label: { x: 0, y: top ? border / 2 : size + border + border / 2, w: width, h: bar },
        rotate: 0,
        border,
        bar,
        font
    };
}

/**
 * Exports the code in the requested format. With a frame the code is composed into a larger image
 * that includes the border and the label, so downloads match what is on screen.
 */
export async function exportImage(
    qr: QRCodeStyling,
    extension: FileExtension,
    size: number,
    frame?: FrameSpec
): Promise<Blob | null> {
    if (!frame) {
        if (extension !== "jpeg") {
            return rawBlob(qr, extension);
        }
        // JPEG has no alpha channel: flatten transparent backgrounds onto white instead of black.
        const png = await rawBlob(qr, "png");
        if (!png) {
            return null;
        }
        const image = await loadImage(png);
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            return null;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);
        return canvasToBlob(canvas, MIME.jpeg);
    }

    const L = frameLayout(size, frame);
    const font = frameFontFamily(frame);
    const iconSize = Math.round(L.font * 1.1);
    const gap = Math.round(L.font * 0.4);

    if (extension === "svg") {
        const inner = await rawBlob(qr, "svg");
        if (!inner) {
            return null;
        }
        let code = (await inner.text()).replace(/^<\?xml[^>]*>\s*/, "");
        code = code.replace(/<svg\b/, `<svg x="${L.codeX}" y="${L.codeY}"`);
        let iconHref = "";
        if (frame.iconUrl) {
            try {
                iconHref = await toDataUri(frame.iconUrl);
            } catch {
                iconHref = frame.iconUrl;
            }
        }
        const textWidth = Math.round(frame.label.length * L.font * 0.58);
        const totalWidth = textWidth + (iconHref ? iconSize + gap : 0);
        const cx = L.label.x + L.label.w / 2;
        const cy = L.label.y + L.label.h / 2;
        const startX = cx - totalWidth / 2;
        const labelGroup =
            `<g transform="rotate(${L.rotate} ${cx} ${cy})">` +
            (frame.style === "pill"
                ? `<rect x="${cx - totalWidth / 2 - L.font}" y="${cy - L.bar * 0.36}" width="${
                      totalWidth + 2 * L.font
                  }" height="${L.bar * 0.72}" rx="${L.bar * 0.36}" fill="${escapeXml(frame.color)}"/>`
                : frame.style === "outline"
                ? `<rect x="${L.label.x}" y="${L.label.y}" width="${L.label.w}" height="${L.label.h}" fill="${escapeXml(
                      frame.color
                  )}"/>`
                : "") +
            (iconHref
                ? `<image href="${iconHref}" x="${startX}" y="${
                      cy - iconSize / 2
                  }" width="${iconSize}" height="${iconSize}"/>`
                : "") +
            `<text x="${iconHref ? startX + iconSize + gap : cx}" y="${cy}" text-anchor="${
                iconHref ? "start" : "middle"
            }" dominant-baseline="central" ` +
            `font-family="${escapeXml(font)}" font-weight="700" font-size="${L.font}" fill="${escapeXml(
                frame.textColor
            )}">${escapeXml(frame.label)}</text></g>`;
        const outer =
            frame.style === "solid"
                ? `<rect width="${L.width}" height="${L.height}" rx="${frame.radius}" ry="${
                      frame.radius
                  }" fill="${escapeXml(frame.color)}"/>`
                : frame.style === "outline"
                ? `<rect x="${L.border * 0.2}" y="${L.border * 0.2}" width="${L.width - L.border * 0.4}" height="${
                      L.height - L.border * 0.4
                  }" rx="${frame.radius}" ry="${frame.radius}" fill="none" stroke="${escapeXml(
                      frame.color
                  )}" stroke-width="${L.border * 0.4}"/>`
                : "";
        const svg =
            `<?xml version="1.0" standalone="no"?>\r\n` +
            `<svg xmlns="http://www.w3.org/2000/svg" width="${L.width}" height="${L.height}" viewBox="0 0 ${L.width} ${L.height}">` +
            outer +
            code +
            labelGroup +
            `</svg>`;
        return new Blob([svg], { type: MIME.svg });
    }

    const png = await rawBlob(qr, "png");
    if (!png) {
        return null;
    }
    const image = await loadImage(png);
    const canvas = document.createElement("canvas");
    canvas.width = L.width;
    canvas.height = L.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        return null;
    }
    if (extension === "jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, L.width, L.height);
    }
    if (frame.style === "solid") {
        roundedRectPath(ctx, 0, 0, L.width, L.height, frame.radius);
        ctx.fillStyle = frame.color;
        ctx.fill();
    } else if (frame.style === "outline") {
        const sw = L.border * 0.4;
        roundedRectPath(ctx, sw / 2, sw / 2, L.width - sw, L.height - sw, frame.radius);
        ctx.strokeStyle = frame.color;
        ctx.lineWidth = sw;
        ctx.stroke();
        ctx.fillStyle = frame.color;
        ctx.fillRect(L.label.x, L.label.y, L.label.w, L.label.h);
    }
    ctx.drawImage(image, L.codeX, L.codeY, size, size);

    let icon: HTMLImageElement | undefined;
    if (frame.iconUrl) {
        try {
            icon = await loadImageUrl(frame.iconUrl);
        } catch {
            icon = undefined;
        }
    }
    ctx.save();
    const cx = L.label.x + L.label.w / 2;
    const cy = L.label.y + L.label.h / 2;
    ctx.translate(cx, cy);
    ctx.rotate((L.rotate * Math.PI) / 180);
    ctx.font = `700 ${L.font}px ${font}`;
    ctx.textBaseline = "middle";
    const maxText = (L.rotate ? L.height : L.width) - 2 * L.border - (icon ? iconSize + gap : 0);
    const textWidth = Math.min(ctx.measureText(frame.label).width, maxText);
    const totalWidth = textWidth + (icon ? iconSize + gap : 0);
    if (frame.style === "pill") {
        roundedRectPath(
            ctx,
            -totalWidth / 2 - L.font,
            -L.bar * 0.36,
            totalWidth + 2 * L.font,
            L.bar * 0.72,
            L.bar * 0.36
        );
        ctx.fillStyle = frame.color;
        ctx.fill();
    }
    let x = -totalWidth / 2;
    if (icon) {
        ctx.drawImage(icon, x, -iconSize / 2, iconSize, iconSize);
        x += iconSize + gap;
    }
    ctx.fillStyle = frame.textColor;
    ctx.textAlign = "left";
    ctx.fillText(frame.label, x, 0, maxText);
    ctx.restore();
    return canvasToBlob(canvas, MIME[extension]);
}

/** Renders a code off-screen from options and exports it, used for ZIP, PDF and print sheets. */
export async function renderBlob(options: Options, extension: FileExtension, frame?: FrameSpec): Promise<Blob | null> {
    const qr = new QRCodeStyling(options);
    return exportImage(qr, extension, options.width ?? 300, frame);
}

/** Base64 payload of a blob, without the data URI prefix. */
export function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = String(reader.result ?? "");
            resolve(result.substring(result.indexOf(",") + 1));
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}

export function downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Copies a PNG blob to the clipboard. Resolves to false when the browser does not allow it. */
export async function copyImage(blob: Blob): Promise<boolean> {
    const clipboard = navigator.clipboard as Clipboard | undefined;
    const ClipboardItemCtor = (window as unknown as { ClipboardItem?: typeof ClipboardItem }).ClipboardItem;
    if (!clipboard?.write || !ClipboardItemCtor) {
        return false;
    }
    try {
        await clipboard.write([new ClipboardItemCtor({ [blob.type]: blob })]);
        return true;
    } catch {
        return false;
    }
}

/** Prints an HTML document through a hidden iframe so no popup blocker gets in the way. */
export function printHtml(html: string, revoke: string[] = []): void {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
    document.body.appendChild(iframe);

    let cleaned = false;
    const cleanup = (): void => {
        if (cleaned) {
            return;
        }
        cleaned = true;
        setTimeout(() => {
            iframe.remove();
            revoke.forEach(url => URL.revokeObjectURL(url));
        }, 1000);
    };

    const doc = iframe.contentDocument;
    const frameWindow = iframe.contentWindow;
    if (!doc || !frameWindow) {
        cleanup();
        return;
    }
    doc.open();
    doc.write(html);
    doc.close();

    const images = Array.from(doc.images);
    const print = (): void => {
        frameWindow.addEventListener("afterprint", cleanup, { once: true });
        frameWindow.focus();
        frameWindow.print();
        // Browsers that never fire afterprint still get cleaned up.
        setTimeout(cleanup, 60_000);
    };
    Promise.all(
        images.map(
            image =>
                new Promise<void>(resolve => {
                    if (image.complete) {
                        resolve();
                    } else {
                        image.onload = () => resolve();
                        image.onerror = () => resolve();
                    }
                })
        )
    ).then(print);
}

/** Prints only the image. */
export function printImage(blob: Blob, title: string): void {
    const url = URL.createObjectURL(blob);
    printHtml(
        `<!doctype html><html><head><title>${escapeXml(title)}</title>` +
            `<style>html,body{margin:0;height:100%}body{display:flex;align-items:center;justify-content:center}` +
            `img{max-width:100%;max-height:100%}@page{margin:10mm}</style></head>` +
            `<body><img src="${url}" alt="${escapeXml(title)}"></body></html>`,
        [url]
    );
}
