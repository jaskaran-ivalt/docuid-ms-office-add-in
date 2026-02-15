import axios, { AxiosInstance, AxiosError } from "axios";
import { AuthService } from "./AuthService";
import { Logger } from "./Logger";
import { DOCUMENT_ROUTES, SHARE_ROUTES, API_CONFIG } from "../../config/apiRoutes";

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

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface ShareApiResponse {
  shareId?: number;
  shareLink?: string;
  message?: string;
}

export interface UploadDocumentResponse {
  success: boolean;
  document: DocuIdDocument;
}

export class DocuIdApiService {
  private static instance: AxiosInstance | null = null;
  private static readonly logger = Logger.getInstance().createContextLogger("DocuIdApiService");

  private static getApiInstance(): AxiosInstance {
    if (!this.instance) {
      this.instance = axios.create({
        baseURL: API_CONFIG.BASE_URL,
        headers: { "Content-Type": API_CONFIG.HEADERS.CONTENT_TYPE },
        withCredentials: API_CONFIG.WITH_CREDENTIALS,
      });

      this.instance.interceptors.request.use((config) => {
        const token = AuthService.getSessionToken();
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
      });

      this.instance.interceptors.response.use(
        (response) => response,
        (error: AxiosError) => {
          if (error.response?.status === 401) AuthService.logout();
          return Promise.reject(error);
        }
      );
    }
    return this.instance;
  }

  static async getWordDocuments(options?: {
    search?: string;
    folderId?: string;
    limit?: number;
    offset?: number;
  }): Promise<DocuIdDocument[]> {
    try {
      const response = await this.getApiInstance().get<ApiResponse<{ files: DocuIdDocument[] }>>(
        DOCUMENT_ROUTES.WORD_FILES,
        { params: options }
      );
      return response.data.success ? response.data.data.files : [];
    } catch (error) {
      this.logger.error("Failed to fetch Word documents", error as Error);
      throw error;
    }
  }

  static async getDocumentAccess(documentId: number): Promise<DocumentAccess> {
    try {
      const response = await this.getApiInstance().get<ApiResponse<{ document: DocumentAccess }>>(
        DOCUMENT_ROUTES.DOCUMENT_ACCESS(documentId)
      );
      if (response.data.success) return response.data.data.document;
      throw new Error(response.data.message || "Failed to get document access");
    } catch (error) {
      this.logger.error(`Failed to get access for document ${documentId}`, error as Error);
      throw error;
    }
  }

  static async downloadDocumentContent(accessUrl: string): Promise<Blob> {
    try {
      let downloadUrl = accessUrl;
      const match = accessUrl.match(/\/api\/documents\/(\d+)\/(download|content)/);
      if (match && !accessUrl.includes("/api/docuid/")) {
        const id = Number(match[1]);
        downloadUrl = match[2] === "download" ? DOCUMENT_ROUTES.DOWNLOAD(id) : DOCUMENT_ROUTES.CONTENT(id);
      }

      const response = await this.getApiInstance().get(downloadUrl, { responseType: "blob" });
      return response.data;
    } catch (error) {
      this.logger.error("Failed to download document content", error as Error);
      throw error;
    }
  }

  static async shareDocument(payload: {
    documentId: number;
    email?: string;
    countryCode?: string;
    mobile?: string;
    message?: string;
  }): Promise<ApiResponse<ShareApiResponse>> {
    try {
      const shareRequest = {
        documentId: payload.documentId,
        recipientType: "individual",
        recipients: {
          email: payload.email,
          countryCode: payload.countryCode ? `+${payload.countryCode.replace("+", "")}` : undefined,
          mobile: payload.mobile,
        },
        accessLevel: "download",
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        requiresPassword: false,
        customMessage: payload.message,
        allowDownload: true,
        allowPrint: true,
      };

      const response = await this.getApiInstance().post<ApiResponse<ShareApiResponse>>(
        SHARE_ROUTES.OPTIMIZED,
        shareRequest
      );
      return response.data;
    } catch (error) {
      this.logger.error("Failed to share document", error as Error);
      throw error;
    }
  }

  static async updateDocumentContent(documentId: number, file: File): Promise<UploadDocumentResponse> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await this.getApiInstance().put<UploadDocumentResponse>(
        DOCUMENT_ROUTES.UPDATE_CONTENT(documentId),
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to update content for document ${documentId}`, error as Error);
      throw error;
    }
  }

  static reset(): void {
    this.instance = null;
  }
}
}
