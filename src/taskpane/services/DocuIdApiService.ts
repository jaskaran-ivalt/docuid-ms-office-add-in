import axios, { AxiosInstance, AxiosError } from "axios";
import { z } from "zod";
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
 * Share request payload from add-in UI
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

const addinShareRequestSchema = z
  .object({
    documentId: z.number().int().positive(),
    email: z.string().email().optional(),
    countryCode: z.string().min(2).max(2).optional(),
    mobile: z.string().min(1).optional(),
    message: z.string().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.email && !data.mobile) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Email or mobile is required",
        path: ["email"],
      });
    }
  });

const shareRequestSchema = z.object({
  documentId: z.number().int().positive(),
  recipientType: z.enum(["individual", "team"]),
  recipients: z.object({
    email: z.string().email().optional(),
    mobile: z.string().optional(),
    countryCode: z.string().optional(),
    countryCallingCode: z.string().optional(),
    mobileWithCountryCode: z.string().optional(),
    teamIds: z.array(z.number()).optional(),
    userIds: z.array(z.number()).optional(),
  }),
  accessLevel: z.enum(["view", "download", "edit"]),
  expiryDate: z.string().datetime().optional(),
  requiresPassword: z.boolean(),
  password: z.string().optional(),
  customMessage: z.string().optional(),
  allowDownload: z.boolean(),
  allowPrint: z.boolean(),
});

/**
 * Service for communicating with DocuID dashboard APIs
 */
export class DocuIdApiService {
  private static instance: AxiosInstance | null = null;
  private static readonly apiLogger = logger.createContextLogger("DocuIdApiService");

