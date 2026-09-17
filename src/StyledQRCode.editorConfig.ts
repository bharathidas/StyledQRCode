import { hidePropertiesIn, Problem, Properties } from "@mendix/pluggable-widgets-tools";
import { StyledQRCodePreviewProps } from "../typings/StyledQRCodeProps";

type Keys = Array<keyof StyledQRCodePreviewProps>;

const PAYLOAD_KEYS: Record<StyledQRCodePreviewProps["payloadType"], Keys> = {
    text: ["value"],
    upi: ["upiVpa", "upiName", "upiAmount", "upiCurrency", "upiNote", "upiTransactionRef"],
    wifi: ["wifiSsid", "wifiPassword", "wifiEncryption", "wifiHidden"],
    vcard: [
        "vcardVersion",
        "vcardFirstName",
        "vcardLastName",
        "vcardOrganization",
        "vcardTitle",
        "vcardPhone",
        "vcardMobile",
        "vcardHomePhone",
        "vcardEmail",
        "vcardWebsite",
        "vcardAddress",
        "vcardStreet",
        "vcardCity",
        "vcardRegion",
        "vcardPostalCode",
        "vcardCountry",
        "vcardBirthday",
        "vcardPhoto",
        "vcardPhotoUrl",
        "vcardNote"
    ],
    email: ["emailTo", "emailSubject", "emailBody"],
    sms: ["smsNumber", "smsMessage"],
    phone: ["phoneNumber"],
    geo: ["geoLatitude", "geoLongitude"],
    maps: ["geoLatitude", "geoLongitude", "mapsProvider", "mapsLabel"],
    calendar: ["calTitle", "calStart", "calEnd", "calAllDay", "calLocation", "calDescription"],
    whatsapp: ["waNumber", "waMessage"],
    telegram: ["tgUsername", "tgMessage"],
    epc: ["epcName", "epcIban", "epcBic", "epcAmount", "epcReference", "epcText", "epcPurpose"],
    bitcoin: ["btcAddress", "btcAmount", "btcLabel", "btcMessage"],
    paypal: ["paypalUser", "paypalAmount", "paypalCurrency"],
    promptpay: ["ppProxyType", "ppProxy", "ppAmount"],
    paynow: ["pnProxyType", "pnProxy", "pnMerchantName", "pnAmount", "pnEditable", "pnReference", "pnExpiry"]
};

const LIST_KEYS: Keys = [
    "dataSource",
    "listValue",
    "listLabel",
    "listFileName",
    "listLogoUrl",
    "listGap",
    "listEmptyText",
    "listLazyRender",
    "showDownloadZip",
    "showPrintSheet",
    "showDownloadPdf",
    "labelZip",
    "labelPrintSheet",
    "labelPdf",
    "sheetColumns",
    "sheetLabelWidth",
    "sheetLabelHeight",
    "sheetGap",
    "sheetShowLabel",
    "sheetTitle"
];
const SINGLE_ONLY_KEYS: Keys = [
    "payloadType",
    "caption",
    "base64Attribute",
    "base64Format",
    "base64DataUri",
    "saveDebounce",
    "onImageSaved",
    "showSave",
    "labelSave",
    "labelSaved",
    "scannableAttribute",
    "refreshInterval",
    "onRefresh",
    "expiresAt",
    "expiryLabel",
    "expiredLabel",
    "hideWhenExpired",
    "onExpire"
];

