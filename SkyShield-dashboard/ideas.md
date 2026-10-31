# SkyShield design brief

## Direction
**Aviation operations / night-flight control room** — calm, exact, and professional rather than decorative. The landing page treats the rotating Earth as a quiet global safety signal, then hands off to a clean control-room dashboard.

## Design movement
Precision dashboard minimalism with blueprint linework and restrained aerospace instrumentation.

## Core principles
1. Make safety status legible in under three seconds.
2. Use depth and motion to establish confidence, never to distract.
3. Keep controls crisp, high contrast, and keyboard-friendly.
4. Favor operational hierarchy over decorative cards.

## Color philosophy
Deep navy `#07111f` and `#0b1c2f` create an air-traffic-at-night foundation. Ice-blue `#7dd3fc` and cyan `#5eead4` indicate healthy telemetry. Signal amber `#f2b84b` flags attention; coral `#f57c7c` is reserved for critical severity. Surfaces use blue-black translucency and thin cool borders.

## Layout paradigm
Landing: full viewport with left-weighted wordmark and message, right-side data readouts, and a clear bottom action. App: fixed rail + responsive content canvas, with wide KPI row, aircraft card grid, and two-column intelligence panels.

## Signature elements
Blueprint aircraft silhouettes, tiny uppercase metadata, confidence/status pills, fine technical grid, progress bars, sparkline-style SVG charts, and a slim incident severity strip.

## Interaction philosophy
Fast and reversible. Cards highlight on hover/focus, views change without route reload, and submitted forms immediately become a local “draft received” record with a visible acknowledgement.

## Animation
Slow orbital motion from the supplied video, subtle fade/slide into the app shell, card lift on hover, short progress and chart reveals. Respect `prefers-reduced-motion`.

## Typography system
Inter/system sans for headings and body; `ui-monospace` for flight IDs, timestamps, and technical labels. Large landing title with tight tracking; compact dashboard labels with generous line height.

## Brand essence and voice
Confident, calm, evidence-led, globally aware. Voice: “See the signal. Close the loop.”

## Wordmark/logo
A minimal shield silhouette intersected by a flight-path line and a small star/point. Use the same mark in the sidebar and favicon; no gradients or tiny details.

## Signature brand color
Ice-blue `#7dd3fc`, with amber as a semantic signal rather than a brand color.
