import jsQR from "jsqr";
import type QRCodeStyling from "qr-code-styling";
import { loadImage, rawBlob } from "./export";

/**
 * Renders the code to pixels and decodes it again with jsQR.
 * Resolves to undefined when the check could not run (for example a cross-origin logo taints the canvas),
 * so callers can stay silent instead of warning about something they do not know.
 */
export async function isScannable(qr: QRCodeStyling): Promise<boolean | undefined> {
    try {
        const png = await rawBlob(qr, "png");
        if (!png) {
            return undefined;
        }
        const image = await loadImage(png);
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
            return undefined;
        }
        // Transparent pixels decode as black: flatten onto white like paper would.
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: "attemptBoth" });
        return result !== null;
    } catch {
        return undefined;
    }
}
