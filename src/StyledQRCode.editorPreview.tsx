import { ReactElement, useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";

import { StyledQRCodePreviewProps } from "../typings/StyledQRCodeProps";
import { buildOptions, frameGeometry } from "./utils/options";
import { toStyleSettings } from "./utils/settings";

const SAMPLE: Record<StyledQRCodePreviewProps["payloadType"], string> = {
    text: "https://mxtechies.com",
    upi: "upi://pay?pa=shop@upi&pn=MX%20Techies&am=150.00&cu=INR",
    wifi: "WIFI:T:WPA;S:MxTechies;P:secret;;",
    vcard: "BEGIN:VCARD\r\nVERSION:3.0\r\nN:Techies;MX;;;\r\nFN:MX Techies\r\nEND:VCARD",
    email: "mailto:hello@mxtechies.com",
    sms: "SMSTO:+919876543210:Hello",
    phone: "tel:+919876543210",
    geo: "geo:13.0827,80.2707",
    maps: "https://www.google.com/maps/search/?api=1&query=13.0827,80.2707",
    calendar: "BEGIN:VEVENT\r\nSUMMARY:Demo\r\nDTSTART:20260916T090000Z\r\nEND:VEVENT",
    whatsapp: "https://wa.me/919876543210",
    telegram: "https://t.me/mxtechies",
    epc: "BCD\n002\n1\nSCT\n\nMX Techies\nNL91ABNA0417164300\nEUR10.00\n\n\nInvoice",
    bitcoin: "bitcoin:bc1qexample?amount=0.001",
    paypal: "https://www.paypal.me/mxtechies/10USD",
    promptpay: "00020101021129370016A000000677010111011300668123456785303764540510.005802TH6304ABCD",
    paynow: "00020101021126380009SG.PAYNOW010100211+6591234567030115204000053037025802SG5902NA6009Singapore6304ABCD"
};

/** Uses a literal expression such as 'https://…' verbatim; anything else gets a sample of the same payload type. */
function previewData(props: StyledQRCodePreviewProps): string {
    if (props.displayMode === "list") {
        return SAMPLE.text;
    }
    const literal = /^'(.*)'$/.exec((props.value ?? "").trim());
    if (props.payloadType === "text" && literal && literal[1]) {
        return literal[1].replace(/''/g, "'");
    }
    return SAMPLE[props.payloadType] ?? SAMPLE.text;
}

/** Hooks need a component; Mendix requires the export to be named `preview`. */
function StyledQRCodePreview(props: StyledQRCodePreviewProps): ReactElement {
    const containerRef = useRef<HTMLDivElement>(null);
    const logoUrl = props.logo?.type === "static" ? props.logo.imageUrl : "";
    const settings = toStyleSettings(props, logoUrl);
    const data = previewData(props);
    const options = buildOptions(data, settings);
    const size = options.width ?? settings.size;
    const optionsKey = JSON.stringify(options);
    const structure = props.renderMode === "structure";
    const fit = props.sizeMode === "fit";

    useEffect(() => {
        const container = containerRef.current;
        if (!container || structure) {
            return;
        }
        try {
            container.innerHTML = "";
            new QRCodeStyling(options).append(container);
        } catch {
            container.innerHTML = "";
        }
        // optionsKey captures every value in options.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [optionsKey, structure]);

    const buttons: string[] = [];
    const download = props.labelDownload ? `${props.labelDownload} ` : "";
    if (props.showDownloadPng) {
        buttons.push(`${download}PNG`);
    }
    if (props.showDownloadSvg) {
        buttons.push(`${download}SVG`);
    }
    if (props.showDownloadJpeg) {
        buttons.push(`${download}JPEG`);
    }
    if (props.showDownloadWebp) {
        buttons.push(`${download}WEBP`);
    }
    if (props.showCopy) {
        buttons.push(props.labelCopy);
    }
    if (props.showPrint) {
        buttons.push(props.labelPrint);
    }
    if (props.displayMode === "single" && props.showSave && props.base64Attribute) {
        buttons.push(props.labelSave);
    }
    const listButtons: string[] = [];
    if (props.displayMode === "list") {
        if (props.showDownloadZip) {
            listButtons.push(props.labelZip);
        }
        if (props.showPrintSheet) {
            listButtons.push(props.labelPrintSheet);
        }
        if (props.showDownloadPdf) {
            listButtons.push(props.labelPdf);
        }
    }
    const buttonRow = (labels: string[], cls: string): ReactElement | null =>
        labels.length > 0 ? (
            <div className={cls}>
                {labels.map(label => (
                    <button key={label} type="button" className={`btn btn-${props.buttonStyle} mxt-qr__button`}>
                        {label}
                    </button>
                ))}
            </div>
        ) : null;
    const toolbar = buttonRow(buttons, `mxt-qr__toolbar mxt-qr__toolbar--${props.toolbarPosition}`);

    const code = (
        <div
            className={`mxt-qr__code${structure ? " mxt-qr__code--empty" : ""}${fit ? " mxt-qr__code--fit" : ""}`}
            style={fit ? { width: "100%" } : { width: size, height: size }}
        >
            <div ref={containerRef} className="mxt-qr__canvas" />
            {structure && <span className="mxt-qr__structure">QR</span>}
        </div>
    );

    let stage = code;
    if (props.showFrame) {
        const geometry = frameGeometry(size);
        const position = props.frameLabelPosition;
        const side = position === "left" || position === "right";
        const style = props.frameStyle;
        const color = props.frameColor || "#000000";
        const label = (
            <div
                className={`mxt-qr__frame-label mxt-qr__frame-label--${style}`}
                style={{
                    ...(side ? { width: geometry.bar } : { height: geometry.bar, lineHeight: `${geometry.bar}px` }),
                    fontSize: geometry.font,
                    fontFamily: props.frameFont || "Helvetica, Arial, sans-serif",
                    color: props.frameTextColor || "#ffffff",
                    ...(style !== "solid" ? { backgroundColor: color } : {})
                }}
            >
                <span className="mxt-qr__frame-text" style={style === "pill" ? { backgroundColor: color } : undefined}>
                    {props.frameIcon?.type === "image" ? (
                        <img
                            className="mxt-qr__frame-icon"
                            src={props.frameIcon.imageUrl}
                            alt=""
                            style={{ width: geometry.font, height: geometry.font }}
                        />
                    ) : props.frameIcon ? (
                        <span className={`mxt-qr__frame-icon ${props.frameIcon.iconClass}`} />
                    ) : null}
                    {props.frameLabel}
                </span>
            </div>
        );
        stage = (
            <div
                className={`mxt-qr__frame mxt-qr__frame--${position} mxt-qr__frame--${style}${
                    side ? " mxt-qr__frame--side" : ""
                }${fit ? " mxt-qr__frame--fit" : ""}`}
                style={{
                    padding: style === "pill" ? 0 : geometry.border,
                    borderRadius: props.frameRadius ?? 16,
                    ...(style === "solid" ? { backgroundColor: color } : {}),
                    ...(style === "outline" ? { border: `${Math.round(geometry.border * 0.4)}px solid ${color}` } : {})
                }}
            >
                {(position === "top" || position === "left") && label}
                {code}
                {(position === "bottom" || position === "right") && label}
            </div>
        );
    }

    const single = (
        <div className={`mxt-qr ${fit ? "mxt-qr--fit " : ""}${props.className ?? ""}`} style={props.styleObject}>
            {props.toolbarPosition === "top" && toolbar}
            <div className="mxt-qr__stage">{stage}</div>
            {props.displayMode === "single" && props.caption && <div className="mxt-qr__caption">{props.caption}</div>}
            {props.displayMode === "list" && props.listLabel && (
                <div className="mxt-qr__caption">{props.listLabel}</div>
            )}
            {props.toolbarPosition !== "top" && toolbar}
        </div>
    );

    if (props.displayMode === "list") {
        return (
            <div
                className={`mxt-qr-list ${props.className ?? ""}`}
                style={{ ...props.styleObject, gap: props.listGap ?? 16 }}
            >
                {buttonRow(listButtons, "mxt-qr-list__toolbar")}
                {single}
                <div className="mxt-qr mxt-qr--preview-ghost">
                    <div className="mxt-qr__code mxt-qr__code--empty" style={{ width: size, height: size }} />
                </div>
            </div>
        );
    }
    return single;
}

export function preview(props: StyledQRCodePreviewProps): ReactElement {
    return <StyledQRCodePreview {...props} />;
}

export function getPreviewCss(): string {
    return require("./ui/StyledQRCode.css");
}
