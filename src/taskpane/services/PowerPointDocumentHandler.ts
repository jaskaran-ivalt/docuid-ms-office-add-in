/**
 * PowerPointDocumentHandler
 *
 * Handles all PowerPoint-specific document operations: inserting content into
 * and clearing the active PowerPoint presentation via the PowerPoint JavaScript
 * API and the Office Common API.
 *
 * - Plain-text / demo content is inserted via Office.CoercionType.Text.
 * - Real PPTX binaries are inserted via PowerPoint.run insertSlidesFromBase64,
 *   with a Common API fallback for older hosts.
 */

/* global PowerPoint, Office */

import { arrayBufferToBase64 } from '../common/utils';
import type { DocumentContent, IDocumentHandler } from './IDocumentHandler';
import { logger } from './Logger';

const pptLogger = logger.createContextLogger('PowerPointDocumentHandler');

export const PowerPointDocumentHandler: IDocumentHandler = {
  /**
   * Insert document content into the active PowerPoint presentation.
   * - Plain-text content uses setSelectedDataAsync with CoercionType.Text.
   * - Binary PPTX content uses PowerPoint.run insertSlidesFromBase64 (modern API)
   *   or falls back to setSelectedDataAsync with SlideRange coercion (older hosts).
   */
  async insert(documentContent: DocumentContent): Promise<void> {
    try {
      if (!documentContent.binaryContent) {
        throw new Error('No binary content available for insertion');
      }

      const arrayBuffer = await documentContent.binaryContent.arrayBuffer();
      const textDecoder = new TextDecoder();
      const textContent = textDecoder.decode(arrayBuffer);

      if (
        documentContent.contentType === 'text/plain' ||
        textContent.includes('demo document generated')
      ) {
        // Use the Office.js Common API to insert text onto the current slide
        pptLogger.debug('Inserting plain text content as PowerPoint slide');
        await Office.context.document.setSelectedDataAsync(textContent, {
          coercionType: Office.CoercionType.Text,
        });
      } else {
        // For real pptx files use insertSlidesFromBase64 (modern API) or fall back
        pptLogger.debug('Inserting base64 PPTX content into PowerPoint');
        const base64String = arrayBufferToBase64(arrayBuffer);

        if (typeof PowerPoint !== 'undefined' && PowerPoint.run) {
          await PowerPoint.run(async (context) => {
            context.presentation.insertSlidesFromBase64(base64String);
            await context.sync();
          });
        } else {
          // Common API fallback
          await Office.context.document.setSelectedDataAsync(base64String, {
            coercionType: (Office.CoercionType as any).SlideRange,
          });
        }
      }

      pptLogger.logOfficeOperation('Document insertion (PowerPoint)', true);
    } catch (error) {
      pptLogger.logOfficeOperation('Document insertion (PowerPoint)', false, error);
      throw error;
    }
  },

  /**
   * Clear the active PowerPoint presentation by deleting all existing slides
   * and adding one fresh blank slide.
   * Falls back silently when PowerPoint.run is not available.
   */
  async clear(): Promise<void> {
    if (typeof PowerPoint === 'undefined' || !PowerPoint.run) {
      pptLogger.info('PowerPoint.run not available for clearing slides');
      return;
    }

    return PowerPoint.run(async (context) => {
      const slides = context.presentation.slides;
      slides.load('items');
      await context.sync();

      // Delete all slides from last to first to avoid index-shifting issues,
      // then add a single blank slide so the presentation remains valid.
      if (slides.items.length > 0) {
        for (let i = slides.items.length - 1; i >= 0; i--) {
          slides.items[i].delete();
        }
        context.presentation.slides.add();
      }
      await context.sync();
    });
  },
};
