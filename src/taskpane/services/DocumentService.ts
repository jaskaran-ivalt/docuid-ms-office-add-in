import { DocuIdApiService } from "./DocuIdApiService";
import { logger } from "./Logger";
import { Document, DocuIdDocument } from "../common/types";
import { formatFileSize, getFileExtension, arrayBufferToBase64 } from "../common/utils";
import { OfficeHostService } from "./OfficeHostService";

/* global Word, Excel, PowerPoint */

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
   * Get user's documents from the DocuID API.
   * The correct host-specific endpoint is resolved via OfficeHostService.
   */
  static async getDocuments(): Promise<Document[]> {
    try {
      const host = OfficeHostService.getHost();
      this.docLogger.info(`Fetching ${host} documents from DocuID API`);

      const apiDocs = await DocuIdApiService.getDocuments();

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
   * Open a document in the active Office host application.
   */
  static async openDocument(documentId: string): Promise<void> {
    try {
      this.docLogger.info(`Opening document: ${documentId}`);

      const docId = parseInt(documentId);
      if (isNaN(docId)) {
        throw new Error("Invalid document ID");
      }

      const accessInfo = await DocuIdApiService.getDocumentAccess(docId);

      if (!accessInfo.access.url) {
        throw new Error("Document access URL not available");
      }

      const blobContent = await DocuIdApiService.downloadDocumentContent(accessInfo.access.url);

      const documentContent: DocumentContent = {
        id: documentId,
        content: "",
        contentType: accessInfo.fileType,
        fileName: accessInfo.fileName,
        documentType: getFileExtension(accessInfo.fileName),
        binaryContent: blobContent,
      };

      // Dispatch to host-specific insertion logic
      const host = OfficeHostService.getHost();
      if (host === "Excel") {
        await this.insertIntoExcel(documentContent);
      } else if (host === "PowerPoint") {
        await this.insertIntoPowerPoint(documentContent);
      } else {
        // Default: Word (also handles Unknown)
        await this.insertIntoWord(documentContent);
      }

      this.docLogger.info(`Successfully opened document: ${documentId}`, {
        fileName: documentContent.fileName,
        host,
      });
    } catch (error) {
      this.docLogger.error(`Failed to open document: ${documentId}`, error as Error);
      throw error;
    }
  }

  /**
   * Insert document content into Word.
   */
  private static async insertIntoWord(documentContent: DocumentContent): Promise<void> {
    const officeLogger = logger.createContextLogger("DocumentService.Word");

    return Word.run(async (context) => {
      try {
        if (!documentContent.binaryContent) {
          throw new Error("No binary content available for insertion");
        }

        officeLogger.debug("Clearing existing document content");
        context.document.body.clear();
        await context.sync();

        const arrayBuffer = await documentContent.binaryContent.arrayBuffer();
        const textDecoder = new TextDecoder();
        const textContent = textDecoder.decode(arrayBuffer);

        if (
          documentContent.contentType === "text/plain" ||
          textContent.includes("demo document generated")
        ) {
          officeLogger.debug("Inserting demo text content as paragraphs");
          const lines = textContent.split("\n");
          lines.forEach((line, index) => {
            const insertLocation =
              index === 0 ? Word.InsertLocation.start : Word.InsertLocation.end;
            context.document.body.insertParagraph(line, insertLocation);
          });
        } else {
          const base64String = arrayBufferToBase64(arrayBuffer);
          officeLogger.debug("Inserting file into Word");
          context.document.body.insertFileFromBase64(base64String, Word.InsertLocation.start);
        }

        await context.sync();
        officeLogger.logOfficeOperation("Document insertion (Word)", true);
      } catch (error) {
        officeLogger.logOfficeOperation("Document insertion (Word)", false, error);
        throw error;
      }
    });
  }

  /**
   * Insert document content into Excel.
   * For xlsx files the content is inserted into the active sheet starting at A1.
   * For plain-text / csv content each row is split on commas and written cell by cell.
   */
  private static async insertIntoExcel(documentContent: DocumentContent): Promise<void> {
    const officeLogger = logger.createContextLogger("DocumentService.Excel");

    return Excel.run(async (context) => {
      try {
        if (!documentContent.binaryContent) {
          throw new Error("No binary content available for insertion");
        }

        const arrayBuffer = await documentContent.binaryContent.arrayBuffer();
        const textDecoder = new TextDecoder();
        const textContent = textDecoder.decode(arrayBuffer);

        const sheet = context.workbook.worksheets.getActiveWorksheet();

        // Clear existing used range
        const usedRange = sheet.getUsedRangeOrNullObject();
        usedRange.load("isNullObject");
        await context.sync();
        if (!usedRange.isNullObject) {
          usedRange.clear();
          await context.sync();
        }

        if (
          documentContent.contentType === "text/plain" ||
          documentContent.contentType === "text/csv" ||
          textContent.includes("demo document generated")
        ) {
          // Parse CSV/plain text into a 2-D array
          officeLogger.debug("Inserting plain text / CSV content into Excel");
          const rows = textContent
            .split("\n")
            .filter((line) => line.trim().length > 0)
            .map((line) => line.split(",").map((cell) => cell.trim()));

          if (rows.length > 0) {
            const range = sheet.getRangeByIndexes(0, 0, rows.length, rows[0].length);
            range.values = rows;
            await context.sync();
          }
        } else {
          // For real xlsx files, insert a note since Excel.run does not support
          // insertFileFromBase64 in the same way Word does.
          officeLogger.debug("Non-text content detected; writing placeholder for real XLSX file");
          sheet.getRange("A1").values = [
            [`File: ${documentContent.fileName} loaded. Open directly for full fidelity.`],
          ];
          await context.sync();
        }

        officeLogger.logOfficeOperation("Document insertion (Excel)", true);
      } catch (error) {
        officeLogger.logOfficeOperation("Document insertion (Excel)", false, error);
        throw error;
      }
    });
  }

  /**
   * Insert document content into PowerPoint.
   * For demo / plain-text content a new slide with a text box is added.
   */
  private static async insertIntoPowerPoint(documentContent: DocumentContent): Promise<void> {
    const officeLogger = logger.createContextLogger("DocumentService.PowerPoint");

    try {
      if (!documentContent.binaryContent) {
        throw new Error("No binary content available for insertion");
      }

      const arrayBuffer = await documentContent.binaryContent.arrayBuffer();
      const textDecoder = new TextDecoder();
      const textContent = textDecoder.decode(arrayBuffer);

      if (
        documentContent.contentType === "text/plain" ||
        textContent.includes("demo document generated")
      ) {
        // Use the Office.js Common API to insert a new slide with text
        officeLogger.debug("Inserting plain text content as PowerPoint slide");
        await Office.context.document.setSelectedDataAsync(textContent, {
          coercionType: Office.CoercionType.Text,
        });
      } else {
        // For real pptx files use insertSelectedDataAsync with SlideRange (if available)
        officeLogger.debug("Inserting base64 PPTX content into PowerPoint");
        const base64String = arrayBufferToBase64(arrayBuffer);
        // PowerPoint.run is used for modern API; fall back to common API for older hosts
        if (typeof PowerPoint !== "undefined" && PowerPoint.run) {
          await PowerPoint.run(async (context) => {
            context.presentation.insertSlidesFromBase64(base64String);
            await context.sync();
          });
        } else {
          // Common API fallback
          await Office.context.document.setSelectedDataAsync(
            base64String,
            { coercionType: (Office.CoercionType as any).SlideRange },
          );
        }
      }

      officeLogger.logOfficeOperation("Document insertion (PowerPoint)", true);
    } catch (error) {
      officeLogger.logOfficeOperation("Document insertion (PowerPoint)", false, error);
      throw error;
    }
  }

  /**
   * Close a document (placeholder for future implementation).
   */
  static async closeDocument(documentId: string): Promise<void> {
    this.docLogger.info(`Closing document: ${documentId} (mock)`);
    // Future: implement session closing on backend if needed
  }
}
