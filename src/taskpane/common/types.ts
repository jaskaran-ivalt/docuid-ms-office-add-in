/**
 * Shared types for the DocuID Office Add-in
 */

/**
 * Document interface matching DocuID API response
 */
export interface DocuIdDocument {
  documentId: number;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  description: string | null;
  folderId: number | null;
  isPasswordProtected: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * View model for documents used in the UI
 */
export interface Document {
  id: string;
  title: string;
  type: string;
  dateModified: string;
  size: string;
  documentId?: number;
  isPasswordProtected?: boolean;
  isEncrypted?: boolean;
  description?: string | null;
}

/**
 * Document access information from DocuID API
 */
export interface DocumentAccess {
  documentId: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  description: string | null;
  folderId: number | null;
  isPasswordProtected: boolean;
  isEncrypted: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  access: {
    url: string | null;
    previewUrl: string | null;
    expiresIn: number | null;
    method: string;
    headers: Record<string, string>;
  };
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

/**
 * User information
 */
export interface User {
  id: number;
  name: string;
  email: string;
  mobile: string;
  country_code: string;
  address: string;
  latitude?: number;
  longitude?: number;
  imei?: string;
}

/**
 * Stored authentication data
 */
export interface StoredAuth {
  phone: string;
  sessionToken: string;
  expiresAt: number;
  user?: User;
  message?: string;
  timestamp?: string;
}

/**
 * Share request payload
 */
export interface AddinShareRequest {
  documentId: number;
  email?: string;
  countryCode?: string;
  mobile?: string;
  message?: string;
}

/**
 * Share API response
 */
export interface ShareApiResponse {
  shareId?: number;
  shareLink?: string;
  message?: string;
}
