# Orbital

A thoughtfully built, galaxy-inspired browser workspace. React 19, TypeScript, Vite, Express, Lucide icons.

## Run

Node.js 22.9+ required (24 recommended).

```sh
npm install
cp .env.example .env
npm run dev
# In another terminal:
npm run server
```

Open http://localhost:5173. Add a server-side `OPENAI_API_KEY` to `.env` for real AI responses. Without a key, the assistant clearly reports that it is not connected; no synthetic AI answers are generated. `npm run build` typechecks and builds the production UI. `npm test` runs the browser interaction suite against a running Vite instance (install Chromium first: `npx playwright install chromium`).

## What's working

- Personal, Study and Gaming profiles, plus unlimited locally created workspaces.
- Independent bookmarks, notes, themes, motion settings, widget order, tabs and saved sessions.
- Tab creation, switching, closing, recently closed restoration, URL/search resolution and local session restoration.
- In-app website views for pages that allow embedding, including YouTube video URLs through YouTube's privacy-enhanced embed player. Other sites can be opened directly in the host browser.
- Searchable bookmarks and local navigation history; history clearing.
- Six live theme presets, custom accent colors, reduced-motion support and local wallpaper upload.
- Pomodoro and break timer; persistent notes; dashboard widget visibility and drag ordering, with keyboard-accessible reorder buttons. Add custom website shortcut widgets to each workspace.
- Workspace snapshot saving/restoration and JSON export/import. Imports add workspaces and validate URLs.
- Command palette (Ctrl/Cmd+K), focus mode (Ctrl/Cmd+Shift+F), Escape to exit overlays.
- Real server-side AI API, request limits, timeouts, input validation, provider failure states, and explicit opt-in tab metadata sharing. Messages are memory-only; page text is never scraped.
- Responsive desktop, tablet and phone layout; semantic labels, visible focus rings and reduced-motion media queries.

## Capability boundaries

Orbital renders external pages in embedded frames when the destination permits it. Websites can block embedded views or limit sign-in, downloads, pop-ups, and other browser features; use “Open in browser” for those pages. YouTube video, Shorts, and live URLs are converted to YouTube's privacy-enhanced embed player. This web app is not a standalone browser engine. Host-browser downloads, private browsing, tracker blocking, pop-up blocking, per-site permissions, browser-wide history and live page summaries require an extension or desktop application. No fake tracker metrics or protection claims are displayed.

There is no account sync, full-page split view, tab grouping/pinning, marketplace backend, remote weather, uploaded video wallpaper, sounds, automatic tab organisation, website blocking, or autonomous AI action execution in this foundation. Custom profiles are not yet isolated OS browser sessions. Notes and preferences are unencrypted localStorage; do not store secrets. A blocked/full storage backend reports an error, and workspace export provides a backup. Images are shared on the device rather than profile-specific. Focus timer is in memory and pauses on profile switching.

## Structure

- `src/store.ts`: typed workspace domain, safe address resolution, defaults and storage loading.
- `src/main.tsx`: interactive application shell and feature panels.
- `src/styles.css`: responsive design system, cosmic backgrounds, accessible motion controls.
- `server/index.mjs`: same-origin production static server and private AI proxy.
- `tests/`: browser integration coverage.

Cosmic visuals use a bundled Unsplash nebula photograph with lightweight CSS gradients and a fixed number of twinkling stars, avoiding GPU-heavy particle canvases. Optional Google fonts gracefully fall back to system sans-serif. No analytics.

## Deploy

```sh
npm ci
npm run build
APP_ORIGIN=https://your-domain.example npm run server
```

Deploy the Node service behind HTTPS, with `PORT`, `APP_ORIGIN`, and server-only `OPENAI_API_KEY` configured in your host's secret manager. The server serves `dist/` and `/api` together. The dev proxy is only for local development. Configure trusted reverse proxies and a shared rate-limit store for multiple instances. Add authentication and per-user AI quotas before a public multi-user launch; the bundled API is intended for personal/local use, and origin checking is not authentication. Do not publish an unmetered API key-backed service.

## Desktop and extension roadmap

1. **Harden the foundation:** extract feature components, schema migrations and IndexedDB storage; more persistence/error tests; per-profile timers and backgrounds; folder-based bookmarks, named tab groups, pinned tabs and editable profiles.
2. **Electron browser host:** package a signed desktop app using sandboxed `WebContentsView` renderers; enforce `nodeIntegration: false`, `contextIsolation: true`, sandbox, strict IPC allowlists and no Node APIs in remote content. Implement a `BrowserAdapter` for navigate/back/forward/reload/open/close, and bind UI state to real engine events. Use separate session partitions per profile, nonpersistent partitions for private windows, and real navigation history and download events. Validate all navigation and deny unexpected permission requests by default. Build split views using two isolated content views.
3. **Privacy engine:** integrate a maintained blocking engine and regularly updated, licensed filter lists into the desktop session request pipeline. Start with opt-in network interception and per-site allowlists, then implement actual blocked-request counters and regression tests. An MV3 extension alternative uses `declarativeNetRequest`, minimal host permissions and a user-visible permission flow. A webpage alone cannot implement these protections.
4. **Contextual AI:** explicit per-page grants, isolated content extraction, prompt-injection-resistant context boundaries, provenance, expiring permissions and preview/confirmation for each sensitive action. Keep API calls server-side. Never forward full browsing history by default.
5. **Product infrastructure:** authenticated encrypted sync, conflict resolution, theme sharing/moderation, automatic updates, signed releases, accessibility audit, end-to-end browser-engine security testing and performance budgets.

This release is the working web foundation, not a claim of parity with a mature desktop browser.

