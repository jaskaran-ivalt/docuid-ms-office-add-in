/**
 * ExcelDocumentHandler
 *
 * Handles all Excel-specific document operations: inserting content into and
 * clearing the active Excel worksheet via the Excel JavaScript API.
 *
 * CSV / plain-text content is parsed and written cell-by-cell starting at A1.
 * Real XLSX binaries write a placeholder note (Excel.run cannot insert a binary
 * workbook the same way Word can insertFileFromBase64).
 */

/* global Excel */

import type { DocumentContent, IDocumentHandler } from './IDocumentHandler';
import { logger } from './Logger';

const excelLogger = logger.createContextLogger('ExcelDocumentHandler');

/**
 * Check if Excel API is available (requires Office host environment)
 */
function isExcelApiAvailable(): boolean {
  return typeof Excel !== 'undefined' && typeof Excel.run === 'function';
}

export const ExcelDocumentHandler: IDocumentHandler = {
  /**
   * Insert document content into the active Excel worksheet.
   * - Plain-text / CSV content is parsed into a 2-D values array.
   * - Binary XLSX content writes a placeholder message at A1.
   *
   * Gracefully returns in browser mode (no Office host available).
   */
  async insert(documentContent: DocumentContent): Promise<void> {
    if (!isExcelApiAvailable()) {
      excelLogger.info(
        'Excel.run not available - running in browser mode without Office integration'
      );
      return;
    }

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
          excelLogger.debug('Inserting plain text / CSV content into Excel');

          // Parse every non-empty line into cells by splitting on comma.
          const rawRows = textContent
            .split('\n')
            .filter((line) => line.trim().length > 0)
            .map((line) => line.split(',').map((cell) => cell.trim()));

          if (rawRows.length > 0) {
            // All rows must have the same column count for range.values to work.
            // Pad shorter rows with empty strings so they match the widest row.
            const maxCols = Math.max(...rawRows.map((r) => r.length));
            const rows: string[][] = rawRows.map((r) => {
              const padded = [...r];
              while (padded.length < maxCols) {
                padded.push('');
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
          excelLogger.debug('Non-text content: writing placeholder for real XLSX');
          sheet.getRange('A1').values = [
            [`File: ${documentContent.fileName} - open directly for full fidelity.`],
          ];
          await context.sync();
        }

        excelLogger.logOfficeOperation('Document insertion (Excel)', true);
      } catch (error) {
        excelLogger.logOfficeOperation('Document insertion (Excel)', false, error);
        throw error;
      }
    });
  },

  /**
   * Clear the used range of the active Excel worksheet.
   * Gracefully returns in browser mode (no Office host available).
   */
  async clear(): Promise<void> {
    if (!isExcelApiAvailable()) {
      excelLogger.info('Excel.run not available for clearing sheet - running in browser mode');
      return;
    }

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
  },
};
