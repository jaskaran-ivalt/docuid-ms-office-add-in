import type { DocuIdDocument, Document } from '../common/types';
import { formatFileSize, getFileExtension } from '../common/utils';
import { DocuIdApiService } from './DocuIdApiService';
import { ExcelDocumentHandler } from './ExcelDocumentHandler';
import type { IDocumentHandler } from './IDocumentHandler';
import { logger } from './Logger';
import type { OfficeHost } from './OfficeHostService';
import { OfficeHostService } from './OfficeHostService';
import { PowerPointDocumentHandler } from './PowerPointDocumentHandler';
import { WordDocumentHandler } from './WordDocumentHandler';

/**
 * Returns the host-specific document handler for the given Office host.
 * Falls back to WordDocumentHandler for Unknown hosts.
 */
function getHandlerForHost(host: OfficeHost): IDocumentHandler {
  if (host === 'Excel') return ExcelDocumentHandler;
  if (host === 'PowerPoint') return PowerPointDocumentHandler;
  return WordDocumentHandler; // Word + Unknown
}

export class DocumentService {
  private static readonly docLogger = logger.createContextLogger('DocumentService');

  /**
   * Get user's documents from the DocuID API.
   * The correct host-specific endpoint is resolved via OfficeHostService.
   */
  static async getDocuments(): Promise<Document[]> {
    try {
      const host = OfficeHostService.getHost();
      DocumentService.docLogger.info(`Fetching ${host} documents from DocuID API`);

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

      DocumentService.docLogger.info('Documents fetched successfully', { count: documents.length });
      return documents;
    } catch (error) {
      DocumentService.docLogger.error('Failed to fetch documents', error as Error);
      throw error;
    }
  }

  /**
   * Open a document in the active Office host application.
   * Delegates insertion to the host-specific handler.
   */
  static async openDocument(documentId: string): Promise<void> {
    try {
      DocumentService.docLogger.info(`Opening document: ${documentId}`);

      const docId = parseInt(documentId, 10);
      if (Number.isNaN(docId)) {
        throw new Error('Invalid document ID');
      }

      const accessInfo = await DocuIdApiService.getDocumentAccess(docId);

      if (!accessInfo.access.url) {
        throw new Error('Document access URL not available');
      }

      const blobContent = await DocuIdApiService.downloadDocumentContent(accessInfo.access.url);

      const documentContent = {
        id: documentId,
        content: '',
        contentType: accessInfo.fileType,
        fileName: accessInfo.fileName,
        documentType: getFileExtension(accessInfo.fileName),
        binaryContent: blobContent,
      };

      const host = OfficeHostService.getHost();
      const handler = getHandlerForHost(host);

      // Clear before inserting to prevent content from being appended
      await handler.clear();
      await handler.insert(documentContent);

      DocumentService.docLogger.info(`Successfully opened document: ${documentId}`, {
        fileName: documentContent.fileName,
        host,
      });
    } catch (error) {
      DocumentService.docLogger.error(`Failed to open document: ${documentId}`, error as Error);
      throw error;
    }
  }

  /**
   * Clear the active document's content in the current Office host.
   * Delegates to the host-specific handler.
   */
  static async clearDocument(): Promise<void> {
    const host = OfficeHostService.getHost();
    DocumentService.docLogger.info(`Clearing ${host} document content`);

    try {
      const handler = getHandlerForHost(host);
      await handler.clear();
    } catch (error) {
      DocumentService.docLogger.error(`Failed to clear ${host} document`, error as Error);
    }
  }

  /**
   * Close a document and clear its content.
   */
  static async closeDocument(documentId: string): Promise<void> {
    DocumentService.docLogger.info(`Closing document: ${documentId}`);
    await DocumentService.clearDocument();
  }
}
