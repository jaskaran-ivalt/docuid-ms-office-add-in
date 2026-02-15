import { DocuIdApiService, DocuIdDocument } from "./DocuIdApiService";
import { Logger } from "./Logger";
import { Document } from "../types";

/* global Word, Office */

interface DocumentContent {
  id: string;
  content: string;
  contentType: string;
  fileName: string;
  documentType?: string;
  binaryContent?: Blob;
}

export class DocumentService {
  private static readonly logger = Logger.getInstance().createContextLogger("DocumentService");

  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  private static getFileExtension(fileName: string): string {
    return fileName.split(".").pop()?.toLowerCase() || "";
  }

  static async getDocuments(): Promise<Document[]> {
    try {
      this.logger.info("Fetching Word documents from DocuID API");
      const apiDocs = await DocuIdApiService.getWordDocuments();

      return apiDocs.map((doc: DocuIdDocument) => ({
        id: doc.documentId.toString(),
        title: doc.fileName,
        type: this.getFileExtension(doc.fileName),
        dateModified: new Date(doc.updatedAt).toLocaleDateString(),
        size: this.formatFileSize(doc.fileSize),
        documentId: doc.documentId,
        isPasswordProtected: doc.isPasswordProtected,
        description: doc.description,
      }));
    } catch (error) {
      this.logger.error("Failed to fetch documents", error as Error);
      throw error;
    }
  }

  static async openDocument(documentId: string): Promise<void> {
    try {
      this.logger.info(`Opening document: ${documentId}`);
      const documentContent = await this.getDocumentContent(documentId);
      await this.insertIntoWord(documentContent);
    } catch (error) {
      this.logger.error(`Failed to open document: ${documentId}`, error as Error);
      throw new Error("Failed to open document in Word");
    }
  }

  static async closeDocument(documentId: string): Promise<void> {
    this.logger.info(`Closing document: ${documentId}`);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  private static async getDocumentContent(documentId: string): Promise<DocumentContent> {
    try {
      const docId = parseInt(documentId);
      if (isNaN(docId)) throw new Error("Invalid document ID");

      const accessInfo = await DocuIdApiService.getDocumentAccess(docId);
      if (!accessInfo.access.url) throw new Error("Document access URL not available");

      const blobContent = await DocuIdApiService.downloadDocumentContent(accessInfo.access.url);

      return {
        id: documentId,
        content: "",
        contentType: accessInfo.fileType,
        fileName: accessInfo.fileName,
        documentType: this.getFileExtension(accessInfo.fileName),
        binaryContent: blobContent,
      };
    } catch (error) {
      this.logger.error("Failed to get document content", error as Error);
      throw error;
    }
  }

  private static async insertIntoWord(documentContent: DocumentContent): Promise<void> {
    if (!documentContent.binaryContent) throw new Error("No binary content available");

    return Word.run(async (context) => {
      context.document.body.clear();
      await context.sync();

      const arrayBuffer = await documentContent.binaryContent!.arrayBuffer();
      const base64String = this.arrayBufferToBase64(arrayBuffer);

      context.document.body.insertFileFromBase64(base64String, Word.InsertLocation.start);
      await context.sync();
    });
  }

  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private static async getWordFileBlob(): Promise<Blob> {
    return new Promise<Blob>((resolve, reject) => {
      const sliceSize = 4 * 1024 * 1024;
      Office.context.document.getFileAsync(
        Office.FileType.Compressed,
        { sliceSize },
        (result: Office.AsyncResult<Office.File>) => {
          if (result.status !== Office.AsyncResultStatus.Succeeded) {
            reject(new Error(result.error?.message || "Failed to get document file"));
            return;
          }

          const file = result.value;
          const sliceCount = file.sliceCount;
          const slices: Uint8Array[] = [];
          let slicesReceived = 0;

          const readSlice = (index: number) => {
            file.getSliceAsync(index, (sliceResult: Office.AsyncResult<Office.Slice>) => {
              if (sliceResult.status !== Office.AsyncResultStatus.Succeeded) {
                file.closeAsync();
                reject(new Error(sliceResult.error?.message || `Failed to read slice ${index}`));
                return;
              }

              slices[index] = new Uint8Array(sliceResult.value.data as ArrayBuffer);
              slicesReceived++;

              if (slicesReceived === sliceCount) {
                file.closeAsync();
                resolve(new Blob(slices, { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }));
              } else {
                readSlice(index + 1);
              }
            });
          };

          if (sliceCount > 0) readSlice(0);
          else {
            file.closeAsync();
            reject(new Error("Document has no content"));
          }
        }
      );
    });
  }

  static async saveDocumentToServer(
    documentId: string,
    fileName: string
  ): Promise<{ documentId: number; fileName: string }> {
    try {
      const numericId = parseInt(documentId);
      if (isNaN(numericId)) throw new Error("Invalid document ID");

      const blob = await this.getWordFileBlob();
      const file = new File([blob], fileName, { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });

      const response = await DocuIdApiService.updateDocumentContent(numericId, file);
      if (!response.success) throw new Error("Update failed");

      return {
        documentId: response.document.documentId,
        fileName: response.document.fileName,
      };
    } catch (error) {
      this.logger.error(`Failed to save document to server: ${documentId}`, error as Error);
      throw error;
    }
  }
}
