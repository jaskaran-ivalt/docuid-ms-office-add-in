import { arrayBufferToBase64 } from '../../common/utils';
import { logger } from '../Logger';
import type { DocumentContent } from './types';

const log = logger.createContextLogger('WordService');

export async function insertIntoWord(documentContent: DocumentContent): Promise<void> {
  return Word.run(async (context) => {
    try {
      if (!documentContent.binaryContent) {
        throw new Error('No binary content available for insertion');
      }

      log.debug('Clearing existing document content');
      context.document.body.clear();

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
        log.debug('Inserting demo text content as paragraphs');
        const lines = textContent.split('\n');
        lines.forEach((line, index) => {
          const insertLocation =
            index === 0 ? Word.InsertLocation.start : Word.InsertLocation.end;
          context.document.body.insertParagraph(line, insertLocation);
        });
      } else {
        const base64String = arrayBufferToBase64(arrayBuffer);
        log.debug('Inserting file into Word');
        context.document.body.insertFileFromBase64(base64String, Word.InsertLocation.start);
      }

      await context.sync();
      log.logOfficeOperation('Document insertion (Word)', true);
    } catch (error) {
      log.logOfficeOperation('Document insertion (Word)', false, error);
      throw error;
    }
  });
}

export async function clearWordDocument(): Promise<void> {
  return Word.run(async (context) => {
    context.document.body.clear();
    await context.sync();
  });
}
