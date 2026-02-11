# Deployment Changes - Direct API Calls

## Problem
When deployed on Vercel with domain `addon.docuid.net`, the previous proxy-based approach caused cookie issues:
- Vercel rewrites acted as server-side proxy
- Cookies from `dev.docuid.net` couldn't be shared with `addon.docuid.net` (different domains)
- Authentication failed due to missing session cookies

## Solution
Call `dev.docuid.net` APIs directly from the frontend instead of using Vercel rewrites as a proxy.

## Changes Made

### 1. Removed Vercel Rewrites (`vercel.json`)
**Before:**
```json
"rewrites": [
  {
    "source": "/api/docuid/biometric/:path*",
    "destination": "https://dev.docuid.net/api/biometric/:path*"
  },
  // ... more rewrites
]
```

**After:**
```json
"rewrites": [
  {
    "source": "/",
    "destination": "/taskpane.html"
  },
  {
    "source": "/index.html",
    "destination": "/taskpane.html"
  }
]
```

### 2. Updated API Services to Call Backend Directly

#### `DocuIdApiService.ts`
- **Development**: Uses webpack proxy (`/api/docuid/*` → `dev.docuid.net`)
- **Production**: Calls `https://dev.docuid.net` directly

```typescript
private static getBaseURL(): string {
  if (process.env.NODE_ENV === "development") {
    return ""; // Relative URLs proxied by webpack
  }
  return "https://dev.docuid.net"; // Direct call in production
}
```

- Changed `withCredentials: true` → `withCredentials: false` (use Bearer token instead of cookies)
- Updated all API paths to use correct backend endpoints:
  - `/api/dashboard/documents/*` for document operations
  - `/api/documents/*` for download/content endpoints
  - `/api/dashboard/shares/*` for sharing operations

#### `AuthService.ts`
- Added `getApiBaseUrl()` method for environment-based URL selection
- Updated biometric auth endpoints:
  - Development: `/api/docuid/biometric/*` (proxied)
  - Production: `/api/biometric/*` (direct to dev.docuid.net)
- Changed `withCredentials: true` → `withCredentials: false`

### 3. Updated Production URL (`webpack.config.js`)
```javascript
const urlProd = "https://addon.docuid.net/";
```

## API Endpoint Mapping

### Development (localhost:3000)
Uses webpack proxy:
```
/api/docuid/biometric/* → https://dev.docuid.net/api/biometric/*
/api/docuid/documents/* → https://dev.docuid.net/api/dashboard/documents/*
/api/docuid/documents/:id/download → https://dev.docuid.net/api/documents/:id/download
/api/docuid/documents/:id/content → https://dev.docuid.net/api/documents/:id/content
/api/docuid/shares/* → https://dev.docuid.net/api/dashboard/shares/*
```

### Production (addon.docuid.net)
Direct calls to backend:
```
https://dev.docuid.net/api/biometric/*
https://dev.docuid.net/api/dashboard/documents/*
https://dev.docuid.net/api/documents/:id/download
https://dev.docuid.net/api/documents/:id/content
https://dev.docuid.net/api/dashboard/shares/*
```

## Authentication Flow

### Before (Cookie-based)
1. User authenticates via biometric
2. Backend sets session cookie on `dev.docuid.net`
3. Vercel proxy tries to forward cookie to `addon.docuid.net`
4. ❌ Cookie doesn't work (different domains)

### After (Token-based)
1. User authenticates via biometric
2. Backend returns JWT token in response body
3. Frontend stores token in localStorage
4. ✅ Token sent in `Authorization: Bearer <token>` header for all API calls

## Backend Requirements

The backend (`dev.docuid.net`) must:
1. **Enable CORS** for `https://addon.docuid.net`:
   ```
   Access-Control-Allow-Origin: https://addon.docuid.net
   Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
   Access-Control-Allow-Headers: Content-Type, Authorization, x-api-key
   ```

2. **Return session token in response body** (not just cookies):
   ```json
   {
     "data": {
       "sessionToken": "eyJhbGc...",
       "details": { ... }
     }
   }
   ```

3. **Accept Bearer token authentication**:
   ```
   Authorization: Bearer eyJhbGc...
   ```

## Testing

### Development
```bash
bun run dev-server
# APIs proxied through webpack to avoid CORS
```

### Production
```bash
bun run build
# Deploy to Vercel with domain addon.docuid.net
# APIs called directly to dev.docuid.net
```

## Deployment Checklist

- [x] Remove Vercel rewrites
- [x] Update API services to call backend directly in production
- [x] Change from cookie-based to token-based auth
- [x] Update production URL to addon.docuid.net
- [ ] Verify backend CORS configuration for addon.docuid.net
- [ ] Verify backend returns session token in response body
- [ ] Test authentication flow on production
- [ ] Test document operations on production
- [ ] Test sharing functionality on production

## Rollback Plan

If issues occur, revert to proxy-based approach:
1. Restore Vercel rewrites in `vercel.json`
2. Revert API services to use relative URLs only
3. Change back to `withCredentials: true`
4. Work with backend team to resolve cookie issues
