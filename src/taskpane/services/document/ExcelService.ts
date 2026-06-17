import { logger } from '../Logger';
import type { DocumentContent } from './types';

const log = logger.createContextLogger('ExcelService');

export async function insertIntoExcel(documentContent: DocumentContent): Promise<void> {
  return Excel.run(async (context) => {
    try {
      if (!documentContent.binaryContent) {
        throw new Error('No binary content available for insertion');
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
        documentContent.contentType === 'text/plain' ||
        documentContent.contentType === 'text/csv' ||
        textContent.includes('demo document generated')
      ) {
        log.debug('Inserting plain text / CSV content into Excel');

        const rawRows = textContent
          .split('\n')
          .filter((line) => line.trim().length > 0)
          .map((line) => line.split(',').map((cell) => cell.trim()));

        if (rawRows.length > 0) {
          const maxCols = Math.max(...rawRows.map((r) => r.length));
          const rows: string[][] = rawRows.map((r) => {
            const padded = [...r];
            while (padded.length < maxCols) {
              padded.push('');
            }
            return padded;
          });

          const range = sheet.getRangeByIndexes(0, 0, rows.length, maxCols);
          range.values = rows as unknown as (string | number | boolean)[][];
          await context.sync();
        }
      } else {
        log.debug('Non-text content: writing placeholder for real XLSX');
        sheet.getRange('A1').values = [
          [`File: ${documentContent.fileName} - open directly for full fidelity.`],
        ];
        await context.sync();
      }

      log.logOfficeOperation('Document insertion (Excel)', true);
    } catch (error) {
      log.logOfficeOperation('Document insertion (Excel)', false, error);
      throw error;
    }
  });
}

export async function clearExcelDocument(): Promise<void> {
  return Excel.run(async (context) => {
    try {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const usedRange = sheet.getUsedRange();
      usedRange.clear();
      await context.sync();
    } catch (_e) {
      // Sheet is likely empty
    }
  });
}