export function getProperties(values: StyledQRCodePreviewProps, defaultProperties: Properties): Properties {
    const hide = (keys: Keys): void => hidePropertiesIn(defaultProperties, values, keys);

    if (values.displayMode === "list") {
        hide(SINGLE_ONLY_KEYS);
        Object.values(PAYLOAD_KEYS).forEach(hide);
        const sheet = values.showPrintSheet || values.showDownloadPdf;
        if (!sheet) {
            hide(["sheetColumns", "sheetLabelWidth", "sheetLabelHeight", "sheetGap", "sheetShowLabel", "sheetTitle"]);
        }
        if (!values.showDownloadZip) {
            hide(["labelZip"]);
        }
        if (!values.showPrintSheet) {
            hide(["labelPrintSheet"]);
        }
        if (!values.showDownloadPdf) {
            hide(["labelPdf"]);
        }
    } else {
        hide(LIST_KEYS);
        const shown = new Set(PAYLOAD_KEYS[values.payloadType]);
        Object.values(PAYLOAD_KEYS).forEach(keys => hide(keys.filter(key => !shown.has(key))));
        if (!values.base64Attribute) {
            hide([
                "base64Format",
                "base64DataUri",
                "saveDebounce",
                "onImageSaved",
                "showSave",
                "labelSave",
                "labelSaved"
            ]);
        } else if (!values.showSave) {
            hide(["labelSave", "labelSaved"]);
        }
        if (!values.refreshInterval) {
            hide(["onRefresh"]);
        }
        if (!values.expiresAt) {
            hide(["expiryLabel", "expiredLabel", "hideWhenExpired", "onExpire"]);
        }
    }

    const gradientKeys = (
        prefix: "dots" | "cornersSquare" | "cornersDot" | "background",
        kind: StyledQRCodePreviewProps["dotsGradient"]
    ): void => {
        if (kind === "none") {
            hide([`${prefix}GradientEndColor`, `${prefix}GradientRotation`, `${prefix}GradientStops`] as Keys);
        } else if (kind === "radial") {
            hide([`${prefix}GradientRotation`] as Keys);
        }
    };
    gradientKeys("dots", values.dotsGradient);
    gradientKeys("cornersSquare", values.cornersSquareGradient);
    gradientKeys("cornersDot", values.cornersDotGradient);
    if (values.backgroundTransparent) {
        hide([
            "backgroundColor",
            "backgroundGradient",
            "backgroundGradientEndColor",
            "backgroundGradientRotation",
            "backgroundGradientStops"
        ]);
    } else {
        gradientKeys("background", values.backgroundGradient);
    }
    if (!values.logo && !values.logoUrl) {
        hide(["logoSize", "logoMargin", "hideBackgroundDots", "logoCrossOrigin"]);
    }
    if (!values.showFrame) {
        hide([
            "frameLabel",
            "frameLabelPosition",
            "frameStyle",
            "frameIcon",
            "frameFont",
            "frameColor",
            "frameTextColor",
            "frameRadius"
        ]);
    }
    if (!values.checkScannability) {
        hide(["scanWarning", "scannableAttribute"]);
    }

    const downloads =
        values.showDownloadPng || values.showDownloadSvg || values.showDownloadJpeg || values.showDownloadWebp;
    if (!downloads) {
        hide(["labelDownload"]);
    }
    if (!downloads && values.displayMode !== "list") {
        hide(["fileName"]);
    }
    if (!values.showCopy) {
        hide(["labelCopy", "labelCopied"]);
    }
    if (!values.showPrint) {
        hide(["labelPrint"]);
    }
    const anyButton =
        downloads ||
        values.showCopy ||
        values.showPrint ||
        values.showSave ||
        (values.displayMode === "list" && (values.showDownloadZip || values.showPrintSheet || values.showDownloadPdf));
    if (!anyButton) {
        hide(["buttonStyle", "toolbarPosition"]);
    }

    return defaultProperties;
}

