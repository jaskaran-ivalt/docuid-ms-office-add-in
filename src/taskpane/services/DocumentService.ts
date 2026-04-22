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

      // Clear document content before opening a new one to prevent appending
      await this.clearDocument();

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
        // Also clear headers/footers to be thorough
        context.document.sections.load("items");
        await context.sync();
        
        context.document.sections.items.forEach((section) => {
          section.getHeader(Word.HeaderFooterType.primary).clear();
          section.getFooter(Word.HeaderFooterType.primary).clear();
        });
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
   * CSV / plain-text content is parsed and written cell-by-cell starting at A1.
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

        // Clear existing content in the active sheet
        try {
          const usedRange = sheet.getUsedRange();
          usedRange.clear();
          await context.sync();
        } catch {
          // Sheet is empty - nothing to clear
        }

        if (
          documentContent.contentType === "text/plain" ||
          documentContent.contentType === "text/csv" ||
          textContent.includes("demo document generated")
        ) {
          officeLogger.debug("Inserting plain text / CSV content into Excel");

          // Parse every non-empty line into cells by splitting on comma.
          const rawRows = textContent
            .split("\n")
            .filter((line) => line.trim().length > 0)
            .map((line) => line.split(",").map((cell) => cell.trim()));

          if (rawRows.length > 0) {
            // All rows must have the same column count for range.values to work.
            // Pad shorter rows with empty strings so they match the widest row.
            const maxCols = Math.max(...rawRows.map((r) => r.length));
            const rows: string[][] = rawRows.map((r) => {
              const padded = [...r];
              while (padded.length < maxCols) {
                padded.push("");
              }
              return padded;
            });

            const range = sheet.getRangeByIndexes(0, 0, rows.length, maxCols);
            // Excel API expects (string | number | boolean)[][] but string[][] is compatible
            range.values = rows as unknown as (string | number | boolean)[][];
            await context.sync();
          }
        } else {
          // Real xlsx binary - write a placeholder note since Excel.run cannot
          // insert a binary workbook the same way Word can insertFileFromBase64.
          officeLogger.debug("Non-text content: writing placeholder for real XLSX");
          sheet.getRange("A1").values = [
            [`File: ${documentContent.fileName} - open directly for full fidelity.`],
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
   * Clear the active document's content.
   */
  static async clearDocument(): Promise<void> {
    const host = OfficeHostService.getHost();
    this.docLogger.info(`Clearing ${host} document content`);

    try {
      if (host === "Word") {
        return Word.run(async (context) => {
          context.document.body.clear();
          await context.sync();
        });
      } else if (host === "Excel") {
        return Excel.run(async (context) => {
          try {
            const sheet = context.workbook.worksheets.getActiveWorksheet();
            const usedRange = sheet.getUsedRange();
            usedRange.clear();
            await context.sync();
          } catch (e) {
            // Sheet is likely empty
          }
        });
      } else if (host === "PowerPoint") {
        // Use modern PowerPoint API to delete all slides
        if (typeof PowerPoint !== "undefined" && PowerPoint.run) {
          return PowerPoint.run(async (context) => {
            const slides = context.presentation.slides;
            slides.load("items");
            await context.sync();
            
            // We need at least one slide to exist in a presentation,
            // so we add a new blank slide before deleting others,
            // or just delete all but one and clear that one.
            if (slides.items.length > 0) {
              // Delete all slides from last to first to avoid index shifting issues
              // or just call delete() on each.
              for (let i = slides.items.length - 1; i >= 0; i--) {
                slides.items[i].delete();
              }
              // Add a fresh slide
              context.presentation.slides.add();
            }
            await context.sync();
          });
        } else {
          this.docLogger.info("PowerPoint.run not available for clearing slides");
        }
      }
    } catch (error) {
      this.docLogger.error(`Failed to clear ${host} document`, error as Error);
    }
  }

  /**
   * Close a document and clear its content.
   */
  static async closeDocument(documentId: string): Promise<void> {
    this.docLogger.info(`Closing document: ${documentId}`);
    await this.clearDocument();
  }
}
