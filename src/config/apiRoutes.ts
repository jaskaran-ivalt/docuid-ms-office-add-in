/**
 * Central API Routes Configuration
 * 
 * Manages all API endpoints with environment-aware URL construction.
 * - Development: Uses webpack proxy (relative URLs)
 * - Production: Uses Vercel rewrites (relative URLs) until backend CORS is configured
 */

const isDevelopment = process.env.NODE_ENV === "development";
// TODO: Switch to direct calls once backend adds CORS for addon.docuid.net
// const API_BASE_URL = isDevelopment ? "" : "https://dev.docuid.net";
const API_BASE_URL = ""; // Always use relative URLs (proxied in both dev and prod)

/**
 * Get full API URL based on environment
 */
const getApiUrl = (path: string): string => {
  return `${API_BASE_URL}${path}`;
};

/**
 * Biometric Authentication Routes
 */
export const BIOMETRIC_ROUTES = {
  AUTH_REQUEST: getApiUrl("/api/biometric/auth-request"),
  AUTH_RESULT: getApiUrl("/api/biometric/auth-result"),
} as const;

/**
 * Document Management Routes
 */
export const DOCUMENT_ROUTES = {
  // List and metadata endpoints
  WORD_FILES: getApiUrl("/api/dashboard/documents/word-files"),
  GET_DOCUMENT: (id: number) => getApiUrl(`/api/dashboard/documents/${id}`),
  DOCUMENT_ACCESS: (id: number) => getApiUrl(`/api/dashboard/documents/${id}/access`),
  
  // Download and content endpoints (different base path)
  DOWNLOAD: (id: number) => getApiUrl(`/api/documents/${id}/download`),
  CONTENT: (id: number) => getApiUrl(`/api/documents/${id}/content`),
} as const;

/**
 * Share Management Routes
 */
export const SHARE_ROUTES = {
  OPTIMIZED: getApiUrl("/api/dashboard/shares/optimized"),
} as const;

/**
 * API Configuration
 */
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  IS_DEVELOPMENT: isDevelopment,
  WITH_CREDENTIALS: false, // Use Bearer token, not cookies
  HEADERS: {
    CONTENT_TYPE: "application/json",
    API_KEY: "PKIqfASvBfaKQxsg6DVn92ANw7bLsWXSalEsg5Bz",
  },
} as const;
