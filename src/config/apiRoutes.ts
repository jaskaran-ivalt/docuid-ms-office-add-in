/**
 * Central API Routes Configuration
 * 
 * Manages all API endpoints with environment-aware URL construction.
 * - Development: Uses webpack proxy (relative URLs with /api/docuid prefix)
 * - Production: Uses Vercel rewrites (relative URLs) until backend CORS is configured
 */

const isDevelopment = process.env.NODE_ENV === "development";
// TODO: Switch to direct calls once backend adds CORS for addon.docuid.net
// const API_BASE_URL = isDevelopment ? "" : "https://dev.docuid.net";
const API_BASE_URL = ""; // Always use relative URLs (proxied in both dev and prod)

// Development prefix for webpack proxy - must match webpack.config.js proxy context
const DEV_PREFIX = isDevelopment ? "/api/docuid" : "";

/**
 * Get full API URL based on environment
 * - Development: /api/docuid + /biometric/auth-request → /api/docuid/biometric/auth-request (webpack proxy strips /api/docuid)
 * - Production: /api/biometric/auth-request (Vercel rewrite adds /api)
 */
const getApiUrl = (path: string): string => {
  // In development: webpack proxy adds /api/docuid prefix, so path should NOT have /api prefix
  // In production: Vercel rewrites need /api prefix, so path SHOULD have /api prefix
  const apiPrefix = isDevelopment ? "" : "/api";
  return `${API_BASE_URL}${DEV_PREFIX}${apiPrefix}${path}`;
};

/**
 * Biometric Authentication Routes
 */
export const BIOMETRIC_ROUTES = {
  AUTH_REQUEST: getApiUrl("/biometric/auth-request"),
  AUTH_RESULT: getApiUrl("/biometric/auth-result"),
} as const;

/**
 * Document Management Routes
 */
export const DOCUMENT_ROUTES = {
  // List and metadata endpoints (backend: /api/dashboard/documents/)
  WORD_FILES: getApiUrl("/dashboard/documents/word-files"),
  GET_DOCUMENT: (id: number) => getApiUrl(`/dashboard/documents/${id}`),
  DOCUMENT_ACCESS: (id: number) => getApiUrl(`/dashboard/documents/${id}/access`),
  
  // Download and content endpoints (backend: /api/documents/)
  DOWNLOAD: (id: number) => getApiUrl(`/documents/${id}/download`),
  CONTENT: (id: number) => getApiUrl(`/documents/${id}/content`),
} as const;

/**
 * Share Management Routes
 */
export const SHARE_ROUTES = {
  OPTIMIZED: getApiUrl("/dashboard/shares/optimized"),
} as const;

/**
 * API Configuration
 */
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  DEV_PREFIX: DEV_PREFIX,
  IS_DEVELOPMENT: false,
  WITH_CREDENTIALS: false, // Use Bearer token, not cookies
  HEADERS: {
    CONTENT_TYPE: "application/json",
    API_KEY: "PKIqfASvBfaKQxsg6DVn92ANw7bLsWXSalEsg5Bz",
  },
} as const;
