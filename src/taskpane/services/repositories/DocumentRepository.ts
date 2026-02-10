import { IHttpClient } from './interfaces';
import { DocuIdDocument, DocumentAccess } from './DocuIdApiService';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

interface WordFilesResponse {
  files: DocuIdDocument[];
}

export class DocumentRepository {
  constructor(private httpClient: IHttpClient) {}

  async getWordFiles(options?: { search?: string; folderId?: string }): Promise<DocuIdDocument[]> {
    const params = new URLSearchParams();
    if (options?.search) params.append('search', options.search);
    if (options?.folderId) params.append('folderId', options.folderId);
    
    const url = `/api/docuid/documents/word-files${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await this.httpClient.get<ApiResponse<WordFilesResponse>>(url);
    
    if (response.data.success) {
      return response.data.data.files;
    }
    throw new Error(response.data.message || 'Failed to fetch documents');
  }

  async getAccessInfo(documentId: number): Promise<DocumentAccess> {
    const url = `/api/docuid/documents/${documentId}/access`;
    const response = await this.httpClient.get<ApiResponse<{ document: DocumentAccess }>>(url);
    
    if (response.data.success) {
      return response.data.data.document;
    }
    throw new Error(response.data.message || 'Failed to get document access');
  }

  async downloadBlob(url: string): Promise<Blob> {
    const response = await this.httpClient.get(url, { responseType: 'blob' });
    return response.data as Blob;
  }

  async shareDocument(payload: any): Promise<ApiResponse<{ shareLink?: string; shareId?: number }>> {
    const url = "/api/docuid/shares/optimized";
    const response = await this.httpClient.post<ApiResponse<{ shareLink?: string; shareId?: number }>>(url, payload);
    return response.data;
  }
}
