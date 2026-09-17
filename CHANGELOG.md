# Changelog

All notable changes to the Styled QR Code widget are documented here.

## [1.1.0] - 2026-09-16

### Added

- Payload templates: map link (Google, Apple, OpenStreetMap, geo URI), calendar event (iCalendar, all-day
  support), WhatsApp chat, Telegram, SEPA bank transfer (EPC069-12), Bitcoin URI, PayPal.Me, PromptPay
  (Thailand) and PayNow (Singapore) EMVCo codes with CRC-16.
- vCard: version 3.0 or 4.0, home phone, birthday, address parts, embedded photo (image or URL), line folding.
- Multi-stop gradients: optional colour-stop lists for dots, corner squares, corner dots and background.
- Frame styles (solid, outline, pill), label on the left or right, label icon (image icons are exported too),
  custom label font.
- "Fit container" sizing mode.
- Save now button next to the automatic base64 save, and a save delay (debounce) so typing does not write
  on every keystroke.
- List mode: file name and logo URL per object, render-when-visible for long lists, download all as ZIP,
  print label sheet and download label sheet as PDF (columns, label size, gap, captions, title).
- On render action with the encoded value and the scannability result as variables.
- Maximum payload length guard with a translatable message instead of a failed render.
- Companion widget: Styled QR Scanner (separate package) reads codes back with the camera or from an image.

### Changed

- Enumeration keys use camelCase (`extraRounded`, `classyRounded`, `useCredentials`) because Studio Pro
  does not allow hyphens in keys.
- The library instance is recreated on every change, which fixes stale logos and export sizes after edits.

## [1.0.0] - 2026-09-15

### Added

- First release, built on qr-code-styling 1.9 and jsQR 1.4.
- Styling: six dot styles, separate corner square and corner dot styles, linear and radial gradients on dots,
  corners and background, transparent or rounded background, circle shape, SVG or canvas rendering.
- Logo overlay from a static or dynamic image or a URL, with size, margin, hide-dots-behind-logo and cross-origin.
- "Scan me" frame with label position, colors and corner radius; included in downloads, copy and print.
- Payload templates: text/URL, UPI payment, Wi-Fi login, vCard 3.0, email, SMS, phone call, geo location.
- Save to Mendix: base64 (PNG, SVG, JPEG, WEBP, optional data URI prefix) written to a String attribute after
  every render, with an On image saved action.
- Toolbar: download PNG / SVG / JPEG / WEBP, copy to clipboard, print; translatable labels, Atlas button styles.
- Dynamic codes: refresh interval with On refresh action, expiry countdown with `[time]` placeholder, blur and
  Expired label after expiry, On expire action.
- Scannability check: the rendered code is decoded again with jsQR; a warning is shown and an optional Boolean
  attribute is written.
- List mode: one code per data source object with a value and label expression per object.
- Encoding options: error correction level, fixed version (type number), encoding mode.
- On click action, aria label, Studio Pro design preview that renders the real code with the chosen styling.
