/**
 * Builds the string a QR code encodes from the structured template fields.
 * Every builder returns "" when the fields that identify the payload are empty,
 * so the widget can show an empty state instead of a code that encodes nothing useful.
 */

export type PayloadType =
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
export type WifiEncryption = "WPA" | "WEP" | "nopass";
export type MapsProvider = "google" | "apple" | "osm" | "geo";

export interface VcardPhoto {
    /** e.g. "image/jpeg" */
    mime: string;
    base64: string;
}

export interface PayloadFields {
    value?: string;
    upiVpa?: string;
    upiName?: string;
    /** Already formatted amount, e.g. "150.00". */
    upiAmount?: string;
    upiCurrency?: string;
    upiNote?: string;
    upiTransactionRef?: string;
    wifiSsid?: string;
    wifiPassword?: string;
    wifiEncryption?: WifiEncryption;
    wifiHidden?: boolean;
    vcardVersion?: "3.0" | "4.0";
    vcardFirstName?: string;
    vcardLastName?: string;
    vcardOrganization?: string;
    vcardTitle?: string;
    vcardPhone?: string;
    vcardMobile?: string;
    vcardHomePhone?: string;
    vcardEmail?: string;
    vcardWebsite?: string;
    vcardAddress?: string;
    vcardStreet?: string;
    vcardCity?: string;
    vcardRegion?: string;
    vcardPostalCode?: string;
    vcardCountry?: string;
    vcardBirthday?: Date;
    vcardNote?: string;
    vcardPhoto?: VcardPhoto;
    emailTo?: string;
    emailSubject?: string;
    emailBody?: string;
    smsNumber?: string;
    smsMessage?: string;
    phoneNumber?: string;
    geoLatitude?: string;
    geoLongitude?: string;
    mapsProvider?: MapsProvider;
    mapsLabel?: string;
    calTitle?: string;
    calStart?: Date;
    calEnd?: Date;
    calAllDay?: boolean;
    calLocation?: string;
    calDescription?: string;
    waNumber?: string;
    waMessage?: string;
    tgUsername?: string;
    tgMessage?: string;
    epcName?: string;
    epcIban?: string;
    epcBic?: string;
    epcAmount?: string;
    epcReference?: string;
    epcText?: string;
    epcPurpose?: string;
    btcAddress?: string;
    btcAmount?: string;
    btcLabel?: string;
    btcMessage?: string;
    paypalUser?: string;
    paypalAmount?: string;
    paypalCurrency?: string;
    ppProxyType?: "mobile" | "nationalId" | "ewallet";
    ppProxy?: string;
    ppAmount?: string;
    pnProxyType?: "mobile" | "uen";
    pnProxy?: string;
    pnMerchantName?: string;
    pnAmount?: string;
    pnEditable?: boolean;
    pnReference?: string;
    pnExpiry?: Date;
}

const trim = (value: string | undefined): string => (value ?? "").trim();
const pad = (n: number, width = 2): string => String(n).padStart(width, "0");

/** Query string from key/value pairs, skipping empty values. */
function query(pairs: Array<[string, string | undefined]>): string {
    return pairs
        .filter((pair): pair is [string, string] => trim(pair[1]) !== "")
        .map(([key, value]) => `${key}=${encodeURIComponent(trim(value))}`)
        .join("&");
}

