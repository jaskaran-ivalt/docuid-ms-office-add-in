# CLAUDE.md

This file provides guidance to AI assistants when working with code in this repository.

## AI Assistant Rules

**IMPORTANT**: Never use emojis in code, comments, commit messages, or PR descriptions. Use clear, professional language instead.

## Development Commands

### Build Commands

| Command                  | Description                          |
|--------------------------|--------------------------------------|
| `bun run build`          | Production build (webpack)           |
| `bun run build:dev`      | Development build (webpack)          |
| `bun run dev-server`     | Start HTTPS dev server on port 3000  |
| `bun run watch`          | Webpack watch mode (development)     |
| `bun run vercel-build`   | Vercel CI production build           |

### Code Quality

| Command              | Description                      |
|----------------------|----------------------------------|
| `bun run lint`       | Run Biome linter (check only)    |
| `bun run lint:fix`   | Run Biome linter with auto-fix   |
| `bun run format`     | Format all files with Biome      |
| `bun run format:check` | Check formatting without writing |

### Office Add-in - Dev Mode (localhost:3000)

Use these commands during local development. They load code from the local webpack dev server.

| Command                        | Target application         |
|--------------------------------|----------------------------|
| `bun run dev` / `dev:word`     | Microsoft Word (DEV)       |
| `bun run dev:excel`            | Microsoft Excel (DEV)      |
| `bun run dev:powerpoint`       | Microsoft PowerPoint (DEV) |
| `bun run dev:stop:word`        | Stop Word dev sideload     |
| `bun run dev:stop:excel`       | Stop Excel dev sideload    |
| `bun run dev:stop:powerpoint`  | Stop PowerPoint dev sideload |

### Office Add-in - Production Mode (addon.docuid.net)

Use these commands to test against the live deployed build.

| Command                          | Target application            |
|----------------------------------|-------------------------------|
| `bun run start` / `start:word`   | Microsoft Word (prod)         |
| `bun run start:excel`            | Microsoft Excel (prod)        |
| `bun run start:powerpoint`       | Microsoft PowerPoint (prod)   |
| `bun run stop:word`              | Stop Word prod sideload       |
| `bun run stop:excel`             | Stop Excel prod sideload      |
| `bun run stop:powerpoint`        | Stop PowerPoint prod sideload |

### Manifest Validation

| Command                          | Manifest validated                        |
|----------------------------------|-------------------------------------------|
| `bun run validate:word`          | manifests/manifest.xml (prod Word)        |
| `bun run validate:excel`         | manifests/manifest-excel.xml (prod Excel) |
| `bun run validate:powerpoint`    | manifests/manifest-powerpoint.xml         |
| `bun run validate:prod`          | manifests/manifest-production.xml         |
| `bun run validate:dev`           | manifests/manifest-dev.xml                |
| `bun run validate:dev:excel`     | manifests/manifest-excel-dev.xml          |
| `bun run validate:dev:powerpoint`| manifests/manifest-powerpoint-dev.xml     |

### Account & Installer

- `bun run signin` - Sign in to M365 account for testing
- `bun run signout` - Sign out of M365 account
- `bun run installer:build` - Build Windows installer (PowerShell)
- `bun run installer:package` - Validate prod manifest then build installer

## Architecture Overview

### Technology Stack

- **Frontend**: React 19 with TypeScript, ES5 target for Office compatibility
- **Build System**: Webpack 5 with Babel transpilation
- **Linter/Formatter**: Biome (replaces ESLint + Prettier)
- **Office Integration**: Office.js API for Word, Excel, PowerPoint manipulation
- **Authentication**: Real API via DocuIdApiService (docuid.net + iVALT biometric)
- **HTTP Client**: Axios
- **Styling**: Vanilla CSS per component (no CSS framework)
- **Runtime**: Bun

### Project Structure

