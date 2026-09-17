# Changelog

All notable changes to the Styled QR Code widget are documented here.

## [1.0.0] - 2026-09-17

First public release, built on qr-code-styling 1.9 and jsQR 1.4.

### Added

- Styling: six dot styles, separate corner square and corner dot styles, linear and radial gradients with
  optional colour-stop lists on dots, corners and background, transparent or rounded background, circle
  shape, SVG or canvas rendering, fixed size or fit-container sizing.
- Logo overlay from a static or dynamic image or a URL, with size, margin, hide-dots-behind-logo and
  cross-origin options.
- Frame with a label at the top, bottom, left or right, solid, outline or pill style, label icon, label
  font, colours and corner radius; included in downloads, copy and print.
- Payload templates: text/URL, UPI payment, Wi-Fi login, vCard 3.0/4.0 (address parts, birthday, photo,
  line folding), email, SMS, phone call, geo location, map link (Google, Apple, OpenStreetMap, geo URI),
  calendar event (iCalendar, all-day support), WhatsApp chat, Telegram, SEPA bank transfer (EPC069-12),
  Bitcoin URI, PayPal.Me, PromptPay (Thailand) and PayNow (Singapore) EMVCo codes with CRC-16.
- Save to Mendix: base64 of the rendered image (PNG, SVG, JPEG or WEBP) written to a String attribute
  after every render with a save delay, a Save now button and an On image saved action.
- Toolbar: download PNG, SVG, JPEG and WEBP, copy to clipboard, print; Atlas button styles and
  translatable labels.
- List mode: one code per object with label, file name and logo URL per object, render-when-visible for
  long lists, download all as ZIP, print label sheet and download label sheet as PDF (columns, label size,
  gap, captions, title).
- Dynamic codes: refresh interval with an On refresh action, expiry with countdown, blur and On expire,
  On render with the encoded value and the scannability result as variables, On click.
- Scannability self-check with jsQR, warning text and a Boolean attribute; maximum payload length guard
  with a translatable message.
- Accessibility: aria label, live regions, keyboard activation; render errors shown in place.