/** Escapes the characters the Wi-Fi network config format treats as special. */
export function escapeWifi(value: string): string {
    return value.replace(/([\\;,":])/g, "\\$1");
}

/** Escapes a vCard / iCalendar text value. */
export function escapeVcard(value: string): string {
    return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Removes everything that is not a digit, plus sign, star or hash from a phone number. */
export function normalizePhone(value: string): string {
    return value.replace(/[^\d+*#]/g, "");
}

/** RFC 6350 / 5545 line folding: lines longer than 75 octets continue on the next line after a space. */
export function foldLine(line: string): string {
    if (line.length <= 75) {
        return line;
    }
    const parts: string[] = [line.slice(0, 75)];
    for (let i = 75; i < line.length; i += 74) {
        parts.push(" " + line.slice(i, i + 74));
    }
    return parts.join("\r\n");
}

/** Date as iCalendar UTC timestamp, e.g. 20260916T083000Z. */
export function icalDateTime(date: Date): string {
    return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(
        date.getUTCHours()
    )}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

/** Date as YYYYMMDD in local time. */
export function icalDate(date: Date): string {
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

export function buildUpi(fields: PayloadFields): string {
    const vpa = trim(fields.upiVpa);
    if (!vpa) {
        return "";
    }
    const params = query([
        ["pa", vpa],
        ["pn", fields.upiName],
        ["am", fields.upiAmount],
        ["cu", trim(fields.upiCurrency) || "INR"],
        ["tn", fields.upiNote],
        ["tr", fields.upiTransactionRef]
    ]);
    return `upi://pay?${params}`;
}

export function buildWifi(fields: PayloadFields): string {
    const ssid = trim(fields.wifiSsid);
    if (!ssid) {
        return "";
    }
    const encryption = fields.wifiEncryption ?? "WPA";
    let payload = `WIFI:T:${encryption};S:${escapeWifi(ssid)};`;
    if (encryption !== "nopass" && trim(fields.wifiPassword)) {
        payload += `P:${escapeWifi(trim(fields.wifiPassword))};`;
    }
    if (fields.wifiHidden) {
        payload += "H:true;";
    }
    return `${payload};`;
}

export function buildVcard(fields: PayloadFields): string {
    const first = trim(fields.vcardFirstName);
    const last = trim(fields.vcardLastName);
    const organization = trim(fields.vcardOrganization);
    if (!first && !last && !organization) {
        return "";
    }
    const v4 = fields.vcardVersion === "4.0";
    const fullName = [first, last].filter(Boolean).join(" ") || organization;
    const lines = [
        "BEGIN:VCARD",
        `VERSION:${v4 ? "4.0" : "3.0"}`,
        `N:${escapeVcard(last)};${escapeVcard(first)};;;`,
        `FN:${escapeVcard(fullName)}`
    ];
    const add = (line: string, value: string | undefined): void => {
        if (trim(value)) {
            lines.push(`${line}:${escapeVcard(trim(value))}`);
        }
    };
    const tel = (type: string, value: string | undefined): void => {
        if (trim(value)) {
            lines.push(
                v4
                    ? `TEL;TYPE=${type.toLowerCase()};VALUE=uri:tel:${normalizePhone(trim(value))}`
                    : `TEL;TYPE=${type}:${trim(value)}`
            );
        }
    };
    add("ORG", organization);
    add("TITLE", fields.vcardTitle);
    tel("WORK,VOICE", fields.vcardPhone);
    tel("CELL", fields.vcardMobile);
    tel("HOME,VOICE", fields.vcardHomePhone);
    add(v4 ? "EMAIL" : "EMAIL;TYPE=INTERNET", fields.vcardEmail);
    add("URL", fields.vcardWebsite);
    const parts = [
        fields.vcardStreet,
        fields.vcardCity,
        fields.vcardRegion,
        fields.vcardPostalCode,
        fields.vcardCountry
    ].map(trim);
    if (parts.some(Boolean)) {
        lines.push(`ADR;TYPE=WORK:;;${parts.map(escapeVcard).join(";")}`);
    } else if (trim(fields.vcardAddress)) {
        lines.push(`ADR;TYPE=WORK:;;${escapeVcard(trim(fields.vcardAddress))};;;;`);
    }
    if (fields.vcardBirthday instanceof Date && !isNaN(fields.vcardBirthday.getTime())) {
        const d = fields.vcardBirthday;
        lines.push(v4 ? `BDAY:${icalDate(d)}` : `BDAY:${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    }
    if (fields.vcardPhoto?.base64) {
        const type = (fields.vcardPhoto.mime.split("/")[1] || "jpeg").toUpperCase();
        lines.push(
            v4
                ? `PHOTO:data:${fields.vcardPhoto.mime};base64,${fields.vcardPhoto.base64}`
                : `PHOTO;ENCODING=b;TYPE=${type}:${fields.vcardPhoto.base64}`
        );
    }
    add("NOTE", fields.vcardNote);
    lines.push("END:VCARD");
    return lines.map(foldLine).join("\r\n");
}

export function buildEmail(fields: PayloadFields): string {
    const to = trim(fields.emailTo);
    if (!to) {
        return "";
    }
    const params = query([
        ["subject", fields.emailSubject],
        ["body", fields.emailBody]
    ]);
    return `mailto:${to}${params ? `?${params}` : ""}`;
}

export function buildSms(fields: PayloadFields): string {
    const number = normalizePhone(trim(fields.smsNumber));
    if (!number) {
        return "";
    }
    return `SMSTO:${number}:${trim(fields.smsMessage)}`;
}

export function buildPhone(fields: PayloadFields): string {
    const number = normalizePhone(trim(fields.phoneNumber));
    return number ? `tel:${number}` : "";
}

export function buildGeo(fields: PayloadFields): string {
    const latitude = trim(fields.geoLatitude);
    const longitude = trim(fields.geoLongitude);
    if (!latitude || !longitude) {
        return "";
    }
    return `geo:${latitude},${longitude}`;
}

export function buildMaps(fields: PayloadFields): string {
    const lat = trim(fields.geoLatitude);
    const lng = trim(fields.geoLongitude);
    if (!lat || !lng) {
        return "";
    }
    const label = trim(fields.mapsLabel);
    switch (fields.mapsProvider ?? "google") {
        case "apple":
            return `https://maps.apple.com/?ll=${lat},${lng}${label ? `&q=${encodeURIComponent(label)}` : ""}`;
        case "osm":
            return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
        case "geo":
            return `geo:${lat},${lng}?q=${lat},${lng}${label ? `(${encodeURIComponent(label)})` : ""}`;
        default:
            return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }
}

export function buildCalendar(fields: PayloadFields): string {
    const title = trim(fields.calTitle);
    const start = fields.calStart;
    if (!title || !(start instanceof Date) || isNaN(start.getTime())) {
        return "";
    }
    const end =
        fields.calEnd instanceof Date && !isNaN(fields.calEnd.getTime())
            ? fields.calEnd
            : new Date(start.getTime() + 3600_000);
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", `SUMMARY:${escapeVcard(title)}`];
    if (fields.calAllDay) {
        const endDate = new Date(end.getTime());
        // DTEND of an all-day event is exclusive: the day after the last day.
        endDate.setDate(endDate.getDate() + 1);
        lines.push(`DTSTART;VALUE=DATE:${icalDate(start)}`, `DTEND;VALUE=DATE:${icalDate(endDate)}`);
    } else {
        lines.push(`DTSTART:${icalDateTime(start)}`, `DTEND:${icalDateTime(end)}`);
    }
    if (trim(fields.calLocation)) {
        lines.push(`LOCATION:${escapeVcard(trim(fields.calLocation))}`);
    }
    if (trim(fields.calDescription)) {
        lines.push(`DESCRIPTION:${escapeVcard(trim(fields.calDescription))}`);
    }
    lines.push("END:VEVENT", "END:VCALENDAR");
    return lines.map(foldLine).join("\r\n");
}

export function buildWhatsapp(fields: PayloadFields): string {
    const number = normalizePhone(trim(fields.waNumber)).replace(/^\+/, "");
    if (!number) {
        return "";
    }
    const message = trim(fields.waMessage);
    return `https://wa.me/${number}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

export function buildTelegram(fields: PayloadFields): string {
    const user = trim(fields.tgUsername).replace(/^@/, "");
    if (!user) {
        return "";
    }
    const message = trim(fields.tgMessage);
    return `https://t.me/${user}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

/** EPC069-12 (European Payments Council) "SEPA credit transfer" code, version 002. */
export function buildEpc(fields: PayloadFields): string {
    const name = trim(fields.epcName).slice(0, 70);
    const iban = trim(fields.epcIban).replace(/\s+/g, "").toUpperCase();
    if (!name || !iban) {
        return "";
    }
    const amount = trim(fields.epcAmount);
    const reference = trim(fields.epcReference);
    return [
        "BCD",
        "002",
        "1",
        "SCT",
        trim(fields.epcBic).replace(/\s+/g, "").toUpperCase(),
        name,
        iban,
        amount ? `EUR${amount}` : "",
        trim(fields.epcPurpose).slice(0, 4).toUpperCase(),
        reference.slice(0, 35),
        reference ? "" : trim(fields.epcText).slice(0, 140)
    ].join("\n");
}

export function buildBitcoin(fields: PayloadFields): string {
    const address = trim(fields.btcAddress);
    if (!address) {
        return "";
    }
    const params = query([
        ["amount", fields.btcAmount],
        ["label", fields.btcLabel],
        ["message", fields.btcMessage]
    ]);
    return `bitcoin:${address}${params ? `?${params}` : ""}`;
}

export function buildPaypal(fields: PayloadFields): string {
    const user = trim(fields.paypalUser).replace(/^.*paypal\.me\//i, "");
    if (!user) {
        return "";
    }
    const amount = trim(fields.paypalAmount);
    return `https://www.paypal.me/${user}${
        amount ? `/${amount}${(trim(fields.paypalCurrency) || "USD").toUpperCase()}` : ""
    }`;
}

// ---------------------------------------------------------------- EMVCo merchant-presented codes
/** One EMVCo TLV element: 2-digit id, 2-digit length, value. */
export const tlv = (id: string, value: string): string => `${id}${pad(value.length)}${value}`;

/** CRC-16/CCITT-FALSE as required by EMVCo (poly 0x1021, init 0xFFFF), upper-case hex. */
/* eslint-disable no-bitwise */
export function crc16(input: string): string {
    let crc = 0xffff;
    for (let i = 0; i < input.length; i++) {
        crc ^= input.charCodeAt(i) << 8;
        for (let bit = 0; bit < 8; bit++) {
            crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
        }
    }
    return crc.toString(16).toUpperCase().padStart(4, "0");
}
/* eslint-enable no-bitwise */

const emv = (elements: string[]): string => {
    const body = `${elements.join("")}6304`;
    return `${body}${crc16(body)}`;
};

/** Thai PromptPay (Bank of Thailand EMVCo profile). */
export function buildPromptPay(fields: PayloadFields): string {
    const raw = trim(fields.ppProxy).replace(/[^\d]/g, "");
    if (!raw) {
        return "";
    }
    const type = fields.ppProxyType ?? "mobile";
    let proxyId = "01";
    let proxy = raw;
    if (type === "mobile") {
        // 0066 + number without the leading 0 (or without a leading 66).
        proxy = `0066${raw.replace(/^0/, "").replace(/^66/, "")}`;
    } else if (type === "nationalId") {
        proxyId = "02";
    } else {
        proxyId = "03";
    }
    const amount = trim(fields.ppAmount);
    return emv([
        tlv("00", "01"),
        tlv("01", amount ? "12" : "11"),
        tlv("29", tlv("00", "A000000677010111") + tlv(proxyId, proxy)),
        tlv("53", "764"),
        ...(amount ? [tlv("54", amount)] : []),
        tlv("58", "TH")
    ]);
}

/** Singapore PayNow (SGQR EMVCo profile). */
export function buildPayNow(fields: PayloadFields): string {
    const proxyRaw = trim(fields.pnProxy);
    if (!proxyRaw) {
        return "";
    }
    const uen = fields.pnProxyType === "uen";
    const proxy = uen
        ? proxyRaw.toUpperCase().replace(/\s+/g, "")
        : `+${normalizePhone(proxyRaw)
              .replace(/^\+/, "")
              .replace(/^(?!65)/, "65")}`;
    const amount = trim(fields.pnAmount);
    const editable = fields.pnEditable === false ? "0" : "1";
    const account = [tlv("00", "SG.PAYNOW"), tlv("01", uen ? "2" : "0"), tlv("02", proxy), tlv("03", editable)];
    if (fields.pnExpiry instanceof Date && !isNaN(fields.pnExpiry.getTime())) {
        account.push(tlv("04", icalDate(fields.pnExpiry)));
    }
    const reference = trim(fields.pnReference);
    return emv([
        tlv("00", "01"),
        tlv("01", amount ? "12" : "11"),
        tlv("26", account.join("")),
        tlv("52", "0000"),
        tlv("53", "702"),
        ...(amount ? [tlv("54", amount)] : []),
        tlv("58", "SG"),
        tlv("59", (trim(fields.pnMerchantName) || "NA").slice(0, 25)),
        tlv("60", "Singapore"),
        ...(reference ? [tlv("62", tlv("01", reference.slice(0, 25)))] : [])
    ]);
}

export function buildPayload(type: PayloadType, fields: PayloadFields): string {
    switch (type) {
        case "upi":
            return buildUpi(fields);
        case "wifi":
            return buildWifi(fields);
        case "vcard":
            return buildVcard(fields);
        case "email":
            return buildEmail(fields);
        case "sms":
            return buildSms(fields);
        case "phone":
            return buildPhone(fields);
        case "geo":
            return buildGeo(fields);
        case "maps":
            return buildMaps(fields);
        case "calendar":
            return buildCalendar(fields);
        case "whatsapp":
            return buildWhatsapp(fields);
        case "telegram":
            return buildTelegram(fields);
        case "epc":
            return buildEpc(fields);
        case "bitcoin":
            return buildBitcoin(fields);
        case "paypal":
            return buildPaypal(fields);
        case "promptpay":
            return buildPromptPay(fields);
        case "paynow":
            return buildPayNow(fields);
        default:
            return trim(fields.value);
    }
}
