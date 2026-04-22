import axios, { AxiosInstance, AxiosError } from "axios";
import { AuthService } from "./AuthService";
import { logger } from "./Logger";
import { DOCUMENT_ROUTES, SHARE_ROUTES, API_CONFIG } from "../../config/apiRoutes";
import { DocuIdDocument, DocumentAccess, ApiResponse, ShareApiResponse } from "../common/types";
import { OfficeHostService } from "./OfficeHostService";

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
   * Get list of documents for the current Office host (Word, Excel, or PowerPoint).
   * The API endpoint is chosen based on OfficeHostService.getDocumentRouteKey().
   */
  static async getDocuments(): Promise<DocuIdDocument[]> {
    const routeKey = OfficeHostService.getDocumentRouteKey();
    const url = DOCUMENT_ROUTES[routeKey];
    const host = OfficeHostService.getHost();
    try {
      this.apiLogger.logApiRequest("GET", url);

      // --- DEMO MODE CHECK ---
      if (AuthService.getSessionToken() === "demo-session-token") {
        this.apiLogger.info(`Returning demo documents for host: ${host}`);
        return this.getDemoDocuments(host);
      }
      // -----------------------

      const response =
        await this.getApiInstance().get<ApiResponse<{ files: DocuIdDocument[] }>>(url);

      if (response.data.success) {
        return response.data.data.files;
      }
      throw new Error(response.data.message || "Failed to fetch documents");
    } catch (error) {
      this.apiLogger.error(`Error fetching ${host} documents`, error as Error);
      throw error;
    }
  }

  /**
   * Backward-compatible alias kept for any callers that still use getWordDocuments.
   * @deprecated Use getDocuments() instead.
   */
  static async getWordDocuments(): Promise<DocuIdDocument[]> {
    return this.getDocuments();
  }

  /**
   * Returns host-appropriate demo documents.
   */
  private static getDemoDocuments(host: string): DocuIdDocument[] {
    if (host === "Excel") {
      return [
        {
          documentId: 2001,
          fileName: "Demo Budget.xlsx",
          filePath: "/demo/Demo Budget.xlsx",
          fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          fileSize: 512000,
          description: "A sample budget spreadsheet for demonstration.",
          folderId: null,
          isPasswordProtected: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          documentId: 2002,
          fileName: "Quarterly Data.xlsx",
          filePath: "/demo/Quarterly Data.xlsx",
          fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          fileSize: 1536000,
          description: "Highly confidential Q4 data.",
          folderId: null,
          isPasswordProtected: true,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ];
    }

    if (host === "PowerPoint") {
      return [
        {
          documentId: 3001,
          fileName: "Demo Presentation.pptx",
          filePath: "/demo/Demo Presentation.pptx",
          fileType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          fileSize: 2048000,
          description: "A sample presentation for demonstration.",
          folderId: null,
          isPasswordProtected: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          documentId: 3002,
          fileName: "Investor Deck.pptx",
          filePath: "/demo/Investor Deck.pptx",
          fileType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          fileSize: 4096000,
          description: "Confidential investor presentation.",
          folderId: null,
          isPasswordProtected: true,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ];
    }

    // Default: Word documents
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
      },
    ];
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

        // Word demo docs
        if (documentId === 1001 || documentId === 1002) {
          return {
            documentId,
            fileName: documentId === 1001 ? "Demo Proposal.docx" : "Confidential Report.docx",
            fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            fileSize: documentId === 1001 ? 1024500 : 2048000,
            description: "Demo Word document",
            folderId: null,
            isPasswordProtected: documentId === 1002,
            isEncrypted: false,
            status: "active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            access: {
              url: "demo-word-content-url",
              previewUrl: "demo-word-content-url",
              expiresIn: 3600,
              method: "GET",
              headers: {},
            },
          };
        }

        // Excel demo docs
        if (documentId === 2001 || documentId === 2002) {
          return {
            documentId,
            fileName: documentId === 2001 ? "Demo Budget.xlsx" : "Quarterly Data.xlsx",
            fileType: "text/csv",
            fileSize: documentId === 2001 ? 512000 : 1536000,
            description: "Demo Excel document",
            folderId: null,
            isPasswordProtected: documentId === 2002,
            isEncrypted: false,
            status: "active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            access: {
              url: "demo-excel-content-url",
              previewUrl: "demo-excel-content-url",
              expiresIn: 3600,
              method: "GET",
              headers: {},
            },
          };
        }

        // PowerPoint demo docs
        if (documentId === 3001 || documentId === 3002) {
          return {
            documentId,
            fileName: documentId === 3001 ? "Demo Presentation.pptx" : "Investor Deck.pptx",
            fileType: "text/plain",
            fileSize: documentId === 3001 ? 2048000 : 4096000,
            description: "Demo PowerPoint document",
            folderId: null,
            isPasswordProtected: documentId === 3002,
            isEncrypted: false,
            status: "active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            access: {
              url: "demo-powerpoint-content-url",
              previewUrl: "demo-powerpoint-content-url",
              expiresIn: 3600,
              method: "GET",
              headers: {},
            },
          };
        }
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
      if (
        AuthService.getSessionToken() === "demo-session-token" ||
        accessUrl === "demo-word-content-url" ||
        accessUrl === "demo-excel-content-url" ||
        accessUrl === "demo-powerpoint-content-url" ||
        accessUrl === "demo-document-content-url" // legacy fallback
      ) {
        this.apiLogger.info(`Returning demo content for URL: ${accessUrl}`);
        return this.createDemoContent(accessUrl);
      }
      // -----------------------

      let finalUrl = accessUrl;

      // Fix backend returning absolute URLs (like localhost or docuid.net)
      // which causes CORS or incorrect routing. Rewrite to proxied paths.
      if (finalUrl.includes("localhost:") || /^https?:\/\/(dev\.|www\.)?docuid\.net/i.test(finalUrl)) {
        try {
          const urlObj = new URL(finalUrl);
          const matchDownload = urlObj.pathname.match(/\/documents\/(\d+)\/download/);
          const matchContent = urlObj.pathname.match(/\/documents\/(\d+)\/content/);
          
          if (matchDownload && matchDownload[1]) {
            finalUrl = DOCUMENT_ROUTES.DOWNLOAD(parseInt(matchDownload[1]));
            this.apiLogger.info(`Rewrote absolute URL to: ${finalUrl}`);
          } else if (matchContent && matchContent[1]) {
            finalUrl = DOCUMENT_ROUTES.CONTENT(parseInt(matchContent[1]));
            this.apiLogger.info(`Rewrote absolute URL to: ${finalUrl}`);
          } else {
            // Fallback: use relative path
            finalUrl = urlObj.pathname + urlObj.search;
            this.apiLogger.info(`Rewrote absolute URL to relative path: ${finalUrl}`);
          }
        } catch (e) {
          // Ignore parse errors, keep original URL
        }
      }

      // Check if the URL is a relative dashboard URL that needs the API instance
      if (finalUrl.startsWith("/") || finalUrl.includes(window.location.host)) {
        const response = await this.getApiInstance().get(finalUrl, { responseType: "blob" });
        return response.data;
      }

      // If it's a direct presigned URL (S3), we can fetch it directly
      const response = await axios.get(finalUrl, { responseType: "blob" });
      return response.data;
    } catch (error) {
      this.apiLogger.error("Error downloading content", error as Error);
      throw error;
    }
  }

  /**
   * Create demo content blob appropriate for the given demo URL.
   *
   * demo-word-content-url      -> plain text (inserted as paragraphs in Word)
   * demo-excel-content-url     -> CSV rows  (parsed into cells in Excel)
   * demo-powerpoint-content-url -> plain text (inserted as slide text in PowerPoint)
   */
  private static createDemoContent(accessUrl: string): Blob {
    let text: string;
    let mimeType: string;

    if (accessUrl === "demo-excel-content-url") {
      // NOTE: No trailing footer line here — a date string like "4/22/2026, 8:32 AM"
      // contains a comma which would produce a row with a different column count
      // and cause the Excel range.values assignment to fail.
      text =
        "Category,Q1,Q2,Q3,Q4,Total\n" +
        "Revenue,120000,135000,148000,162000,565000\n" +
        "Cost of Goods,72000,81000,88800,97200,339000\n" +
        "Gross Profit,48000,54000,59200,64800,226000\n" +
        "Operating Expenses,30000,32000,34000,36000,132000\n" +
        "Net Income,18000,22000,25200,28800,94000";
      mimeType = "text/csv";
    } else if (accessUrl === "demo-powerpoint-content-url") {
      text =
        "iVALT Docuid - Demo Presentation\n\n" +
        "Slide 1: Introduction\n" +
        "Welcome to the iVALT Docuid Office Add-in demo.\n\n" +
        "Slide 2: Key Features\n" +
        "- Biometric document access\n" +
        "- Secure sharing with audit trail\n" +
        "- Works across Word, Excel, and PowerPoint\n\n" +
        "Slide 3: How It Works\n" +
        "1. Login with your registered mobile number\n" +
        "2. Approve the biometric request on the iVALT app\n" +
        "3. Access and share documents securely\n\n" +
        "Generated by iVALT Docuid demo mode on " +
        new Date().toLocaleString();
      mimeType = "text/plain";
    } else {
      // Word (demo-word-content-url or legacy demo-document-content-url)
      text =
        "iVALT Docuid - Demo Document\n\n" +
        "This is a demo document generated for the iVALT Docuid Office Add-in preview.\n\n" +
        "Section 1: Overview\n" +
        "iVALT Docuid provides biometric-secured document management directly inside " +
        "Microsoft Office applications.\n\n" +
        "Section 2: Features\n" +
        "- One-tap biometric login via the iVALT mobile app\n" +
        "- Access Word, Excel, and PowerPoint files stored in DocuID\n" +
        "- Share documents with granular permission controls\n" +
        "- Full audit trail for every document access\n\n" +
        "All features are unlocked in demo mode.\n" +
        "Document generated on: " +
        new Date().toLocaleString();
      mimeType = "text/plain";
    }

    const encoder = new TextEncoder();
    return new Blob([encoder.encode(text)], { type: mimeType });
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
          countryCallingCode: payload.countryCode || undefined,
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
