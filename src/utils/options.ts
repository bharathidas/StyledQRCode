import type { CornerDotType, CornerSquareType, DotType, Gradient, Options, TypeNumber } from "qr-code-styling";

export type GradientKind = "none" | "linear" | "radial";
export type CrossOrigin = "anonymous" | "use-credentials" | "none";

export interface GradientStop {
    /** 0..100 */
    offset: number;
    color: string;
}

/** Everything that shapes how a code looks, independent of the data it encodes. */
export interface StyleSettings {
    size: number;
    margin: number;
    shape: "square" | "circle";
    renderType: "svg" | "canvas";
    dotsType: DotType;
    dotsColor: string;
    dotsGradient: GradientKind;
    dotsGradientEndColor: string;
    dotsGradientRotation: number;
    dotsGradientStops: GradientStop[];
    dotsRoundSize: boolean;
    cornersSquareType: "default" | CornerSquareType;
    cornersSquareColor: string;
    cornersSquareGradient: GradientKind;
    cornersSquareGradientEndColor: string;
    cornersSquareGradientRotation: number;
    cornersSquareGradientStops: GradientStop[];
    cornersDotType: "default" | CornerDotType;
    cornersDotColor: string;
    cornersDotGradient: GradientKind;
    cornersDotGradientEndColor: string;
    cornersDotGradientRotation: number;
    cornersDotGradientStops: GradientStop[];
    backgroundTransparent: boolean;
    backgroundColor: string;
    backgroundRound: number;
    backgroundGradient: GradientKind;
    backgroundGradientEndColor: string;
    backgroundGradientRotation: number;
    backgroundGradientStops: GradientStop[];
    logoUrl: string;
    logoSize: number;
    logoMargin: number;
    hideBackgroundDots: boolean;
    logoCrossOrigin: CrossOrigin;
    errorCorrectionLevel: "L" | "M" | "Q" | "H";
    typeNumber: number;
    encodingMode: "auto" | "Numeric" | "Alphanumeric" | "Byte" | "Kanji";
}

export type FramePosition = "top" | "bottom" | "left" | "right";
export type FrameStyle = "solid" | "outline" | "pill";

export interface FrameSpec {
    label: string;
    position: FramePosition;
    style: FrameStyle;
    color: string;
    textColor: string;
    radius: number;
    /** CSS font family; empty = Helvetica/Arial. */
    font: string;
    /** Image icon (included in exports). */
    iconUrl?: string;
    /** Glyph icon class (screen only). */
    iconClass?: string;
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export function gradient(
    kind: GradientKind,
    rotationDegrees: number,
    from: string,
    to: string,
    stops: GradientStop[] = []
): Gradient | undefined {
    if (kind === "none") {
        return undefined;
    }
    const custom = stops
        .filter(s => s && s.color && s.color.trim())
        .map(s => ({ offset: clamp(Number(s.offset) || 0, 0, 100) / 100, color: s.color.trim() }))
        .sort((a, b) => a.offset - b.offset);
    return {
        type: kind,
        rotation: (rotationDegrees * Math.PI) / 180,
        colorStops:
            custom.length >= 2
                ? custom
                : [
                      { offset: 0, color: from },
                      { offset: 1, color: to }
                  ]
    };
}

/** Maps the widget settings onto qr-code-styling options. */
export function buildOptions(data: string, s: StyleSettings): Options {
    const size = clamp(Math.round(s.size) || 300, 40, 4000);
    const cornersSquareColor = s.cornersSquareColor.trim() || undefined;
    const cornersDotColor = s.cornersDotColor.trim() || undefined;

    const options: Options = {
        type: s.renderType,
        shape: s.shape,
        width: size,
        height: size,
        margin: Math.max(0, s.margin),
        data,
        qrOptions: {
            typeNumber: clamp(Math.round(s.typeNumber), 0, 40) as TypeNumber,
            mode: s.encodingMode === "auto" ? undefined : s.encodingMode,
            errorCorrectionLevel: s.errorCorrectionLevel
        },
        dotsOptions: {
            type: s.dotsType,
            color: s.dotsColor,
            gradient: gradient(
                s.dotsGradient,
                s.dotsGradientRotation,
                s.dotsColor,
                s.dotsGradientEndColor,
                s.dotsGradientStops
            ),
            roundSize: s.dotsRoundSize
        },
        cornersSquareOptions: {
            type: s.cornersSquareType === "default" ? undefined : s.cornersSquareType,
            // Undefined color and gradient make the library reuse the dot fill.
            color: cornersSquareColor,
            gradient: gradient(
                s.cornersSquareGradient,
                s.cornersSquareGradientRotation,
                cornersSquareColor ?? s.dotsColor,
                s.cornersSquareGradientEndColor,
                s.cornersSquareGradientStops
            )
        },
        cornersDotOptions: {
            type: s.cornersDotType === "default" ? undefined : s.cornersDotType,
            color: cornersDotColor,
            gradient: gradient(
                s.cornersDotGradient,
                s.cornersDotGradientRotation,
                cornersDotColor ?? s.dotsColor,
                s.cornersDotGradientEndColor,
                s.cornersDotGradientStops
            )
        },
        backgroundOptions: {
            round: clamp(s.backgroundRound, 0, 100) / 100,
            color: s.backgroundTransparent ? "transparent" : s.backgroundColor,
            gradient: s.backgroundTransparent
                ? undefined
                : gradient(
                      s.backgroundGradient,
                      s.backgroundGradientRotation,
                      s.backgroundColor,
                      s.backgroundGradientEndColor,
                      s.backgroundGradientStops
                  )
        }
    };

    if (s.logoUrl) {
        options.image = s.logoUrl;
        options.imageOptions = {
            saveAsBlob: true,
            hideBackgroundDots: s.hideBackgroundDots,
            imageSize: clamp(s.logoSize, 1, 100) / 100,
            margin: Math.max(0, s.logoMargin),
            crossOrigin: s.logoCrossOrigin === "none" ? undefined : s.logoCrossOrigin
        };
    }

    return options;
}

/** Pixel geometry of the frame, derived from the code size so it scales with it. */
export function frameGeometry(size: number): { border: number; bar: number; font: number } {
    const border = Math.max(10, Math.round(size * 0.05));
    const bar = Math.max(32, Math.round(size * 0.16));
    return { border, bar, font: Math.round(bar * 0.5) };
}

export const isSideFrame = (frame: FrameSpec | undefined): boolean =>
    Boolean(frame && (frame.position === "left" || frame.position === "right"));

export const frameFontFamily = (frame: FrameSpec): string => frame.font.trim() || "Helvetica, Arial, sans-serif";
