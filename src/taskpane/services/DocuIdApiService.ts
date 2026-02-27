import axios, { AxiosInstance, AxiosError } from "axios";
import { AuthService } from "./AuthService";
import { logger } from "./Logger";
import { DOCUMENT_ROUTES, SHARE_ROUTES, API_CONFIG } from "../../config/apiRoutes";
import { DocuIdDocument, DocumentAccess, ApiResponse, ShareApiResponse } from "../common/types";

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
        baseURL: API_CONFIG.BASE_URL,
        headers: {
          "Content-Type": API_CONFIG.HEADERS.CONTENT_TYPE,
        },
        withCredentials: API_CONFIG.WITH_CREDENTIALS,
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
            this.apiLogger.warn("Unauthorized - clearing session");
            AuthService.logout();
            // Optional: trigger a custom event or callback to redirect to login
            window.dispatchEvent(new CustomEvent("docuid-unauthorized"));
          }
          return Promise.reject(error);
        }
      );
    }
    return this.instance;
  }

  /**
   * Get list of Word documents
   */
  static async getWordDocuments(): Promise<DocuIdDocument[]> {
    const url = DOCUMENT_ROUTES.WORD_FILES;
    try {
      this.apiLogger.logApiRequest("GET", url);

      // --- DEMO MODE CHECK ---
      if (AuthService.getSessionToken() === "demo-session-token") {
        this.apiLogger.info("Returning demo documents");
        return [
          {
            documentId: 1001,
            fileName: "Demo Proposal.docx",
            filePath: "/demo/Demo Proposal.docx",
            fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            fileSize: 1024500,
            description: "A sample proposal document for demonstration.",
            folderId: null,
            isPasswordProtected: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            documentId: 1002,
            fileName: "Confidential Report.docx",
            filePath: "/demo/Confidential Report.docx",
            fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            fileSize: 2048000,
            description: "Highly confidential Q4 report.",
            folderId: null,
            isPasswordProtected: true,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString(),
          }
        ];
      }
      // -----------------------

      const response =
        await this.getApiInstance().get<ApiResponse<{ files: DocuIdDocument[] }>>(url);

      if (response.data.success) {
        return response.data.data.files;
      }
      throw new Error(response.data.message || "Failed to fetch documents");
    } catch (error) {
      this.apiLogger.error("Error fetching Word documents", error as Error);
      throw error;
    }
  }

  /**
   * Get document access information
   */
  static async getDocumentAccess(documentId: number): Promise<DocumentAccess> {
    const url = DOCUMENT_ROUTES.DOCUMENT_ACCESS(documentId);
    try {
      this.apiLogger.logApiRequest("GET", url);

      // --- DEMO MODE CHECK ---
      if (AuthService.getSessionToken() === "demo-session-token") {
        this.apiLogger.info(`Returning demo document access for doc: ${documentId}`);
        const fileName = documentId === 1001 ? "Demo Proposal.docx" : "Confidential Report.docx";
        const isProtected = documentId === 1002;
        return {
          documentId: documentId,
          fileName: fileName,
          fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          fileSize: 1024500,
          description: "Demo document access",
          folderId: null,
          isPasswordProtected: isProtected,
          isEncrypted: false,
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          access: {
            url: "demo-document-content-url",
            previewUrl: "demo-document-content-url",
            expiresIn: 3600,
            method: "GET",
            headers: {}
          }
        };
      }
      // -----------------------

      const response =
        await this.getApiInstance().get<ApiResponse<{ document: DocumentAccess }>>(url);

      if (response.data.success) {
        return response.data.data.document;
      }
      throw new Error(response.data.message || "Failed to get document access");
    } catch (error) {
      this.apiLogger.error("Error getting document access", error as Error);
      throw error;
    }
  }

  /**
   * Download document content as blob
   */
  static async downloadDocumentContent(accessUrl: string): Promise<Blob> {
    try {
      // --- DEMO MODE CHECK ---
      if (AuthService.getSessionToken() === "demo-session-token" || accessUrl === "demo-document-content-url") {
        this.apiLogger.info("Returning demo document blob content");
        const content = "This is a demo document generated for the DocuID Office Add-in preview.\n\nAll features are unlocked in demo mode. Document generated on: " + new Date().toLocaleString();
        return new Blob([content], { type: "text/plain" });
      }
      // -----------------------

      // Check if the URL is a relative dashboard URL that needs the API instance
      if (accessUrl.startsWith("/") || accessUrl.includes(window.location.host)) {
        const response = await this.getApiInstance().get(accessUrl, { responseType: "blob" });
        return response.data;
      }

      // If it's a direct presigned URL (S3), we can fetch it directly
      const response = await axios.get(accessUrl, { responseType: "blob" });
      return response.data;
    } catch (error) {
      this.apiLogger.error("Error downloading content", error as Error);
      throw error;
    }
  }

  /**
   * Share a document
   */
  static async shareDocument(payload: any): Promise<ApiResponse<ShareApiResponse>> {
    const url = SHARE_ROUTES.OPTIMIZED;
    try {
      this.apiLogger.logApiRequest("POST", url, { documentId: payload.documentId });

      // --- DEMO MODE CHECK ---
      if (AuthService.getSessionToken() === "demo-session-token") {
        this.apiLogger.info("Returning demo share response");
        return {
          success: true,
          data: {
            shareId: 999,
            shareLink: "https://demo.docuid.net/s/demolink",
            message: "Document shared successfully in demo mode."
          },
          message: "Success"
        };
      }
      // -----------------------

      // Construct the share request based on requirements
      const shareRequest = {
        documentId: payload.documentId,
        recipientType: "individual",
        recipients: {
          email: payload.email || undefined,
          mobile: payload.mobile || undefined,
          countryCallingCode: payload.countryCode ? `+${payload.countryCode}` : undefined,
        },
        accessLevel: "download",
        requiresPassword: false,
        customMessage: payload.message || undefined,
        allowDownload: true,
        allowPrint: true,
      };

      const response = await this.getApiInstance().post<ApiResponse<ShareApiResponse>>(
        url,
        shareRequest
      );
      return response.data;
    } catch (error) {
      this.apiLogger.error("Error sharing document", error as Error);
      throw error;
    }
  }
}
