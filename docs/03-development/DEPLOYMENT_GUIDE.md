# DocuID Deployment Guide

## Overview

The DocuID Office Add-in is deployed as a static build on Vercel at `https://addon.docuid.net`. Production manifests already reference this domain — no URL changes are needed for standard deployments.

The add-in is live on Microsoft AppSource: [https://marketplace.microsoft.com/en-us/product/wa200010668?tab=overview](https://marketplace.microsoft.com/en-us/product/wa200010668?tab=overview)

---

## Deployment Architecture

```
Development              Production
localhost:3000    -->    addon.docuid.net (Vercel)
*-dev.xml manifests      manifest*.xml (prod manifests)
```

Vercel handles SSL automatically. There is no separate staging environment — test against the live production build using `bun run start:*` commands with the production manifests.

---

## Standard Deployment (Vercel)

Vercel deploys automatically on every push to the `working` branch via the connected GitHub integration.

**Build command (run by Vercel CI):**

```bash
bun run vercel-build   # alias for: bun run build
```

**Output directory:** `dist/`

**Vercel configuration:** `vercel.json` at the repo root.

### Manual deployment trigger

If you need to deploy without pushing to git:

```bash
vercel --prod   # requires Vercel CLI: npm i -g vercel
```

---

## Pre-Deployment Checklist

### Code quality

```bash
bun run lint          # Biome linter
bun run format:check  # Biome format check
bun run build         # Confirm production build succeeds
```

### Manifest validation

```bash
bun run validate:word
bun run validate:excel
bun run validate:powerpoint
bun run validate:prod   # manifest-production.xml (installer)
```

### Security checklist

- No secrets or API keys committed to the repository
- All manifest URLs use HTTPS (`https://addon.docuid.net`)
- JWT handling verified (expiration, logout clearing)
- Input validation confirmed on phone number entry

---

## Build Output

```
dist/
  taskpane.html          # Main add-in HTML
  commands.html          # Ribbon command handler HTML
  assets/                # Icons and static assets
  taskpane.js            # Compiled React application bundle
  commands.js            # Ribbon command bundle
  *.css                  # Compiled stylesheets
```

The production manifests (`manifests/manifest.xml`, `manifest-excel.xml`, `manifest-powerpoint.xml`) reference `https://addon.docuid.net` and are served directly from Vercel alongside the build output.

---

## Environment Configuration

The add-in has no `.env` files. All environment-specific configuration is baked into the webpack build:

- **API base URL:** `https://dev.docuid.net` (configured in `DocuIdApiService.ts`)
- **Add-in host URL:** `https://addon.docuid.net` (in production manifests)
- **Dev host URL:** `https://localhost:3000` (in `-dev` manifests)

---

## Manifest Strategy

Two manifest sets exist in `manifests/`:

| Manifest file                    | Points to              | Used for                    |
|----------------------------------|------------------------|-----------------------------|
| `manifest.xml`                   | addon.docuid.net       | Word production             |
| `manifest-excel.xml`             | addon.docuid.net       | Excel production            |
| `manifest-powerpoint.xml`        | addon.docuid.net       | PowerPoint production       |
| `manifest-production.xml`        | addon.docuid.net       | Windows installer packaging |
| `manifest-dev.xml`               | localhost:3000         | Word local development      |
| `manifest-excel-dev.xml`         | localhost:3000         | Excel local development     |
| `manifest-powerpoint-dev.xml`    | localhost:3000         | PowerPoint local development|

Never modify prod manifests during local development. Use the `-dev` variants.

---

## Version Updates

Current version: **1.0.2.0**

Version is defined in all production manifests as `<Version>X.X.X.X</Version>`. When releasing an update:

1. Increment the version in all production manifests
2. Build and verify: `bun run build`
3. Validate manifests: `bun run validate:word` (and excel/powerpoint/prod)
4. Push to `working` — Vercel deploys automatically
5. Submit the updated manifest in Microsoft Partner Center if the AppSource listing requires a re-submission

---

## Windows Installer

For enterprise distribution outside of AppSource:

```bash
bun run installer:package  # validates manifest-production.xml, then builds installer
bun run installer:build    # build only (skips validation)
```

The installer is built via `installer/Build-Installer.ps1` (PowerShell, Windows only).

---

## Post-Deployment Verification

After a production deployment:

1. Open Word (or Excel/PowerPoint) and sideload the production manifest: `bun run start:word`
2. Confirm the ribbon button shows "iVALT DocuID" (no DEV label)
3. Confirm the task pane loads from `addon.docuid.net` (check Network tab in browser DevTools)
4. Complete an authentication and document insertion flow end-to-end
5. Check Vercel dashboard for any build or runtime errors

---

## Troubleshooting

**Build fails on Vercel**
- Check Vercel build logs in the dashboard
- Reproduce locally: `bun run build`
- Common cause: TypeScript errors or missing dependencies

**Add-in loads blank or errors**
- Open browser DevTools inside the Office task pane (right-click → Inspect / F12 on Windows)
- Check Console for errors
- Verify `https://addon.docuid.net/taskpane.html` is reachable

**Manifest rejected by Office**
- Run `bun run validate:prod` and fix any reported issues
- Ensure all icons referenced in the manifest exist at their URLs
- Confirm all `<AppDomain>` entries are accurate

**SSL / HTTPS issues**
- Vercel manages SSL automatically — check Vercel dashboard for certificate status
- Confirm the custom domain `addon.docuid.net` is correctly pointed to Vercel in DNS
