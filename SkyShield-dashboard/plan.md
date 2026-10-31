# SkyShield implementation plan

## Product outcome
A polished, responsive single-page aviation safety operations prototype that opens with a cinematic Earth-rotation video landing screen, then transitions into a credible incident intelligence workspace. Users can browse aircraft blueprint cards, open an aircraft-specific incident report, inspect root-cause analysis and safety metrics, and review compliance readiness.

## Serving approach
Use a static Vite/React SPA. The content is prototype data embedded in the client and interactions are local, so a server/database is not required for this stage. The build output will be `dist/`, and the static app will use browser routing only for the root route; the current source route manifest contains `/`.

## Structure
- `src/main.tsx` — React entry point.
- `src/App.tsx` — landing/dashboard/application state and interaction model.
- `src/styles.css` — responsive operations-console styling, motion, blueprint visuals, charts, and accessibility states.
- `public/earth-rotation.mp4` — supplied landing video.
- `public/manus-routes.json` — current route manifest.
- `public/skyshield-mark.svg` — source logo mark.
- `app.config.ts` — platform logo metadata.

## Interaction model
- Landing `Enter workspace` CTA toggles into the dashboard with a short transition.
- Dashboard sidebar nav switches between Overview, Incidents, Analysis, and Compliance views.
- Plane cards set the active aircraft and open the report view.
- Incident report fields are controlled inputs; submit adds a local draft record and surfaces a success state without pretending it is persisted remotely.
- Metric cards, incident rows, and compliance rows are keyboard-focusable where actionable.

## Visual direction
Deep navy operations-console base, ice-blue lines, restrained amber severity signal, white/blue-gray typography, technical grid overlays, thin rules, blueprint aircraft silhouettes, and subtle 3D depth. Avoid ornamental clutter and heavy gradients. Use Inter/system sans for clarity and a compact mono label style for aviation metadata.

## Verification
Use TypeScript diagnostics, a production build, and a local HTTP readiness check. Confirm the route manifest returns JSON over HTTP and the app references the supplied video asset. Use the Web Dev screenshot tool only if a concrete visual defect needs inspection; visual interaction is represented in source-level controls and responsive CSS.