```
manifests/                         # All Office Add-in XML manifests
├── manifest.xml                   # Word (production -> addon.docuid.net)
├── manifest-excel.xml             # Excel (production)
├── manifest-powerpoint.xml        # PowerPoint (production)
├── manifest-production.xml        # Used for installer packaging
├── manifest-dev.xml               # Word (dev -> localhost:3000)
├── manifest-excel-dev.xml         # Excel (dev -> localhost:3000)
└── manifest-powerpoint-dev.xml    # PowerPoint (dev -> localhost:3000)

src/
├── taskpane/                      # Main React application (task pane UI)
│   ├── App.tsx                    # Root component, auth state management, host routing
│   ├── App.css                    # Root styles
│   ├── taskpane.html              # HTML entry point
│   ├── taskpane.ts                # Office.js initialization
│   ├── taskpane.css               # Task pane base styles
│   ├── index.tsx                  # React DOM render entry
│   ├── common/                    # Shared utilities and constants
│   ├── theme/                     # Design tokens and theme definitions
│   ├── icons/                     # SVG icon assets
│   ├── components/                # React UI components
│   │   ├── Header.tsx             # App header with navigation and profile
│   │   ├── LoginForm.tsx          # Phone number auth UI
│   │   ├── DocumentList.tsx       # Document browse, search, insert
│   │   ├── ShareSidebar.tsx       # Document sharing UI
│   │   ├── ShareSuccessModal.tsx  # Post-share confirmation modal
│   │   ├── DownloadSheet.tsx      # Document download flow
│   │   ├── DebugPanel.tsx         # Developer debug overlay
│   │   ├── AppDownloadButtons.tsx # Mobile app download links
│   │   ├── DesignSystem.tsx       # Design system showcase component
│   │   ├── qrCodes.ts             # QR code generation utilities
│   │   ├── profile/               # Profile page components
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── ProfileCard.tsx
│   │   │   ├── PersonalInfoSection.tsx
│   │   │   └── AccountInfoSection.tsx
│   │   └── shared/                # Reusable primitive components
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Avatar.tsx
│   │       ├── SearchBox.tsx
│   │       └── index.ts
│   └── services/                  # Business logic and API layer
│       ├── AuthService.ts         # Auth state, token management, localStorage
│       ├── DocuIdApiService.ts    # All REST API calls to docuid.net
│       ├── DocumentService.ts     # Document fetch and management logic
│       ├── IDocumentHandler.ts    # Interface for host-specific handlers
│       ├── OfficeHostService.ts   # Detects current Office host (Word/Excel/PPT)
│       ├── WordDocumentHandler.ts # Word.run() document insertion logic
│       ├── ExcelDocumentHandler.ts# Excel-specific insertion logic
│       ├── PowerPointDocumentHandler.ts # PowerPoint-specific insertion logic
│       └── Logger.ts              # Structured logging utility
└── commands/                      # Office ribbon command handlers
```

### Key Architectural Patterns

#### Multi-Host Office Support

The add-in supports Word, Excel, and PowerPoint via a shared `IDocumentHandler` interface. `OfficeHostService` detects the current host at runtime and `App.tsx` instantiates the appropriate handler:
- `WordDocumentHandler` - uses `Word.run()` and paragraph insertion
- `ExcelDocumentHandler` - uses `Excel.run()` and cell/sheet operations
- `PowerPointDocumentHandler` - uses `PowerPoint.run()` and slide shape insertion

#### Authentication Flow

- Phone number input -> iVALT biometric verification via `DocuIdApiService`
- `AuthService` persists JWT token in localStorage with expiration tracking
- All API requests include `Authorization: Bearer <token>` header

#### Manifest Strategy

Two manifest sets exist side-by-side in `manifests/`:
- **Dev manifests** (`*-dev.xml`): Point to `https://localhost:3000` - used with `bun run dev:*`
- **Prod manifests** (`manifest*.xml`): Point to `https://addon.docuid.net` - used with `bun run start:*`
- Never edit prod manifests during local development; use the `-dev` variants

#### State Management