  /**
   * Get or create axios instance with auth configuration
   */
  private static getApiInstance(): AxiosInstance {
    if (!this.instance) {
      this.instance = axios.create({
        baseURL: "", // Always use relative URLs - proxied via webpack (dev) or Vercel rewrites (prod)
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true, // Important for cookie-based auth
      });

      // Add request interceptor for auth token
      this.instance.interceptors.request.use((config) => {
        const token = AuthService.getSessionToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          this.apiLogger.debug("Adding Authorization header to request", {
            url: config.url,
            tokenPrefix: token.substring(0, 10) + "...",
          });
        } else {
          this.apiLogger.warn("No session token available for API request", {
            url: config.url,
          });
        }
        return config;
      });

      // Add response interceptor for error handling
      this.instance.interceptors.response.use(
        (response) => response,
        (error: AxiosError) => {
          if (error.response?.status === 401) {
            this.apiLogger.warn("Unauthorized - clearing auth");
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
      if (options?.search) params.append("search", options.search);
      if (options?.folderId) params.append("folderId", options.folderId);
      if (options?.limit) params.append("limit", options.limit.toString());
      if (options?.offset) params.append("offset", options.offset.toString());

      const queryString = params.toString();
      const url = `/api/docuid/documents/word-files${queryString ? `?${queryString}` : ""}`;

      this.apiLogger.logApiRequest("GET", url, { options });

      const response = await this.getApiInstance().get<ApiResponse<WordFilesResponse>>(url);

      const responseTime = Date.now() - startTime;
      this.apiLogger.logApiResponse("GET", url, response.status, responseTime);

      if (response.data.success) {
        this.apiLogger.info("Word documents fetched successfully", {
          count: response.data.data.files.length,
        });
        return response.data.data.files;
      }

      throw new Error(response.data.message || "Failed to fetch documents");
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.apiLogger.logApiResponse(
        "GET",
        "/api/docuid/documents/word-files",
        (error as AxiosError).response?.status || 0,
        responseTime
      );
      this.apiLogger.error("Failed to fetch Word documents", error as Error);
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
      this.apiLogger.logApiRequest("GET", url, { documentId });

      const response =
        await this.getApiInstance().get<ApiResponse<{ document: DocumentAccess }>>(url);

      const responseTime = Date.now() - startTime;
      this.apiLogger.logApiResponse("GET", url, response.status, responseTime);

      if (response.data.success) {
        this.apiLogger.info("Document access info retrieved", { documentId });
        return response.data.data.document;
      }

      throw new Error(response.data.message || "Failed to get document access");
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.apiLogger.logApiResponse(
        "GET",
        url,
        (error as AxiosError).response?.status || 0,
        responseTime
      );
      this.apiLogger.error("Failed to get document access", error as Error);
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
      this.apiLogger.logApiRequest("GET", url, { documentId });

      const response = await this.getApiInstance().get<{ document: DocuIdDocument }>(url);

      const responseTime = Date.now() - startTime;
      this.apiLogger.logApiResponse("GET", url, response.status, responseTime);

      return response.data.document;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.apiLogger.logApiResponse(
        "GET",
        url,
        (error as AxiosError).response?.status || 0,
        responseTime
      );
      this.apiLogger.error("Failed to get document", error as Error);
      throw error;
    }
  }

  /**
   * Download document content as blob
   */
  static async downloadDocumentContent(accessUrl: string): Promise<Blob> {
    const startTime = Date.now();

    try {
      // Convert absolute backend URL to relative proxy URL to avoid CORS issues
      // The access URL might be something like: http://localhost:3001/api/documents/123/download
      // We need to route it through our proxy: /api/docuid/documents/123/download
      let downloadUrl = accessUrl;

      // Check if this is a backend URL that needs to go through our proxy
      if (accessUrl.includes("/api/documents/")) {
        // Extract the path after /api/documents/
        const match = accessUrl.match(/\/api\/documents\/(.+)/);
        if (match) {
          // Route through our proxy
          downloadUrl = `/api/docuid/documents/${match[1]}`;
        }
      }

      this.apiLogger.logApiRequest("GET", downloadUrl, {
        type: "download",
        originalUrl: accessUrl,
      });

      const response = await this.getApiInstance().get(downloadUrl, {
        responseType: "blob",
      });

      const responseTime = Date.now() - startTime;
      this.apiLogger.logApiResponse("GET", downloadUrl, response.status, responseTime);

      return response.data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.apiLogger.logApiResponse(
        "GET",
        accessUrl,
        (error as AxiosError).response?.status || 0,
        responseTime
      );
      this.apiLogger.error("Failed to download document content", error as Error);
      throw error;
    }
  }

  /**
   * Reset the API instance (useful for testing or logout)
   */
  static reset(): void {
    this.instance = null;
  }

  /**
   * Share a document with an email or mobile recipient
   */
  static async shareDocument(payload: {
    documentId: number;
    email?: string;
    countryCode?: string;
    mobile?: string;
    message?: string;
  }): Promise<ApiResponse<ShareApiResponse>> {
    const startTime = Date.now();

    const parsed = addinShareRequestSchema.parse(payload);

    console.log("parsed", parsed);
    const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const shareRequest = shareRequestSchema.parse({
      documentId: parsed.documentId,
      recipientType: "individual",
      recipients: {
        email: parsed.email || undefined,
        countryCode: `+${parsed.countryCode}` || undefined,
        mobile: parsed.mobile || undefined,
      },
      accessLevel: "download",
      expiryDate,
      requiresPassword: false,
      customMessage: parsed.message || undefined,
      allowDownload: true,
      allowPrint: true,
    });

    const url = "/api/docuid/shares/optimized";

    try {
      this.apiLogger.logApiRequest("POST", url, {
        documentId: parsed.documentId,
        hasEmail: !!parsed.email,
        hasMobile: !!parsed.mobile,
      });

      const response = await this.getApiInstance().post<ApiResponse<ShareApiResponse>>(
        url,
        shareRequest
      );

      const responseTime = Date.now() - startTime;
      this.apiLogger.logApiResponse("POST", url, response.status, responseTime);

      return response.data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.apiLogger.logApiResponse(
        "POST",
        url,
        (error as AxiosError).response?.status || 0,
        responseTime
      );
      this.apiLogger.error("Failed to share document", error as Error);
      throw error;
    }
  }
}
