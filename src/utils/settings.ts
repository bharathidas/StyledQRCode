import { StyledQRCodePreviewProps } from "../../typings/StyledQRCodeProps";
import { GradientStop, StyleSettings } from "./options";

/** The style properties shared by the runtime and the Studio Pro preview (numbers may be null there). */
export type StyleSource = Pick<
    StyledQRCodePreviewProps,
    | "size"
    | "margin"
    | "shape"
    | "renderType"
    | "dotsType"
    | "dotsColor"
    | "dotsGradient"
    | "dotsGradientEndColor"
    | "dotsGradientRotation"
    | "dotsRoundSize"
    | "cornersSquareType"
    | "cornersSquareColor"
    | "cornersSquareGradient"
    | "cornersSquareGradientEndColor"
    | "cornersSquareGradientRotation"
    | "cornersDotType"
    | "cornersDotColor"
    | "cornersDotGradient"
    | "cornersDotGradientEndColor"
    | "cornersDotGradientRotation"
    | "backgroundTransparent"
    | "backgroundColor"
    | "backgroundRound"
    | "backgroundGradient"
    | "backgroundGradientEndColor"
    | "backgroundGradientRotation"
    | "logoSize"
    | "logoMargin"
    | "hideBackgroundDots"
    | "logoCrossOrigin"
    | "errorCorrectionLevel"
    | "typeNumber"
    | "encodingMode"
> & {
    dotsGradientStops: Array<{ stopOffset: number | null; stopColor: string }>;
    cornersSquareGradientStops: Array<{ stopOffset: number | null; stopColor: string }>;
    cornersDotGradientStops: Array<{ stopOffset: number | null; stopColor: string }>;
    backgroundGradientStops: Array<{ stopOffset: number | null; stopColor: string }>;
};

/** Studio Pro forbids hyphens in enumeration keys, so camelCase keys map to the library names (extraRounded -> extra-rounded). */
const libKey = <T extends string>(key: string): T => key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`) as T;

const num = (value: number | null | undefined, fallback: number): number =>
    typeof value === "number" && Number.isFinite(value) ? value : fallback;

const stops = (list: Array<{ stopOffset: number | null; stopColor: string }> | undefined): GradientStop[] =>
    (list ?? []).map(s => ({ offset: num(s.stopOffset, 0), color: s.stopColor ?? "" }));

export function toStyleSettings(p: StyleSource, logoUrl: string): StyleSettings {
    return {
        size: num(p.size, 300),
        margin: num(p.margin, 8),
        shape: p.shape,
        renderType: p.renderType,
        dotsType: libKey<StyleSettings["dotsType"]>(p.dotsType),
        dotsColor: p.dotsColor || "#000000",
        dotsGradient: p.dotsGradient,
        dotsGradientEndColor: p.dotsGradientEndColor || "#1a73e8",
        dotsGradientRotation: num(p.dotsGradientRotation, 0),
        dotsGradientStops: stops(p.dotsGradientStops),
        dotsRoundSize: p.dotsRoundSize,
        cornersSquareType: libKey<StyleSettings["cornersSquareType"]>(p.cornersSquareType),
        cornersSquareColor: p.cornersSquareColor ?? "",
        cornersSquareGradient: p.cornersSquareGradient,
        cornersSquareGradientEndColor: p.cornersSquareGradientEndColor || "#1a73e8",
        cornersSquareGradientRotation: num(p.cornersSquareGradientRotation, 0),
        cornersSquareGradientStops: stops(p.cornersSquareGradientStops),
        cornersDotType: libKey<StyleSettings["cornersDotType"]>(p.cornersDotType),
        cornersDotColor: p.cornersDotColor ?? "",
        cornersDotGradient: p.cornersDotGradient,
        cornersDotGradientEndColor: p.cornersDotGradientEndColor || "#1a73e8",
        cornersDotGradientRotation: num(p.cornersDotGradientRotation, 0),
        cornersDotGradientStops: stops(p.cornersDotGradientStops),
        backgroundTransparent: p.backgroundTransparent,
        backgroundColor: p.backgroundColor || "#ffffff",
        backgroundRound: num(p.backgroundRound, 0),
        backgroundGradient: p.backgroundGradient,
        backgroundGradientEndColor: p.backgroundGradientEndColor || "#e8f0fe",
        backgroundGradientRotation: num(p.backgroundGradientRotation, 0),
        backgroundGradientStops: stops(p.backgroundGradientStops),
        logoUrl,
        logoSize: num(p.logoSize, 40),
        logoMargin: num(p.logoMargin, 4),
        hideBackgroundDots: p.hideBackgroundDots,
        logoCrossOrigin: libKey<StyleSettings["logoCrossOrigin"]>(p.logoCrossOrigin),
        errorCorrectionLevel: p.errorCorrectionLevel,
        typeNumber: num(p.typeNumber, 0),
        encodingMode: p.encodingMode
    };
}

/** Formats a remaining duration as mm:ss, or h:mm:ss above an hour. */
export function formatRemaining(milliseconds: number): string {
    const total = Math.max(0, Math.ceil(milliseconds / 1000));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    const pad = (n: number): string => String(n).padStart(2, "0");
    return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}
