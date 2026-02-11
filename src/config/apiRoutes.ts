/**
 * Central API Routes Configuration
 * 
 * Manages all API endpoints with environment-aware URL construction.
 * - Development: Uses webpack proxy (relative URLs)
 * - Production: Calls dev.docuid.net directly
 */

const isDevelopment = process.env.NODE_ENV === "development";
const API_BASE_URL = isDevelopment ? "" : "https://dev.docuid.net";

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
  AUTH_REQUEST: getApiUrl(isDevelopment ? "/api/docuid/biometric/auth-request" : "/api/biometric/auth-request"),
  AUTH_RESULT: getApiUrl(isDevelopment ? "/api/docuid/biometric/auth-result" : "/api/biometric/auth-result"),
} as const;

/**
 * Document Management Routes
 */
export const DOCUMENT_ROUTES = {
  // List and metadata endpoints
  WORD_FILES: getApiUrl(isDevelopment ? "/api/docuid/documents/word-files" : "/api/dashboard/documents/word-files"),
  GET_DOCUMENT: (id: number) => getApiUrl(isDevelopment ? `/api/docuid/documents/${id}` : `/api/dashboard/documents/${id}`),
  DOCUMENT_ACCESS: (id: number) => getApiUrl(isDevelopment ? `/api/docuid/documents/${id}/access` : `/api/dashboard/documents/${id}/access`),
  
  // Download and content endpoints (different base path)
  DOWNLOAD: (id: number) => getApiUrl(`/api/documents/${id}/download`),
  CONTENT: (id: number) => getApiUrl(`/api/documents/${id}/content`),
} as const;

/**
 * Share Management Routes
 */
export const SHARE_ROUTES = {
  OPTIMIZED: getApiUrl(isDevelopment ? "/api/docuid/shares/optimized" : "/api/dashboard/shares/optimized"),
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
