/**
 * This file was generated from StyledQRCode.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import {
    ActionValue,
    DynamicValue,
    EditableValue,
    ListExpressionValue,
    ListValue,
    Option,
    WebIcon,
    WebImage
} from "mendix";
import { Big } from "big.js";
import { CSSProperties } from "react";

export type DisplayModeEnum = "single" | "list";

export type PayloadTypeEnum =
    | "text"
    | "upi"
    | "wifi"
    | "vcard"
    | "email"
    | "sms"
    | "phone"
    | "geo"
    | "maps"
    | "calendar"
    | "whatsapp"
    | "telegram"
    | "epc"
    | "bitcoin"
    | "paypal"
    | "promptpay"
    | "paynow";

export type WifiEncryptionEnum = "WPA" | "WEP" | "nopass";

export type VcardVersionEnum = "v3" | "v4";

export type MapsProviderEnum = "google" | "apple" | "osm" | "geo";

export type PpProxyTypeEnum = "mobile" | "nationalId" | "ewallet";

export type PnProxyTypeEnum = "mobile" | "uen";

export type SizeModeEnum = "fixed" | "fit";

export type ShapeEnum = "square" | "circle";

export type RenderTypeEnum = "svg" | "canvas";

export type DotsTypeEnum = "square" | "dots" | "rounded" | "extraRounded" | "classy" | "classyRounded";

export type DotsGradientEnum = "none" | "linear" | "radial";

export interface DotsGradientStopsType {
    stopOffset: number;
    stopColor: string;
}

export type CornersSquareTypeEnum =
    | "default"
    | "square"
    | "dot"
    | "extraRounded"
    | "rounded"
    | "dots"
    | "classy"
    | "classyRounded";

export type CornersSquareGradientEnum = "none" | "linear" | "radial";

export interface CornersSquareGradientStopsType {
    stopOffset: number;
    stopColor: string;
}

export type CornersDotTypeEnum =
    | "default"
    | "square"
    | "dot"
    | "rounded"
    | "extraRounded"
    | "dots"
    | "classy"
    | "classyRounded";

export type CornersDotGradientEnum = "none" | "linear" | "radial";

export interface CornersDotGradientStopsType {
    stopOffset: number;
    stopColor: string;
}

export type BackgroundGradientEnum = "none" | "linear" | "radial";

export interface BackgroundGradientStopsType {
    stopOffset: number;
    stopColor: string;
}

export type LogoCrossOriginEnum = "anonymous" | "useCredentials" | "none";

export type FrameLabelPositionEnum = "bottom" | "top" | "left" | "right";

export type FrameStyleEnum = "solid" | "outline" | "pill";

export type ErrorCorrectionLevelEnum = "L" | "M" | "Q" | "H";

export type EncodingModeEnum = "auto" | "Numeric" | "Alphanumeric" | "Byte" | "Kanji";

export type ButtonStyleEnum = "default" | "primary" | "secondary" | "link";

export type ToolbarPositionEnum = "bottom" | "top";

export type Base64FormatEnum = "png" | "svg" | "jpeg" | "webp";

export interface DotsGradientStopsPreviewType {
    stopOffset: number | null;
    stopColor: string;
}

export interface CornersSquareGradientStopsPreviewType {
    stopOffset: number | null;
    stopColor: string;
}

export interface CornersDotGradientStopsPreviewType {
    stopOffset: number | null;
    stopColor: string;
}

export interface BackgroundGradientStopsPreviewType {
    stopOffset: number | null;
    stopColor: string;
}

export interface StyledQRCodeContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    displayMode: DisplayModeEnum;
    payloadType: PayloadTypeEnum;
    value?: DynamicValue<string>;
    caption?: DynamicValue<string>;
    upiVpa?: DynamicValue<string>;
    upiName?: DynamicValue<string>;
    upiAmount?: DynamicValue<Big>;
    upiCurrency?: DynamicValue<string>;
    upiNote?: DynamicValue<string>;
    upiTransactionRef?: DynamicValue<string>;
    wifiSsid?: DynamicValue<string>;
    wifiPassword?: DynamicValue<string>;
    wifiEncryption: WifiEncryptionEnum;
    wifiHidden?: DynamicValue<boolean>;
    vcardFirstName?: DynamicValue<string>;
    vcardLastName?: DynamicValue<string>;
    vcardOrganization?: DynamicValue<string>;
    vcardTitle?: DynamicValue<string>;
    vcardPhone?: DynamicValue<string>;
    vcardMobile?: DynamicValue<string>;
    vcardEmail?: DynamicValue<string>;
    vcardWebsite?: DynamicValue<string>;
    vcardAddress?: DynamicValue<string>;
    vcardNote?: DynamicValue<string>;
    vcardVersion: VcardVersionEnum;
    vcardHomePhone?: DynamicValue<string>;
    vcardBirthday?: DynamicValue<Date>;
    vcardStreet?: DynamicValue<string>;
    vcardCity?: DynamicValue<string>;
    vcardRegion?: DynamicValue<string>;
    vcardPostalCode?: DynamicValue<string>;
    vcardCountry?: DynamicValue<string>;
    vcardPhoto?: DynamicValue<WebImage>;
    vcardPhotoUrl?: DynamicValue<string>;
    emailTo?: DynamicValue<string>;
    emailSubject?: DynamicValue<string>;
    emailBody?: DynamicValue<string>;
    smsNumber?: DynamicValue<string>;
    smsMessage?: DynamicValue<string>;
    phoneNumber?: DynamicValue<string>;
    geoLatitude?: DynamicValue<Big>;
    geoLongitude?: DynamicValue<Big>;
    mapsProvider: MapsProviderEnum;
    mapsLabel?: DynamicValue<string>;
    calTitle?: DynamicValue<string>;
    calStart?: DynamicValue<Date>;
    calEnd?: DynamicValue<Date>;
    calAllDay?: DynamicValue<boolean>;
    calLocation?: DynamicValue<string>;
    calDescription?: DynamicValue<string>;
    waNumber?: DynamicValue<string>;
    waMessage?: DynamicValue<string>;
    tgUsername?: DynamicValue<string>;
    tgMessage?: DynamicValue<string>;
    epcName?: DynamicValue<string>;
    epcIban?: DynamicValue<string>;
    epcBic?: DynamicValue<string>;
    epcAmount?: DynamicValue<Big>;
    epcReference?: DynamicValue<string>;
    epcText?: DynamicValue<string>;
    epcPurpose?: DynamicValue<string>;
    btcAddress?: DynamicValue<string>;
    btcAmount?: DynamicValue<Big>;
    btcLabel?: DynamicValue<string>;
    btcMessage?: DynamicValue<string>;
    paypalUser?: DynamicValue<string>;
    paypalAmount?: DynamicValue<Big>;
    paypalCurrency?: DynamicValue<string>;
    ppProxyType: PpProxyTypeEnum;
    ppProxy?: DynamicValue<string>;
    ppAmount?: DynamicValue<Big>;
    pnProxyType: PnProxyTypeEnum;
    pnProxy?: DynamicValue<string>;
    pnMerchantName?: DynamicValue<string>;
    pnAmount?: DynamicValue<Big>;
    pnEditable?: DynamicValue<boolean>;
    pnReference?: DynamicValue<string>;
    pnExpiry?: DynamicValue<Date>;
    dataSource?: ListValue;
    listValue?: ListExpressionValue<string>;
    listLabel?: ListExpressionValue<string>;
    listGap: number;
    listFileName?: ListExpressionValue<string>;
    listLogoUrl?: ListExpressionValue<string>;
    listLazyRender: boolean;
    listEmptyText?: DynamicValue<string>;
    size: number;
    sizeMode: SizeModeEnum;
    margin: number;
    shape: ShapeEnum;
    renderType: RenderTypeEnum;
    dotsType: DotsTypeEnum;
    dotsColor: string;
    dotsGradient: DotsGradientEnum;
    dotsGradientEndColor: string;
    dotsGradientRotation: number;
    dotsGradientStops: DotsGradientStopsType[];
    dotsRoundSize: boolean;
    cornersSquareType: CornersSquareTypeEnum;
    cornersSquareColor: string;
    cornersSquareGradient: CornersSquareGradientEnum;
    cornersSquareGradientEndColor: string;
    cornersSquareGradientRotation: number;
    cornersSquareGradientStops: CornersSquareGradientStopsType[];
    cornersDotType: CornersDotTypeEnum;
    cornersDotColor: string;
    cornersDotGradient: CornersDotGradientEnum;
    cornersDotGradientEndColor: string;
    cornersDotGradientRotation: number;
    cornersDotGradientStops: CornersDotGradientStopsType[];
    backgroundTransparent: boolean;
    backgroundColor: string;
    backgroundRound: number;
    backgroundGradient: BackgroundGradientEnum;
    backgroundGradientEndColor: string;
    backgroundGradientRotation: number;
    backgroundGradientStops: BackgroundGradientStopsType[];
    logo?: DynamicValue<WebImage>;
    logoUrl?: DynamicValue<string>;
    logoSize: number;
    logoMargin: number;
    hideBackgroundDots: boolean;
    logoCrossOrigin: LogoCrossOriginEnum;
    showFrame: boolean;
    frameLabel?: DynamicValue<string>;
    frameLabelPosition: FrameLabelPositionEnum;
    frameStyle: FrameStyleEnum;
    frameIcon?: DynamicValue<WebIcon>;
    frameFont: string;
    frameColor: string;
    frameTextColor: string;
    frameRadius: number;
    errorCorrectionLevel: ErrorCorrectionLevelEnum;
    typeNumber: number;
    encodingMode: EncodingModeEnum;
    maxPayloadLength: number;
    payloadTooLongText?: DynamicValue<string>;
    checkScannability: boolean;
    scanWarning?: DynamicValue<string>;
    scannableAttribute?: EditableValue<boolean>;
    showDownloadPng: boolean;
    showDownloadSvg: boolean;
    showDownloadJpeg: boolean;
    showDownloadWebp: boolean;
    showCopy: boolean;
    showPrint: boolean;
    showSave: boolean;
    showDownloadZip: boolean;
    showPrintSheet: boolean;
    showDownloadPdf: boolean;
    fileName?: DynamicValue<string>;
    buttonStyle: ButtonStyleEnum;
    toolbarPosition: ToolbarPositionEnum;
    labelDownload?: DynamicValue<string>;
    labelCopy?: DynamicValue<string>;
    labelCopied?: DynamicValue<string>;
    labelPrint?: DynamicValue<string>;
    labelSave?: DynamicValue<string>;
    labelSaved?: DynamicValue<string>;
    labelZip?: DynamicValue<string>;
    labelPrintSheet?: DynamicValue<string>;
    labelPdf?: DynamicValue<string>;
    sheetColumns: number;
    sheetLabelWidth: number;
    sheetLabelHeight: number;
    sheetGap: number;
    sheetShowLabel: boolean;
    sheetTitle?: DynamicValue<string>;
    base64Attribute?: EditableValue<string>;
    base64Format: Base64FormatEnum;
    base64DataUri: boolean;
    saveDebounce: number;
    onImageSaved?: ActionValue;
    refreshInterval: number;
    onRefresh?: ActionValue;
    expiresAt?: DynamicValue<Date>;
    expiryLabel?: DynamicValue<string>;
    expiredLabel?: DynamicValue<string>;
    hideWhenExpired: boolean;
    onExpire?: ActionValue;
    onClick?: ActionValue;
    onRender?: ActionValue<{ encodedValue: Option<string>; isScannable: Option<boolean> }>;
    ariaLabel?: DynamicValue<string>;
}

export interface StyledQRCodePreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    renderMode: "design" | "xray" | "structure";
    translate: (text: string) => string;
    displayMode: DisplayModeEnum;
    payloadType: PayloadTypeEnum;
    value: string;
    caption: string;
    upiVpa: string;
    upiName: string;
    upiAmount: string;
    upiCurrency: string;
    upiNote: string;
    upiTransactionRef: string;
    wifiSsid: string;
    wifiPassword: string;
    wifiEncryption: WifiEncryptionEnum;
    wifiHidden: string;
    vcardFirstName: string;
    vcardLastName: string;
    vcardOrganization: string;
    vcardTitle: string;
    vcardPhone: string;
    vcardMobile: string;
    vcardEmail: string;
    vcardWebsite: string;
    vcardAddress: string;
    vcardNote: string;
    vcardVersion: VcardVersionEnum;
    vcardHomePhone: string;
    vcardBirthday: string;
    vcardStreet: string;
    vcardCity: string;
    vcardRegion: string;
    vcardPostalCode: string;
    vcardCountry: string;
    vcardPhoto: { type: "static"; imageUrl: string } | { type: "dynamic"; entity: string } | null;
    vcardPhotoUrl: string;
    emailTo: string;
    emailSubject: string;
    emailBody: string;
    smsNumber: string;
    smsMessage: string;
    phoneNumber: string;
    geoLatitude: string;
    geoLongitude: string;
    mapsProvider: MapsProviderEnum;
    mapsLabel: string;
    calTitle: string;
    calStart: string;
    calEnd: string;
    calAllDay: string;
    calLocation: string;
    calDescription: string;
    waNumber: string;
    waMessage: string;
    tgUsername: string;
    tgMessage: string;
    epcName: string;
    epcIban: string;
    epcBic: string;
    epcAmount: string;
    epcReference: string;
    epcText: string;
    epcPurpose: string;
    btcAddress: string;
    btcAmount: string;
    btcLabel: string;
    btcMessage: string;
    paypalUser: string;
    paypalAmount: string;
    paypalCurrency: string;
    ppProxyType: PpProxyTypeEnum;
    ppProxy: string;
    ppAmount: string;
    pnProxyType: PnProxyTypeEnum;
    pnProxy: string;
    pnMerchantName: string;
    pnAmount: string;
    pnEditable: string;
    pnReference: string;
    pnExpiry: string;
    dataSource: {} | { caption: string } | { type: string } | null;
    listValue: string;
    listLabel: string;
    listGap: number | null;
    listFileName: string;
    listLogoUrl: string;
    listLazyRender: boolean;
    listEmptyText: string;
    size: number | null;
    sizeMode: SizeModeEnum;
    margin: number | null;
    shape: ShapeEnum;
    renderType: RenderTypeEnum;
    dotsType: DotsTypeEnum;
    dotsColor: string;
    dotsGradient: DotsGradientEnum;
    dotsGradientEndColor: string;
    dotsGradientRotation: number | null;
    dotsGradientStops: DotsGradientStopsPreviewType[];
    dotsRoundSize: boolean;
    cornersSquareType: CornersSquareTypeEnum;
    cornersSquareColor: string;
    cornersSquareGradient: CornersSquareGradientEnum;
    cornersSquareGradientEndColor: string;
    cornersSquareGradientRotation: number | null;
    cornersSquareGradientStops: CornersSquareGradientStopsPreviewType[];
    cornersDotType: CornersDotTypeEnum;
    cornersDotColor: string;
    cornersDotGradient: CornersDotGradientEnum;
    cornersDotGradientEndColor: string;
    cornersDotGradientRotation: number | null;
    cornersDotGradientStops: CornersDotGradientStopsPreviewType[];
    backgroundTransparent: boolean;
    backgroundColor: string;
    backgroundRound: number | null;
    backgroundGradient: BackgroundGradientEnum;
    backgroundGradientEndColor: string;
    backgroundGradientRotation: number | null;
    backgroundGradientStops: BackgroundGradientStopsPreviewType[];
    logo: { type: "static"; imageUrl: string } | { type: "dynamic"; entity: string } | null;
    logoUrl: string;
    logoSize: number | null;
    logoMargin: number | null;
    hideBackgroundDots: boolean;
    logoCrossOrigin: LogoCrossOriginEnum;
    showFrame: boolean;
    frameLabel: string;
    frameLabelPosition: FrameLabelPositionEnum;
    frameStyle: FrameStyleEnum;
    frameIcon:
        | { type: "glyph"; iconClass: string }
        | { type: "image"; imageUrl: string; iconUrl: string }
        | { type: "icon"; iconClass: string }
        | undefined;
    frameFont: string;
    frameColor: string;
    frameTextColor: string;
    frameRadius: number | null;
    errorCorrectionLevel: ErrorCorrectionLevelEnum;
    typeNumber: number | null;
    encodingMode: EncodingModeEnum;
    maxPayloadLength: number | null;
    payloadTooLongText: string;
    checkScannability: boolean;
    scanWarning: string;
    scannableAttribute: string;
    showDownloadPng: boolean;
    showDownloadSvg: boolean;
    showDownloadJpeg: boolean;
    showDownloadWebp: boolean;
    showCopy: boolean;
    showPrint: boolean;
    showSave: boolean;
    showDownloadZip: boolean;
    showPrintSheet: boolean;
    showDownloadPdf: boolean;
    fileName: string;
    buttonStyle: ButtonStyleEnum;
    toolbarPosition: ToolbarPositionEnum;
    labelDownload: string;
    labelCopy: string;
    labelCopied: string;
    labelPrint: string;
    labelSave: string;
    labelSaved: string;
    labelZip: string;
    labelPrintSheet: string;
    labelPdf: string;
    sheetColumns: number | null;
    sheetLabelWidth: number | null;
    sheetLabelHeight: number | null;
    sheetGap: number | null;
    sheetShowLabel: boolean;
    sheetTitle: string;
    base64Attribute: string;
    base64Format: Base64FormatEnum;
    base64DataUri: boolean;
    saveDebounce: number | null;
    onImageSaved: {} | null;
    refreshInterval: number | null;
    onRefresh: {} | null;
    expiresAt: string;
    expiryLabel: string;
    expiredLabel: string;
    hideWhenExpired: boolean;
    onExpire: {} | null;
    onClick: {} | null;
    onRender: {} | null;
    ariaLabel: string;
}
