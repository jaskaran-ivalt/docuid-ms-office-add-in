import axios, { AxiosInstance, AxiosError } from "axios";
import { AuthService } from "./AuthService";
import { logger } from "./Logger";

/* global */

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
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

/**
 * Word files list response
 */
interface WordFilesResponse {
  files: DocuIdDocument[];
  pagination: {
    limit: number;
    offset: number;
    count: number;
  };
}

/**
 * Service for communicating with DocuID dashboard APIs
 */
export class DocuIdApiService {
  private static instance: AxiosInstance | null = null;
  private static readonly apiLogger = logger.createContextLogger('DocuIdApiService');

  /**
   * Get or create axios instance with auth configuration
   */
  private static getApiInstance(): AxiosInstance {
    if (!this.instance) {
      this.instance = axios.create({
        baseURL: process.env.NODE_ENV === 'development' ? '' : 'https://docuid.net',
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true, // Important for cookie-based auth
      });

      // Add request interceptor for auth token
      this.instance.interceptors.request.use((config) => {
        const token = AuthService.getSessionToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      });

      // Add response interceptor for error handling
      this.instance.interceptors.response.use(
        (response) => response,
        (error: AxiosError) => {
          if (error.response?.status === 401) {
            this.apiLogger.warn('Unauthorized - clearing auth');
            AuthService.logout();
          }
          return Promise.reject(error);
        }
      );
    }
    return this.instance;
  }

  /**
   * Get list of Word documents for current user
   */
  static async getWordDocuments(options?: {
    search?: string;
    folderId?: string;
    limit?: number;
    offset?: number;
  }): Promise<DocuIdDocument[]> {
    const startTime = Date.now();

    try {
      const params = new URLSearchParams();
      if (options?.search) params.append('search', options.search);
      if (options?.folderId) params.append('folderId', options.folderId);
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());

      const queryString = params.toString();
      const url = `/api/docuid/documents/word-files${queryString ? `?${queryString}` : ''}`;

      this.apiLogger.logApiRequest('GET', url, { options });

      const response = await this.getApiInstance().get<ApiResponse<WordFilesResponse>>(url);

      const responseTime = Date.now() - startTime;
      this.apiLogger.logApiResponse('GET', url, response.status, responseTime);

      if (response.data.success) {
        this.apiLogger.info('Word documents fetched successfully', {
          count: response.data.data.files.length,
        });
        return response.data.data.files;
      }

      throw new Error(response.data.message || 'Failed to fetch documents');
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.apiLogger.logApiResponse('GET', '/api/docuid/documents/word-files', 
        (error as AxiosError).response?.status || 0, responseTime);
      this.apiLogger.error('Failed to fetch Word documents', error as Error);
      throw error;
    }
  }

  /**
   * Get document access information (URL to download/preview)
   */
  static async getDocumentAccess(documentId: number): Promise<DocumentAccess> {
    const startTime = Date.now();
    const url = `/api/docuid/documents/${documentId}/access`;

    try {
      this.apiLogger.logApiRequest('GET', url, { documentId });

      const response = await this.getApiInstance().get<ApiResponse<{ document: DocumentAccess }>>(url);

      const responseTime = Date.now() - startTime;
      this.apiLogger.logApiResponse('GET', url, response.status, responseTime);

      if (response.data.success) {
        this.apiLogger.info('Document access info retrieved', { documentId });
        return response.data.data.document;
      }

      throw new Error(response.data.message || 'Failed to get document access');
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.apiLogger.logApiResponse('GET', url,
        (error as AxiosError).response?.status || 0, responseTime);
      this.apiLogger.error('Failed to get document access', error as Error);
      throw error;
    }
  }

  /**
   * Get document metadata by ID
   */
  static async getDocument(documentId: number): Promise<DocuIdDocument> {
    const startTime = Date.now();
    const url = `/api/docuid/documents/${documentId}`;

    try {
      this.apiLogger.logApiRequest('GET', url, { documentId });

      const response = await this.getApiInstance().get<{ document: DocuIdDocument }>(url);

      const responseTime = Date.now() - startTime;
      this.apiLogger.logApiResponse('GET', url, response.status, responseTime);

      return response.data.document;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.apiLogger.logApiResponse('GET', url,
        (error as AxiosError).response?.status || 0, responseTime);
      this.apiLogger.error('Failed to get document', error as Error);
      throw error;
    }
  }

  /**
   * Download document content as blob
   */
  static async downloadDocumentContent(accessUrl: string): Promise<Blob> {
    const startTime = Date.now();

    try {
      this.apiLogger.logApiRequest('GET', accessUrl, { type: 'download' });

      const response = await this.getApiInstance().get(accessUrl, {
        responseType: 'blob',
      });

      const responseTime = Date.now() - startTime;
      this.apiLogger.logApiResponse('GET', accessUrl, response.status, responseTime);

      return response.data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.apiLogger.logApiResponse('GET', accessUrl,
        (error as AxiosError).response?.status || 0, responseTime);
      this.apiLogger.error('Failed to download document content', error as Error);
      throw error;
    }
  }

  /**
   * Reset the API instance (useful for testing or logout)
   */
  static reset(): void {
    this.instance = null;
  }
}