- React hooks (`useState`, `useEffect`) for all component and app-level state
- No external state management library
- Authentication state lives in `App.tsx` and is hydrated from `AuthService` on mount

## Development Environment

### Configuration Files

- `tsconfig.json` - TypeScript with ES5 target for Office compatibility
- `webpack.config.js` - HTTPS dev server, asset copying, URL replacement
- `babel.config.json` - React/TypeScript to ES5 transpilation
- `biome.json` - Linting and formatting rules (replaces .eslintrc + .prettierrc)
- `package.json` - All scripts; dev server on port 3000

### Path Aliases

- `@/*` resolves to `./src/*` for cleaner imports
- Configured in both `tsconfig.json` and `webpack.config.js`

### Development vs Production

| Aspect         | Dev (`dev:*` scripts)              | Prod (`start:*` scripts)            |
|----------------|------------------------------------|-------------------------------------|
| Manifest       | `manifests/*-dev.xml`              | `manifests/manifest*.xml`           |
| Source URL     | `https://localhost:3000`           | `https://addon.docuid.net`          |
| Code served by | Webpack dev server (hot reload)    | Vercel-deployed static build        |
| Ribbon label   | "iVALT DocuID (DEV)"              | "iVALT DocuID"                      |

## API Integration

### DocuIdApiService

All REST API calls live in `DocuIdApiService.ts`:
- Base URL: `https://dev.docuid.net` (configurable)
- JWT Bearer token authentication
- Document CRUD operations
- Share, download, and QR code endpoints
- Axios instance with interceptors for auth headers and error handling

### AuthService

Manages session lifecycle:
- Token storage and retrieval from localStorage
- Expiration checking
- Login, logout, and session refresh logic

## Office.js Integration

### Per-Host API Usage

- **Word**: `Word.run()` + `context.document.body.insertParagraph()`, content controls
- **Excel**: `Excel.run()` + range/cell value setting and sheet operations
- **PowerPoint**: `PowerPoint.run()` + slide shape and image insertion

### Add-in Manifests

- All manifests are in `manifests/` directory
- Each host has a prod manifest and a `-dev` variant
- `manifest-production.xml` is used exclusively for the Windows installer package
- ReadWriteDocument permissions; ribbon button in Home tab; Desktop form factor

## Testing Strategy

### Local Development Testing

1. Start dev server: `bun run dev-server`
2. Sideload into target app: `bun run dev:word` / `dev:excel` / `dev:powerpoint`
3. The ribbon button will show "(DEV)" label to confirm local code is running
4. Stop sideload: `bun run dev:stop:word` etc.

### Error Scenarios

- Network and auth errors are surfaced via Logger.ts and displayed in DebugPanel
- Use `DebugPanel.tsx` during development to inspect state and API responses

## Security Considerations

- HTTPS enforced (Office Add-in requirement); self-signed certs via office-addin-dev-certs
- JWT tokens stored in localStorage with expiration; cleared on logout
- Input validation applied before all API calls
- CORS configured for `docuid.net` and `addon.docuid.net` domains

## Deployment Notes

### Development

- Self-signed certs generated by `office-addin-dev-certs`
- Webpack dev server on `https://localhost:3000`
- Use `*-dev.xml` manifests exclusively

### Production

- Build: `bun run build` -> outputs to `dist/`
- Host: Vercel (`vercel.json` configured); `bun run vercel-build` used in CI
- Manifests already reference `https://addon.docuid.net` - no changes needed
- Installer: `bun run installer:package` validates prod manifest then runs PowerShell build

## Code Conventions

### TypeScript

- Interface definitions for all API responses and domain models
- Async/await for all async operations
- Try/catch with Logger.ts for error handling
- Strict typing for Office.js API calls

### React

- Functional components with hooks only (no class components)
- Props interfaces defined inline or in adjacent `.types.ts` files
- Loading and error states required for all async operations

### Office Add-in

- All Office.js calls wrapped in service methods, never called directly from components
- Always `await context.sync()` after batched Office operations
- Graceful fallbacks for Office features not available in all hosts
