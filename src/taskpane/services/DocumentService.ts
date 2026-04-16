import { DocuIdApiService } from "./DocuIdApiService";
import { logger } from "./Logger";
import { Document, DocuIdDocument } from "../common/types";
import { formatFileSize, getFileExtension, arrayBufferToBase64 } from "../common/utils";

/* global Word */

interface DocumentContent {
  id: string;
  content: string;
  contentType: string;
  fileName: string;
  documentType?: string;
  binaryContent?: Blob;
}

export class DocumentService {
  private static readonly docLogger = logger.createContextLogger("DocumentService");

  /**
   * Get user's Word documents from the DocuID API
   */
  static async getDocuments(): Promise<Document[]> {
    try {
      this.docLogger.info("Fetching Word documents from DocuID API");

      const apiDocs = await DocuIdApiService.getWordDocuments();

      // Transform API response to Document interface
      const documents: Document[] = apiDocs.map((doc: DocuIdDocument) => ({
        id: doc.documentId.toString(),
        title: doc.fileName,
        type: getFileExtension(doc.fileName),
        dateModified: new Date(doc.updatedAt).toLocaleDateString(),
        size: formatFileSize(doc.fileSize),
        documentId: doc.documentId,
        isPasswordProtected: doc.isPasswordProtected,
        description: doc.description,
      }));

      this.docLogger.info("Documents fetched successfully", { count: documents.length });
      return documents;
    } catch (error) {
      this.docLogger.error("Failed to fetch documents", error as Error);
      throw error;
    }
  }

  /**
   * Open a document in Word
   */
  static async openDocument(documentId: string): Promise<void> {
    try {
      this.docLogger.info(`Opening document: ${documentId}`);

      const docId = parseInt(documentId);
      if (isNaN(docId)) {
        throw new Error("Invalid document ID");
      }

      // Get document access information
      const accessInfo = await DocuIdApiService.getDocumentAccess(docId);

      if (!accessInfo.access.url) {
        throw new Error("Document access URL not available");
      }

      // Download the document content
      const blobContent = await DocuIdApiService.downloadDocumentContent(accessInfo.access.url);

      const documentContent: DocumentContent = {
        id: documentId,
        content: "",
        contentType: accessInfo.fileType,
        fileName: accessInfo.fileName,
        documentType: getFileExtension(accessInfo.fileName),
        binaryContent: blobContent,
      };

      // Insert into Word using Office.js
      await this.insertIntoWord(documentContent);

      this.docLogger.info(`Successfully opened document: ${documentId}`, {
        fileName: documentContent.fileName,
      });
    } catch (error) {
      this.docLogger.error(`Failed to open document: ${documentId}`, error as Error);
      throw error;
    }
  }

  /**
   * Insert document content into Word
   */
  private static async insertIntoWord(documentContent: DocumentContent): Promise<void> {
    const officeLogger = logger.createContextLogger("DocumentService.Office");

    return Word.run(async (context) => {
      try {
        if (!documentContent.binaryContent) {
          throw new Error("No binary content available for insertion");
        }

        officeLogger.debug("Clearing existing document content");
        context.document.body.clear();
        await context.sync();

        // Convert blob to text for demo mode, or base64 for real files
        const arrayBuffer = await documentContent.binaryContent.arrayBuffer();
        const textDecoder = new TextDecoder();
        const textContent = textDecoder.decode(arrayBuffer);

        // Check if this is demo content (plain text) or a real file
        if (documentContent.contentType === "text/plain" || textContent.includes("demo document generated")) {
          // Use insertParagraph for demo text content
          officeLogger.debug("Inserting demo text content as paragraphs");
          // Split text by newlines and insert each line as a separate paragraph
          const lines = textContent.split("\n");
          lines.forEach((line, index) => {
            const insertLocation = index === 0 ? Word.InsertLocation.start : Word.InsertLocation.end;
            context.document.body.insertParagraph(line, insertLocation);
          });
        } else {
          // Use insertFileFromBase64 for real Office files
          const base64String = arrayBufferToBase64(arrayBuffer);
          officeLogger.debug("Inserting file into Word");
          context.document.body.insertFileFromBase64(base64String, Word.InsertLocation.start);
        }

        await context.sync();
        officeLogger.logOfficeOperation("Document insertion", true);
      } catch (error) {
        officeLogger.logOfficeOperation("Document insertion", false, error);
        throw error;
      }
    });
  }

  /**
   * Close a document (placeholder for future implementation)
   */
  static async closeDocument(documentId: string): Promise<void> {
    this.docLogger.info(`Closing document: ${documentId} (mock)`);
    // Future: implement session closing on backend if needed
  }
}
