import { Logger } from "./Logger";
import { DocumentRepository } from "./repositories/DocumentRepository";
import { DocuIdDocument } from "./DocuIdApiService";

/* global Word */

export interface Document {
  id: string;
  title: string;
  type: string;
  dateModified: string;
  size: string;
  documentId?: number;
}

export interface DocumentContent {
  id: string;
  fileName: string;
  contentType: string;
  binaryContent?: Blob;
}

export class DocumentService {
  private readonly logger = Logger.getInstance().createContextLogger("DocumentService");

  constructor(private readonly repository: DocumentRepository) {}

  async getDocuments(): Promise<Document[]> {
    try {
      this.logger.info("Fetching Word documents");
      const apiDocs = await this.repository.getWordFiles();

      return apiDocs.map((doc: DocuIdDocument) => ({
        id: doc.documentId.toString(),
        title: doc.fileName,
        type: this.getFileExtension(doc.fileName),
        dateModified: new Date(doc.updatedAt).toLocaleDateString(),
        size: this.formatFileSize(doc.fileSize),
        documentId: doc.documentId,
      }));
    } catch (error) {
      this.logger.error("Failed to fetch documents", error as Error);
      throw error;
    }
  }

  async openDocument(documentId: string): Promise<void> {
    try {
      const docId = parseInt(documentId);
      const accessInfo = await this.repository.getAccessInfo(docId);
      
      if (!accessInfo.access.url) throw new Error("No download URL");

      const blob = await this.repository.downloadBlob(accessInfo.access.url);
      await this.insertIntoWord(blob, accessInfo.fileName);
    } catch (error) {
      this.logger.error(`Failed to open document: ${documentId}`, error as Error);
      throw error;
    }
  }

  async closeDocument(documentId: string): Promise<void> {
    try {
      this.logger.info(`Closing document: ${documentId}`);
      // Simulation for now
      await new Promise((resolve) => setTimeout(resolve, 500));
      this.logger.info(`Document closed: ${documentId}`);
    } catch (error) {
      this.logger.error(`Failed to close document: ${documentId}`, error as Error);
      throw error;
    }
  }

  async shareDocument(payload: any): Promise<{ success: boolean; data?: any; message: string }> {
    try {
      this.logger.info("Sharing document", { documentId: payload.documentId });
      const response = await this.repository.shareDocument(payload);
      return response;
    } catch (error) {
      this.logger.error("Failed to share document", error as Error);
      throw error;
    }
  }

  private async insertIntoWord(blob: Blob, fileName: string): Promise<void> {
    return Word.run(async (context) => {
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = this.arrayBufferToBase64(arrayBuffer);
      
      context.document.body.clear();
      context.document.body.insertFileFromBase64(base64, Word.InsertLocation.start);
      await context.sync();
    });
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  private getFileExtension(fileName: string): string {
    return fileName.split(".").pop()?.toLowerCase() || "";
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