export function check(values: StyledQRCodePreviewProps): Problem[] {
    const problems: Problem[] = [];
    const error = (property: keyof StyledQRCodePreviewProps, message: string): void => {
        problems.push({ property, severity: "error", message });
    };
    const warning = (property: keyof StyledQRCodePreviewProps, message: string): void => {
        problems.push({ property, severity: "warning", message });
    };
    const required = (property: keyof StyledQRCodePreviewProps, message: string): void => {
        if (!values[property]) {
            error(property, message);
        }
    };

    if (values.displayMode === "list") {
        if (!values.dataSource) {
            error("dataSource", "Select a data source, or set 'Render as' to 'Single QR code'.");
        } else if (!values.listValue) {
            error("listValue", "Set the value to encode for each object.");
        }
        if (
            (values.showPrintSheet || values.showDownloadPdf) &&
            ((values.sheetLabelWidth ?? 0) < 10 || (values.sheetLabelHeight ?? 0) < 10)
        ) {
            error("sheetLabelWidth", "Labels on the sheet must be at least 10 by 10 mm.");
        }
        if ((values.sheetColumns ?? 0) < 1) {
            error("sheetColumns", "The sheet needs at least one column.");
        }
    } else {
        switch (values.payloadType) {
            case "text":
                if (!values.value) {
                    warning("value", "No value is set, so the QR code stays empty.");
                }
                break;
            case "upi":
                required("upiVpa", "A UPI payment needs the payee VPA.");
                break;
            case "wifi":
                required("wifiSsid", "A Wi-Fi login needs the network name.");
                break;
            case "vcard":
                if (!values.vcardFirstName && !values.vcardLastName && !values.vcardOrganization) {
                    error("vcardFirstName", "A vCard needs at least a first name, last name or organization.");
                }
                if (values.vcardPhoto || values.vcardPhotoUrl) {
                    warning(
                        "vcardPhoto",
                        "An embedded photo makes the code very dense. Use a small (under 2 KB) image and a large code size."
                    );
                }
                break;
            case "email":
                required("emailTo", "An email payload needs a recipient.");
                break;
            case "sms":
                required("smsNumber", "An SMS payload needs a phone number.");
                break;
            case "phone":
                required("phoneNumber", "A phone call payload needs a phone number.");
                break;
            case "geo":
            case "maps":
                if (!values.geoLatitude || !values.geoLongitude) {
                    error("geoLatitude", "A location needs both a latitude and a longitude.");
                }
                break;
            case "calendar":
                required("calTitle", "A calendar event needs a title.");
                required("calStart", "A calendar event needs a start date and time.");
                break;
            case "whatsapp":
                required("waNumber", "A WhatsApp chat needs a phone number.");
                break;
            case "telegram":
                required("tgUsername", "A Telegram link needs a username.");
                break;
            case "epc":
                required("epcName", "A SEPA transfer needs the beneficiary name.");
                required("epcIban", "A SEPA transfer needs the IBAN.");
                if (values.epcReference && values.epcText) {
                    warning(
                        "epcText",
                        "EPC codes carry either a structured reference or remittance text; the text is ignored when a reference is set."
                    );
                }
                break;
            case "bitcoin":
                required("btcAddress", "A Bitcoin payment needs an address.");
                break;
            case "paypal":
                required("paypalUser", "A PayPal.Me link needs the PayPal.Me name.");
                break;
            case "promptpay":
                required("ppProxy", "PromptPay needs the mobile number, ID or e-Wallet ID.");
                break;
            case "paynow":
                required("pnProxy", "PayNow needs the mobile number or UEN.");
                break;
        }
        if (values.refreshInterval && values.refreshInterval > 0 && !values.onRefresh) {
            warning(
                "onRefresh",
                "A refresh interval is set but no 'On refresh' action, so nothing happens on each tick."
            );
        }
        if (values.refreshInterval && values.refreshInterval < 0) {
            error("refreshInterval", "The refresh interval cannot be negative. Use 0 to disable it.");
        }
        if ((values.saveDebounce ?? 0) < 0) {
            error("saveDebounce", "The save delay cannot be negative.");
        }
    }

    const size = values.size ?? 0;
    if (size < 40) {
        error("size", "The size must be at least 40 pixels.");
    }
    const typeNumber = values.typeNumber ?? 0;
    if (typeNumber < 0 || typeNumber > 40) {
        error("typeNumber", "The version must be between 0 (automatic) and 40.");
    }
    if ((values.maxPayloadLength ?? 0) < 1) {
        error("maxPayloadLength", "The maximum payload length must be at least 1.");
    }
    const logoSize = values.logoSize ?? 0;
    const hasLogo = Boolean(values.logo || values.logoUrl);
    if (hasLogo && (logoSize < 1 || logoSize > 100)) {
        error("logoSize", "The logo size must be between 1 and 100 percent.");
    }
    if (hasLogo && logoSize > 30 && values.errorCorrectionLevel !== "H") {
        warning(
            "errorCorrectionLevel",
            "With a logo larger than 30% use error correction 'H', or the code may no longer scan."
        );
    }
    if (hasLogo && logoSize > 50) {
        warning("logoSize", "A logo above 50% covers more than any error correction level can recover.");
    }
    const round = values.backgroundRound ?? 0;
    if (round < 0 || round > 100) {
        error("backgroundRound", "Corner rounding must be between 0 and 100 percent.");
    }
    for (const key of [
        "dotsGradientStops",
        "cornersSquareGradientStops",
        "cornersDotGradientStops",
        "backgroundGradientStops"
    ] as const) {
        const list = values[key] ?? [];
        if (list.length === 1) {
            warning(key, "A gradient needs at least two colour stops; a single stop is ignored.");
        }
        if (list.some(stop => (stop.stopOffset ?? 0) < 0 || (stop.stopOffset ?? 0) > 100)) {
            error(key, "Colour stop offsets must be between 0 and 100.");
        }
    }
    if (values.showFrame && !values.frameLabel) {
        warning("frameLabel", "The frame is shown without a label.");
    }
    if (values.backgroundTransparent && (values.showDownloadJpeg || values.base64Format === "jpeg")) {
        warning("backgroundTransparent", "JPEG has no transparency; transparent areas are exported on white.");
    }

    return problems;
}
