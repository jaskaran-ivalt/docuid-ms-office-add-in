import type { DocuIdDocument, Document } from '../../common/types';
import { formatFileSize, getFileExtension } from '../../common/utils';
import { DocuIdApiService } from '../DocuIdApiService';
import { logger } from '../Logger';
import { OfficeHostService } from '../OfficeHostService';
import type { DocumentContent } from './types';
import { insertIntoExcel, clearExcelDocument } from './ExcelService';
import { insertIntoPowerPoint, clearPowerPointDocument } from './PowerPointService';
import { insertIntoWord, clearWordDocument } from './WordService';

const docLogger = logger.createContextLogger('DocumentService');

export class DocumentService {
  static async getDocuments(): Promise<Document[]> {
    try {
      const host = OfficeHostService.getHost();
      docLogger.info(`Fetching ${host} documents from DocuID API`);

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

      docLogger.info('Documents fetched successfully', { count: documents.length });
      return documents;
    } catch (error) {
      docLogger.error('Failed to fetch documents', error as Error);
      throw error;
    }
  }

  static async openDocument(documentId: string): Promise<void> {
    try {
      docLogger.info(`Opening document: ${documentId}`);

      const docId = parseInt(documentId, 10);
      if (Number.isNaN(docId)) {
        throw new Error('Invalid document ID');
      }

      const accessInfo = await DocuIdApiService.getDocumentAccess(docId);

      if (!accessInfo.access.url) {
        throw new Error('Document access URL not available');
      }

      const blobContent = await DocuIdApiService.downloadDocumentContent(accessInfo.access.url);

      const documentContent: DocumentContent = {
        id: documentId,
        content: '',
        contentType: accessInfo.fileType,
        fileName: accessInfo.fileName,
        documentType: getFileExtension(accessInfo.fileName),
        binaryContent: blobContent,
      };

      const host = OfficeHostService.getHost();

      switch (host) {
        case 'Excel':
          await clearExcelDocument();
          await insertIntoExcel(documentContent);
          break;
        case 'PowerPoint':
          await clearPowerPointDocument();
          await insertIntoPowerPoint(documentContent);
          break;
        default:
          // Word or Unknown
          await clearWordDocument();
          await insertIntoWord(documentContent);
          break;
      }

      docLogger.info(`Successfully opened document: ${documentId}`, {
        fileName: documentContent.fileName,
        host,
      });
    } catch (error) {
      docLogger.error(`Failed to open document: ${documentId}`, error as Error);
      throw error;
    }
  }

  static async clearDocument(): Promise<void> {
    const host = OfficeHostService.getHost();
    docLogger.info(`Clearing ${host} document content`);

    try {
      switch (host) {
        case 'Excel':
          await clearExcelDocument();
          break;
        case 'PowerPoint':
          await clearPowerPointDocument();
          break;
        default:
          // Word or Unknown
          await clearWordDocument();
          break;
      }
    } catch (error) {
      docLogger.error(`Failed to clear ${host} document`, error as Error);
    }
  }

  static async closeDocument(documentId: string): Promise<void> {
    docLogger.info(`Closing document: ${documentId}`);
    await DocumentService.clearDocument();
  }
}
