# DocuID Development Guide

## Overview

This guide covers setting up the local development environment, the development workflow, and key patterns used in the DocuID Office Add-in codebase. The add-in supports Word, Excel, and PowerPoint and is deployed live at [Microsoft AppSource](https://marketplace.microsoft.com/en-us/product/wa200010668?tab=overview).

## Prerequisites

- [Bun](https://bun.sh/) — enforced as the exclusive package manager (npm/pnpm/yarn are blocked by a preinstall hook)
- Microsoft 365 desktop (Word, Excel, or PowerPoint)
- Node.js LTS (required by Office tooling)
- A registered iVALT DocuID account for authentication testing

## Environment Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Generate HTTPS certificates

Office Add-ins require HTTPS even locally. Certificates are generated automatically on first dev server start via `office-addin-dev-certs`. If you hit a certificate trust error, install them manually:

```bash
npx office-addin-dev-certs install
```

Trust the certificate when prompted by your OS.

### 3. Start the dev server

```bash
bun run dev-server
```

Starts webpack on `https://localhost:3000` with hot reload. Keep this terminal open.

### 4. Sideload into an Office host

In a second terminal:

```bash
bun run dev:word        # Microsoft Word
bun run dev:excel       # Microsoft Excel
bun run dev:powerpoint  # Microsoft PowerPoint
```

These load the corresponding `manifests/*-dev.xml` file which points to `https://localhost:3000`. The ribbon button shows "(DEV)" to confirm local code is active.

### 5. Stop sideloading

```bash
bun run dev:stop:word
bun run dev:stop:excel
bun run dev:stop:powerpoint
```

## Development Workflow

### Making changes

Webpack watches for file changes and rebuilds automatically. After a code change, refresh the add-in task pane inside Office to pick up the new build.

### Code quality

Run these before committing:

```bash
bun run lint          # Biome linter (check)
bun run lint:fix      # Biome linter (auto-fix)
bun run format        # Format all files
bun run format:check  # Check formatting without writing
```

Biome replaces both ESLint and Prettier. There is no `.eslintrc` or `.prettierrc` — configuration lives in `biome.json`.

### Building

```bash
bun run build         # Production build -> dist/
bun run build:dev     # Development build -> dist/
bun run watch         # Webpack watch mode (no server)
```

## Project Structure

```
src/
  taskpane/
    App.tsx                          # Root component — auth state, host routing
    index.tsx                        # React DOM entry point
    taskpane.ts                      # Office.js initialization
    taskpane.html                    # HTML entry point
    components/
      Header.tsx                     # App header, navigation
      LoginForm.tsx                  # Phone number auth UI
      DocumentList.tsx               # Document browse, search, insert
      ShareSidebar.tsx               # Document sharing UI
      ShareSuccessModal.tsx          # Post-share confirmation
      DownloadSheet.tsx              # Document download flow
      DebugPanel.tsx                 # Developer debug overlay (Ctrl+Shift+D)
      AppDownloadButtons.tsx         # Mobile app download links
      DesignSystem.tsx               # Design system showcase
      profile/
        ProfilePage.tsx
        ProfileCard.tsx
        PersonalInfoSection.tsx
        AccountInfoSection.tsx
      shared/                        # Reusable primitives
        Button.tsx
        Card.tsx
        Avatar.tsx
        SearchBox.tsx
        index.ts
    services/
      AuthService.ts                 # Auth state, token management, localStorage
      DocuIdApiService.ts            # All REST API calls to docuid.net
      DocumentService.ts             # Document fetch and management logic
      IDocumentHandler.ts            # Interface for host-specific handlers
      OfficeHostService.ts           # Detects current host (Word/Excel/PPT)
      WordDocumentHandler.ts         # Word.run() document insertion
      ExcelDocumentHandler.ts        # Excel.run() insertion logic
      PowerPointDocumentHandler.ts   # PowerPoint.run() insertion logic
      Logger.ts                      # Structured logging utility
  commands/                          # Office ribbon command handlers

manifests/
  manifest.xml                       # Word (production -> addon.docuid.net)
  manifest-excel.xml                 # Excel (production)
  manifest-powerpoint.xml            # PowerPoint (production)
  manifest-production.xml            # Used for installer packaging
  manifest-dev.xml                   # Word (dev -> localhost:3000)
  manifest-excel-dev.xml             # Excel (dev -> localhost:3000)
  manifest-powerpoint-dev.xml        # PowerPoint (dev -> localhost:3000)
```

## Key Architecture Patterns

### Multi-host support

`OfficeHostService` detects the current Office host at runtime. `App.tsx` instantiates the appropriate document handler:

- `WordDocumentHandler` — `Word.run()` with paragraph insertion
- `ExcelDocumentHandler` — `Excel.run()` with range/cell operations
- `PowerPointDocumentHandler` — `PowerPoint.run()` with slide shape insertion

All three implement the shared `IDocumentHandler` interface, keeping `App.tsx` host-agnostic.

### Authentication flow

1. User enters phone number with country code in `LoginForm`
2. `DocuIdApiService` initiates biometric authentication via docuid.net
3. iVALT sends a push to the user's registered mobile device
4. `AuthService` polls for verification and, on success, stores the JWT in localStorage with expiration
5. All subsequent API calls send `Authorization: Bearer <token>`

### State management

- React hooks (`useState`, `useEffect`) only — no external state library
- Auth state lives in `App.tsx`, hydrated from `AuthService` on mount
- No Context API or Redux; all state flows via props from `App.tsx`

### Logging

`Logger.ts` provides structured logging. All services use it rather than `console.log` directly.

The in-app debug panel (`DebugPanel.tsx`) surfaces these logs at runtime. Toggle with `Ctrl+Shift+D`.

Log level control via localStorage:

```javascript
localStorage.setItem("docuid_log_level", "0"); // 0=DEBUG, 1=INFO, 2=WARN, 3=ERROR
```

## Component Development Patterns

### New component

```typescript
import React, { useState, useEffect } from 'react';

interface Props {
  // define props here
}

export const NewComponent: React.FC<Props> = ({ prop1 }) => {
  const [state, setState] = useState<string>('');

  useEffect(() => {
    // side effects
  }, []);

  return <div>{state}</div>;
};
```

Rules:
- Functional components and hooks only — no class components
- Define a props interface for every component
- Show loading and error states for all async operations

### Extending a service

```typescript
import { AuthService } from './AuthService';
import { DocuIdApiService } from './DocuIdApiService';

export class NewFeatureService {
  static async doSomething(param: string): Promise<ResultType> {
    const token = AuthService.getSessionToken();
    if (!token) throw new Error('Not authenticated');

    return DocuIdApiService.someEndpoint(param);
  }
}
```

### Office.js calls

Always wrap in the host-specific `run()` method and call `context.sync()` after batched operations:

```typescript
// Word example
await Word.run(async (context) => {
  const body = context.document.body;
  body.insertParagraph('Content', Word.InsertLocation.end);
  await context.sync();
});
```

Never call Office.js APIs directly from components. Route through the appropriate handler service.

## Path Aliases

`@/*` resolves to `./src/*` — configured in both `tsconfig.json` and `webpack.config.js`.

```typescript
import { Button } from '@/taskpane/components/shared';
```

## Dev vs Production

| Aspect       | Dev (`dev:*`)                   | Prod (`start:*`)                  |
|--------------|---------------------------------|-----------------------------------|
| Manifest     | `manifests/*-dev.xml`           | `manifests/manifest*.xml`         |
| Source URL   | `https://localhost:3000`        | `https://addon.docuid.net`        |
| Code served  | Webpack dev server (hot reload) | Vercel-deployed static build      |
| Ribbon label | "iVALT DocuID (DEV)"           | "iVALT DocuID"                    |

Never modify production manifests during local development. Use the `-dev` variants.

## Manifest Validation

```bash
bun run validate:dev
bun run validate:dev:excel
bun run validate:dev:powerpoint
bun run validate:word
bun run validate:excel
bun run validate:powerpoint
bun run validate:prod        # manifest-production.xml (for installer)
```

## M365 Account Management

```bash
bun run signin   # Sign in to Microsoft 365 for testing
bun run signout  # Sign out
```

## Troubleshooting

**Add-in not loading**
- Confirm `bun run dev-server` is running
- Check `https://localhost:3000` loads in a browser (trust the certificate if needed)
- Run `npx office-addin-dev-certs install` if certificate trust fails
- Validate the manifest: `bun run validate:dev`

**Authentication fails**
- Open the debug panel (`Ctrl+Shift+D`) and check `AuthService` and `AuthService.API` logs
- Confirm the phone number is registered in the DocuID system
- Verify network access to `dev.docuid.net`

**Document insertion fails**
- Check `DocumentService.Office` logs in the debug panel
- Confirm the correct dev manifest is loaded for the host you are testing in (Word manifest in Word, etc.)
- Check for `OfficeExtension.Error` in browser DevTools console

**Wrong Office host detected**
- `OfficeHostService` reads `Office.context.host` at runtime
- Ensure the correct manifest variant is sideloaded for the target application
