import { ReactElement, useCallback, useEffect, useMemo, useState } from "react";
import classNames from "classnames";
import { ActionValue, DynamicValue, EditableValue } from "mendix";
import { Big } from "big.js";

import { StyledQRCodeContainerProps } from "../typings/StyledQRCodeProps";
import { QRCodeView, ToolbarButton, ToolbarSpec } from "./components/QRCodeView";
import { buildPayload, PayloadFields, VcardPhoto } from "./utils/payload";
import { buildOptions, FrameSpec, StyleSettings } from "./utils/options";
import { blobToBase64, downloadBlob, frameLayout, renderBlob } from "./utils/export";
import { buildPdf, printSheet, safeFileName, SheetItem, SheetOptions, zipFiles } from "./utils/sheet";
import { toStyleSettings } from "./utils/settings";
import { useLatest } from "./utils/useLatest";

import "./ui/StyledQRCode.css";

const text = (value: DynamicValue<string> | undefined): string => value?.value ?? "";
const decimal = (value: DynamicValue<Big> | undefined, places = 2): string =>
    value?.value ? value.value.toFixed(places) : "";
const date = (value: DynamicValue<Date> | undefined): Date | undefined =>
    value?.value instanceof Date ? value.value : undefined;

function execute(action: ActionValue | undefined): void {
    if (action?.canExecute && !action.isExecuting) {
        action.execute();
    }
}

/** Writes to an attribute only when it is writable and the value actually changes, so nothing loops. */
function write<T extends string | boolean>(attribute: EditableValue<T> | undefined, value: T): boolean {
    if (!attribute || attribute.readOnly || attribute.value === value) {
        return false;
    }
    attribute.setValue(value);
    return true;
}

/** Loads an image URL as base64 for embedding in a vCard. */
async function loadPhoto(url: string): Promise<VcardPhoto | undefined> {
    const blob = await (await fetch(url)).blob();
    if (!blob.type.startsWith("image/")) {
        return undefined;
    }
    return { mime: blob.type, base64: await blobToBase64(blob) };
}

interface ListRow {
    id: string;
    data: string;
    label: string;
    fileName: string;
    settings: StyleSettings;
}

