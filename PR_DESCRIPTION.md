# Pull Request: Fix Cookie Issues & Centralize API Routes

## 🎯 Overview
Resolves cookie authentication issues on Vercel deployment by switching from proxy-based to direct API calls, and centralizes all API routes into a single configuration file.

## 🐛 Problem
1. **Cookie Issues**: Vercel rewrites acted as server-side proxy, causing cookies from `dev.docuid.net` to fail on `addon.docuid.net` (different domains)
2. **Scattered API Routes**: API endpoints duplicated across multiple service files with inconsistent environment handling
3. **Hard to Maintain**: Updating API endpoints required changes in multiple places

## ✅ Solution
1. **Direct API Calls**: Call `dev.docuid.net` directly from frontend instead of using Vercel rewrites
2. **Token-Based Auth**: Switch from cookie-based to Bearer token authentication
3. **Central Configuration**: Single source of truth for all API routes and configuration

## 📝 Changes

### 1. Removed Vercel Rewrites (`vercel.json`)
- Removed all API proxy rewrites
- Kept only HTML routing rewrites
- Simplified CORS headers

### 2. Updated API Services
**AuthService.ts**
- Call biometric APIs directly to `dev.docuid.net` in production
- Use webpack proxy only in development
- Switch to Bearer token authentication

**DocuIdApiService.ts**
- Call document/share APIs directly in production
- Environment-aware URL construction
- Removed `withCredentials` (no cookies)

### 3. Created Central API Routes (`src/config/apiRoutes.ts`)
- `BIOMETRIC_ROUTES`: Authentication endpoints
- `DOCUMENT_ROUTES`: Document management endpoints
- `SHARE_ROUTES`: Sharing endpoints
- `API_CONFIG`: Base URL, headers, credentials

### 4. Refactored Services to Use Central Routes
- Removed duplicate environment detection logic
- Removed ~80 lines of duplicate code
- Single source of truth for all API configuration

### 5. Updated Production URL
- Changed from `docuid-ms-office-add-in.vercel.app` to `addon.docuid.net`

### 6. Documentation
- Added `DEPLOYMENT_CHANGES.md` with comprehensive architecture documentation
- Updated Vercel deployment guide
- Added `AGENTS.md` for AI assistant context

## 🔄 API Flow

### Development (localhost:3000)
```
Frontend → Webpack Proxy → dev.docuid.net
/api/docuid/* → https://dev.docuid.net/api/*
```

### Production (addon.docuid.net)
```
Frontend → Direct Call → dev.docuid.net
https://addon.docuid.net → https://dev.docuid.net/api/*
```

## 🔐 Authentication Flow

### Before (Cookie-based) ❌
1. User authenticates
2. Backend sets cookie on `dev.docuid.net`
3. Cookie doesn't work on `addon.docuid.net` (different domain)

### After (Token-based) ✅
1. User authenticates
2. Backend returns JWT token in response body
3. Frontend stores token in localStorage
4. Token sent via `Authorization: Bearer <token>` header

## 📊 Code Quality

### Lines Changed
- **Removed**: ~150 lines (duplicate code, proxy config)
- **Added**: ~100 lines (central config, documentation)
- **Net**: -50 lines with better maintainability

### Files Modified
- `vercel.json` - Removed API rewrites
- `webpack.config.js` - Updated production URL
- `src/taskpane/services/AuthService.ts` - Direct API calls
- `src/taskpane/services/DocuIdApiService.ts` - Direct API calls
- `src/config/apiRoutes.ts` - **NEW** Central configuration
- `DEPLOYMENT_CHANGES.md` - **NEW** Documentation
- `docs/03-development/VERCEL_DEPLOYMENT.md` - Updated domain

## ⚙️ Backend Requirements

The backend (`dev.docuid.net`) must:
1. ✅ Enable CORS for `https://addon.docuid.net`
2. ✅ Return session token in response body (not just cookies)
3. ✅ Accept Bearer token authentication

## ✅ Testing

### Build Status
- ✅ Production build successful
- ✅ No TypeScript errors
- ✅ All imports resolved correctly

### Manual Testing Required
- [ ] Test authentication flow on production
- [ ] Test document operations on production
- [ ] Test sharing functionality on production
- [ ] Verify CORS headers on backend

## 📦 Commits

1. `fix: remove Vercel API rewrites to resolve cookie issues`
2. `refactor: call dev.docuid.net APIs directly in production`
3. `refactor: update biometric auth to call APIs directly`
4. `chore: update production URL to addon.docuid.net`
5. `docs: add comprehensive deployment architecture documentation`
6. `docs: update Vercel deployment guide with correct domain`
7. `docs: add AI assistant context file for development`
8. `feat: create central API routes configuration`
9. `refactor: use central API routes in AuthService`
10. `refactor: use central API routes in DocuIdApiService`

## 🚀 Deployment

After merge:
1. Deploy to Vercel with domain `addon.docuid.net`
2. Verify backend CORS configuration
3. Test authentication and document operations
4. Monitor for any API errors

## 🔄 Rollback Plan

If issues occur:
1. Revert this PR
2. Restore Vercel rewrites
3. Work with backend team to resolve cookie issues

---

**Branch**: `refactor/direct-api-calls-and-central-routes`  
**Target**: `main`  
**Type**: Bug Fix + Refactor  
**Breaking Changes**: None (internal architecture only)
