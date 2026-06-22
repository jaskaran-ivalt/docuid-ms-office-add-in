/**
 * WordDocumentHandler
 *
 * Handles all Word-specific document operations: inserting content into and
 * clearing the active Word document via the Word JavaScript API.
 */

/* global Word */

import { arrayBufferToBase64 } from '../common/utils';
import type { DocumentContent, IDocumentHandler } from './IDocumentHandler';
import { logger } from './Logger';

const wordLogger = logger.createContextLogger('WordDocumentHandler');

/**
 * Check if Word API is available (requires Office host environment)
 */
function isWordApiAvailable(): boolean {
  return typeof Word !== 'undefined' && typeof Word.run === 'function';
}

export const WordDocumentHandler: IDocumentHandler = {
  /**
   * Insert document content into the active Word document.
   * - Plain-text / demo content is inserted line-by-line as paragraphs.
   * - Binary .docx content is inserted via insertFileFromBase64.
   *
   * Gracefully returns in browser mode (no Office host available).
   */
  async insert(documentContent: DocumentContent): Promise<void> {
    if (!isWordApiAvailable()) {
      wordLogger.info(
        'Word.run not available - running in browser mode without Office integration'
      );
      return;
    }

    return Word.run(async (context) => {
      try {
        if (!documentContent.binaryContent) {
          throw new Error('No binary content available for insertion');
        }

        wordLogger.debug('Clearing existing document content');
        context.document.body.clear();
        // Also clear headers/footers to be thorough
        context.document.sections.load('items');
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
          documentContent.contentType === 'text/plain' ||
          textContent.includes('demo document generated')
        ) {
          wordLogger.debug('Inserting demo text content as paragraphs');
          const lines = textContent.split('\n');
          lines.forEach((line, index) => {
            const insertLocation =
              index === 0 ? Word.InsertLocation.start : Word.InsertLocation.end;
            context.document.body.insertParagraph(line, insertLocation);
          });
        } else {
          const base64String = arrayBufferToBase64(arrayBuffer);
          wordLogger.debug('Inserting file into Word');
          context.document.body.insertFileFromBase64(base64String, Word.InsertLocation.start);
        }

        await context.sync();
        wordLogger.logOfficeOperation('Document insertion (Word)', true);
      } catch (error) {
        wordLogger.logOfficeOperation('Document insertion (Word)', false, error);
        throw error;
      }
    });
  },

  /**
   * Clear the active Word document body, headers, and footers.
   * Gracefully returns in browser mode (no Office host available).
   */
  async clear(): Promise<void> {
    if (!isWordApiAvailable()) {
      wordLogger.info('Word.run not available for clearing document - running in browser mode');
      return;
    }

    return Word.run(async (context) => {
      context.document.body.clear();
      await context.sync();
    });
  },
};