export function StyledQRCode(props: StyledQRCodeContainerProps): ReactElement {
    const {
        displayMode,
        payloadType,
        dataSource,
        listValue,
        listLabel,
        listFileName,
        listLogoUrl,
        listGap,
        listEmptyText,
        listLazyRender,
        showFrame,
        frameLabel,
        frameLabelPosition,
        frameStyle,
        frameIcon,
        frameFont,
        frameColor,
        frameTextColor,
        frameRadius,
        checkScannability,
        scanWarning,
        scannableAttribute,
        base64Attribute,
        base64Format,
        base64DataUri,
        saveDebounce,
        onImageSaved,
        refreshInterval,
        onRefresh,
        expiresAt,
        expiryLabel,
        expiredLabel,
        hideWhenExpired,
        onExpire,
        onClick,
        onRender,
        ariaLabel,
        maxPayloadLength,
        payloadTooLongText,
        sizeMode,
        class: className,
        style,
        tabIndex
    } = props;

    const logoUrl = props.logo?.value?.uri ?? text(props.logoUrl);
    const settings = toStyleSettings(props, logoUrl);
    const settingsKey = JSON.stringify(settings);

    const iconValue = frameIcon?.value;
    const frame: FrameSpec | undefined = showFrame
        ? {
              label: text(frameLabel),
              position: frameLabelPosition,
              style: frameStyle,
              color: frameColor || "#000000",
              textColor: frameTextColor || "#ffffff",
              radius: Math.max(0, frameRadius),
              font: frameFont ?? "",
              iconUrl: iconValue?.type === "image" ? iconValue.iconUrl : undefined,
              iconClass: iconValue && iconValue.type !== "image" ? iconValue.iconClass : undefined
          }
        : undefined;

    const toolbarBase: ToolbarSpec = {
        png: props.showDownloadPng,
        svg: props.showDownloadSvg,
        jpeg: props.showDownloadJpeg,
        webp: props.showDownloadWebp,
        copy: props.showCopy,
        print: props.showPrint,
        save: props.showSave && displayMode === "single" && Boolean(base64Attribute),
        fileName: text(props.fileName),
        buttonClass: `btn-${props.buttonStyle}`,
        position: props.toolbarPosition,
        labelDownload: text(props.labelDownload),
        labelCopy: text(props.labelCopy),
        labelCopied: text(props.labelCopied),
        labelPrint: text(props.labelPrint),
        labelSave: text(props.labelSave),
        labelSaved: text(props.labelSaved)
    };

    // Latest Mendix values for the async callbacks, without restarting effects on every render.
    const base64AttributeRef = useLatest(base64Attribute);
    const onImageSavedRef = useLatest(onImageSaved);
    const scannableAttributeRef = useLatest(scannableAttribute);
    const onRefreshRef = useLatest(onRefresh);
    const onExpireRef = useLatest(onExpire);
    const onClickRef = useLatest(onClick);
    const onRenderRef = useLatest(onRender);

    const saveBase64 = useCallback(
        (value: string): void => {
            if (write(base64AttributeRef.current, value)) {
                execute(onImageSavedRef.current);
            }
        },
        [base64AttributeRef, onImageSavedRef]
    );
    const saveScannable = useCallback(
        (scannable: boolean): void => {
            write(scannableAttributeRef.current, scannable);
        },
        [scannableAttributeRef]
    );
    const handleClick = useCallback((): void => execute(onClickRef.current), [onClickRef]);
    const handleExpire = useCallback((): void => execute(onExpireRef.current), [onExpireRef]);
    const handleRender = useCallback(
        (encodedValue: string, isScannable: boolean | undefined): void => {
            const action = onRenderRef.current;
            if (action?.canExecute && !action.isExecuting) {
                action.execute({ encodedValue, isScannable });
            }
        },
        [onRenderRef]
    );

    const hasRefresh = Boolean(onRefresh);
    useEffect(() => {
        if (refreshInterval <= 0 || !hasRefresh) {
            return;
        }
        const id = setInterval(() => execute(onRefreshRef.current), refreshInterval * 1000);
        return () => clearInterval(id);
    }, [refreshInterval, hasRefresh, onRefreshRef]);

    // vCard photo: fetched once per URL and embedded as base64.
    const photoUrl = payloadType === "vcard" ? props.vcardPhoto?.value?.uri ?? text(props.vcardPhotoUrl) : "";
    const [photo, setPhoto] = useState<{ url: string; photo: VcardPhoto | undefined } | undefined>(undefined);
    useEffect(() => {
        if (!photoUrl) {
            return;
        }
        let cancelled = false;
        loadPhoto(photoUrl)
            .then(loaded => {
                if (!cancelled) {
                    setPhoto({ url: photoUrl, photo: loaded });
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setPhoto({ url: photoUrl, photo: undefined });
                }
            });
        return () => {
            cancelled = true;
        };
    }, [photoUrl]);

    const commonView = {
        settings,
        frame,
        checkScannability,
        scanWarning: text(scanWarning),
        ariaLabel: text(ariaLabel),
        sizeMode,
        onClick: onClick ? handleClick : undefined,
        onRender: onRender ? handleRender : undefined
    };
    const limit = Math.max(1, maxPayloadLength || 1500);
    const tooLong = text(payloadTooLongText) || "The content is too long for a QR code.";
    const guard = (data: string): { data: string; notice?: string } =>
        data.length > limit ? { data: "", notice: tooLong } : { data };

    // ---------------------------------------------------------------- list mode
    const items = useMemo(() => (displayMode === "list" ? dataSource?.items ?? [] : []), [displayMode, dataSource]);
    const listRows = useMemo<ListRow[]>(
        () =>
            items.map(item => {
                const itemLogo = listLogoUrl?.get(item).value?.trim();
                return {
                    id: item.id,
                    data: (listValue?.get(item).value ?? "").trim(),
                    label: listLabel?.get(item).value ?? "",
                    fileName: listFileName?.get(item).value?.trim() || "",
                    settings: itemLogo ? { ...settings, logoUrl: itemLogo } : settings
                };
            }),
        // settingsKey captures the content of settings, which is rebuilt on every render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [items, listValue, listLabel, listFileName, listLogoUrl, settingsKey]
    );
    const [listBusy, setListBusy] = useState(false);

    const sheetOptions = (): SheetOptions => ({
        columns: Math.max(1, props.sheetColumns),
        labelWidthMm: props.sheetLabelWidth,
        labelHeightMm: props.sheetLabelHeight,
        gapMm: props.sheetGap,
        showLabel: props.sheetShowLabel,
        title: text(props.sheetTitle)
    });
    const baseName = (): string =>
        safeFileName(text(props.sheetTitle) || text(props.fileName) || "qr-codes") || "qr-codes";
    const rowName = (row: ListRow, index: number): string =>
        row.fileName || `${text(props.fileName) || "qr-code"}-${index + 1}`;

    const renderRows = async (
        extension: "png" | "jpeg"
    ): Promise<Array<{ row: ListRow; index: number; blob: Blob; width: number; height: number }>> => {
        const out: Array<{ row: ListRow; index: number; blob: Blob; width: number; height: number }> = [];
        const currentFrame = frame;
        let index = 0;
        for (const row of listRows) {
            const guarded = guard(row.data);
            const rowIndex = index++;
            if (!guarded.data) {
                continue;
            }
            const options = buildOptions(guarded.data, row.settings);
            const blob = await renderBlob(options, extension, currentFrame);
            if (!blob) {
                continue;
            }
            const size = options.width ?? row.settings.size;
            const layout = currentFrame ? frameLayout(size, currentFrame) : { width: size, height: size };
            out.push({ row, index: rowIndex, blob, width: layout.width, height: layout.height });
        }
        return out;
    };
    const runList = async (task: () => Promise<void>): Promise<void> => {
        if (listBusy) {
            return;
        }
        setListBusy(true);
        try {
            await task();
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error("Styled QR Code:", error);
        } finally {
            setListBusy(false);
        }
    };

    const listButtons: ToolbarButton[] = [];
    if (props.showDownloadZip) {
        listButtons.push({
            key: "zip",
            label: text(props.labelZip),
            onClick: () =>
                runList(async () => {
                    const rendered = await renderRows("png");
                    const files = await Promise.all(
                        rendered.map(async r => ({
                            name: rowName(r.row, r.index),
                            data: new Uint8Array(await r.blob.arrayBuffer())
                        }))
                    );
                    if (files.length) {
                        downloadBlob(zipFiles(files), `${baseName()}.zip`);
                    }
                })
        });
    }
    if (props.showPrintSheet) {
        listButtons.push({
            key: "printSheet",
            label: text(props.labelPrintSheet),
            onClick: () =>
                runList(async () => {
                    const rendered = await renderRows("png");
                    if (rendered.length) {
                        printSheet(
                            rendered.map(r => ({ url: URL.createObjectURL(r.blob), label: r.row.label })),
                            sheetOptions()
                        );
                    }
                })
        });
    }
    if (props.showDownloadPdf) {
        listButtons.push({
            key: "pdf",
            label: text(props.labelPdf),
            onClick: () =>
                runList(async () => {
                    const rendered = await renderRows("jpeg");
                    const sheetItems: SheetItem[] = await Promise.all(
                        rendered.map(async r => ({
                            name: rowName(r.row, r.index),
                            label: r.row.label,
                            jpeg: new Uint8Array(await r.blob.arrayBuffer()),
                            width: r.width,
                            height: r.height
                        }))
                    );
                    if (sheetItems.length) {
                        downloadBlob(buildPdf(sheetItems, sheetOptions()), `${baseName()}.pdf`);
                    }
                })
        });
    }

    if (displayMode === "list") {
        const loading = dataSource?.status === "loading" && items.length === 0;
        return (
            <div
                className={classNames("mxt-qr-list", className, {
                    "mxt-qr-list--loading": loading,
                    "mxt-qr-list--busy": listBusy
                })}
                style={{ ...style, gap: Math.max(0, listGap) }}
                tabIndex={tabIndex}
            >
                {listButtons.length > 0 && items.length > 0 && (
                    <div className="mxt-qr-list__toolbar">
                        {listButtons.map(b => (
                            <button
                                key={b.key}
                                type="button"
                                className={classNames("btn", toolbarBase.buttonClass, "mxt-qr__button")}
                                disabled={listBusy}
                                onClick={() => {
                                    b.onClick();
                                }}
                            >
                                {b.label}
                            </button>
                        ))}
                    </div>
                )}
                {listRows.map((row, index) => {
                    const guarded = guard(row.data);
                    return (
                        <QRCodeView
                            key={row.id}
                            {...commonView}
                            settings={row.settings}
                            data={guarded.data}
                            notice={guarded.notice}
                            caption={row.label}
                            toolbar={{ ...toolbarBase, save: false, fileName: rowName(row, index) }}
                            lazy={listLazyRender}
                        />
                    );
                })}
                {!loading && items.length === 0 && text(listEmptyText) && (
                    <div className="mxt-qr-list__empty">{text(listEmptyText)}</div>
                )}
            </div>
        );
    }

    // ---------------------------------------------------------------- single mode
    const fields: PayloadFields = {
        value: text(props.value),
        upiVpa: text(props.upiVpa),
        upiName: text(props.upiName),
        upiAmount: decimal(props.upiAmount),
        upiCurrency: text(props.upiCurrency),
        upiNote: text(props.upiNote),
        upiTransactionRef: text(props.upiTransactionRef),
        wifiSsid: text(props.wifiSsid),
        wifiPassword: text(props.wifiPassword),
        wifiEncryption: props.wifiEncryption,
        wifiHidden: props.wifiHidden?.value === true,
        vcardVersion: props.vcardVersion === "v4" ? "4.0" : "3.0",
        vcardFirstName: text(props.vcardFirstName),
        vcardLastName: text(props.vcardLastName),
        vcardOrganization: text(props.vcardOrganization),
        vcardTitle: text(props.vcardTitle),
        vcardPhone: text(props.vcardPhone),
        vcardMobile: text(props.vcardMobile),
        vcardHomePhone: text(props.vcardHomePhone),
        vcardEmail: text(props.vcardEmail),
        vcardWebsite: text(props.vcardWebsite),
        vcardAddress: text(props.vcardAddress),
        vcardStreet: text(props.vcardStreet),
        vcardCity: text(props.vcardCity),
        vcardRegion: text(props.vcardRegion),
        vcardPostalCode: text(props.vcardPostalCode),
        vcardCountry: text(props.vcardCountry),
        vcardBirthday: date(props.vcardBirthday),
        vcardNote: text(props.vcardNote),
        vcardPhoto: photo && photo.url === photoUrl ? photo.photo : undefined,
        emailTo: text(props.emailTo),
        emailSubject: text(props.emailSubject),
        emailBody: text(props.emailBody),
        smsNumber: text(props.smsNumber),
        smsMessage: text(props.smsMessage),
        phoneNumber: text(props.phoneNumber),
        geoLatitude: props.geoLatitude?.value?.toString() ?? "",
        geoLongitude: props.geoLongitude?.value?.toString() ?? "",
        mapsProvider: props.mapsProvider,
        mapsLabel: text(props.mapsLabel),
        calTitle: text(props.calTitle),
        calStart: date(props.calStart),
        calEnd: date(props.calEnd),
        calAllDay: props.calAllDay?.value === true,
        calLocation: text(props.calLocation),
        calDescription: text(props.calDescription),
        waNumber: text(props.waNumber),
        waMessage: text(props.waMessage),
        tgUsername: text(props.tgUsername),
        tgMessage: text(props.tgMessage),
        epcName: text(props.epcName),
        epcIban: text(props.epcIban),
        epcBic: text(props.epcBic),
        epcAmount: decimal(props.epcAmount),
        epcReference: text(props.epcReference),
        epcText: text(props.epcText),
        epcPurpose: text(props.epcPurpose),
        btcAddress: text(props.btcAddress),
        btcAmount: props.btcAmount?.value ? props.btcAmount.value.toString() : "",
        btcLabel: text(props.btcLabel),
        btcMessage: text(props.btcMessage),
        paypalUser: text(props.paypalUser),
        paypalAmount: decimal(props.paypalAmount),
        paypalCurrency: text(props.paypalCurrency),
        ppProxyType: props.ppProxyType,
        ppProxy: text(props.ppProxy),
        ppAmount: decimal(props.ppAmount),
        pnProxyType: props.pnProxyType,
        pnProxy: text(props.pnProxy),
        pnMerchantName: text(props.pnMerchantName),
        pnAmount: decimal(props.pnAmount),
        pnEditable: props.pnEditable?.value !== false,
        pnReference: text(props.pnReference),
        pnExpiry: date(props.pnExpiry)
    };
    const guarded = guard(buildPayload(payloadType, fields));

    const expiresAtValue = expiresAt?.value;
    const expiry =
        expiresAtValue instanceof Date
            ? {
                  at: expiresAtValue,
                  label: text(expiryLabel),
                  expiredLabel: text(expiredLabel),
                  blur: hideWhenExpired,
                  onExpire: handleExpire
              }
            : undefined;

    return (
        <QRCodeView
            {...commonView}
            data={guarded.data}
            notice={guarded.notice}
            caption={text(props.caption)}
            toolbar={toolbarBase}
            onScanResult={scannableAttribute ? saveScannable : undefined}
            base64={
                base64Attribute
                    ? {
                          format: base64Format,
                          dataUri: base64DataUri,
                          debounce: Math.max(0, saveDebounce),
                          onSaved: saveBase64
                      }
                    : undefined
            }
            expiry={expiry}
            className={className}
            style={style}
            tabIndex={tabIndex}
        />
    );
}
