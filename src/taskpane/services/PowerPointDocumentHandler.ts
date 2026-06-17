/**
 * PowerPointDocumentHandler
 *
 * Handles all PowerPoint-specific document operations: inserting content into
 * and clearing the active PowerPoint presentation via the PowerPoint JavaScript
 * API and the Office Common API.
 *
 * - Plain-text / demo content is inserted as a text box on a blank slide.
 *   A DocuID logo is added above the text when available.
 * - Real PPTX binaries are inserted via PowerPoint.run insertSlidesFromBase64,
 *   with a Common API fallback for older hosts.
 */

/* global PowerPoint, Office */

import { arrayBufferToBase64 } from '../common/utils';
import type { DocumentContent, IDocumentHandler } from './IDocumentHandler';
import { logger } from './Logger';

const pptLogger = logger.createContextLogger('PowerPointDocumentHandler');

/**
 * Remove every shape from a slide so it is completely blank (no placeholders).
 * Must be called inside a PowerPoint.run context after shapes are loaded.
 */
async function clearSlideShapes(
  slide: PowerPoint.Slide,
  context: PowerPoint.RequestContext
): Promise<void> {
  const shapes = slide.shapes;
  shapes.load('items');
  await context.sync();

  for (const shape of shapes.items) {
    shape.delete();
  }
  await context.sync();
}

/**
 * Fetch the DocuID logo from the add-in server and return it as a base64 string.
 * Returns null if the fetch fails (e.g. offline, asset not found).
 */
async function fetchLogoBase64(): Promise<string | null> {
  try {
    const logoUrl = `${window.location.origin}/assets/logo-transparent-bg.png`;
    const response = await fetch(logoUrl);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return arrayBufferToBase64(arrayBuffer);
  } catch {
    return null;
  }
}

export const PowerPointDocumentHandler: IDocumentHandler = {
  /**
   * Insert document content into the active PowerPoint presentation.
   *
   * For plain-text / demo content:
   *   - Clears all shapes from the first slide (removes placeholders).
   *   - Embeds the DocuID logo at the top of the slide (if available).
   *   - Adds a text box below the logo with the document content.
   *
   * For binary PPTX files:
   *   - Uses PowerPoint.run insertSlidesFromBase64 (modern API).
   *   - Falls back to setSelectedDataAsync with SlideRange coercion (older hosts).
   */
  async insert(documentContent: DocumentContent): Promise<void> {
    try {
      if (!documentContent.binaryContent) {
        throw new Error('No binary content available for insertion');
      }

      const arrayBuffer = await documentContent.binaryContent.arrayBuffer();
      const textDecoder = new TextDecoder();
      const textContent = textDecoder.decode(arrayBuffer);

      const isTextContent =
        documentContent.contentType === 'text/plain' ||
        textContent.includes('demo document generated');

      if (isTextContent) {
        pptLogger.debug('Inserting plain text content as a text box on a blank slide');

        // Fetch the logo before entering PowerPoint.run (async fetch not allowed inside)
        const logoBase64 = await fetchLogoBase64();

        if (typeof PowerPoint !== 'undefined' && PowerPoint.run) {
          await PowerPoint.run(async (context) => {
            const slides = context.presentation.slides;
            slides.load('items');
            await context.sync();

            // Ensure at least one slide exists
            if (slides.items.length === 0) {
              slides.add();
              await context.sync();
              slides.load('items');
              await context.sync();
            }

            const slide = slides.items[0];

            // Strip all shapes (title/subtitle placeholders) so the slide is blank
            await clearSlideShapes(slide, context);

            // Add the DocuID logo at the top-left of the slide
            let textTop = 30;
            if (logoBase64) {
              try {
                const logoShape = (
                  slide.shapes as unknown as {
                    addPicture: (base64: string) => {
                      left: number;
                      top: number;
                      width: number;
                      height: number;
                    };
                  }
                ).addPicture(logoBase64);
                // Position: top-left, reasonable size
                logoShape.left = 30;
                logoShape.top = 20;
                logoShape.width = 150;
                logoShape.height = 50;
                await context.sync();
                // Push text down to sit below the logo with a small gap
                textTop = 85;
              } catch {
                pptLogger.info('Logo shape insertion not supported on this host version');
              }
            }

            // Add the text box below the logo (standard slide is ~720 pt wide, 540 pt tall)
            slide.shapes.addTextBox(textContent, {
              left: 30,
              top: textTop,
              width: 660,
              height: 540 - textTop - 20,
            });

            await context.sync();
          });
        } else {
          // Common API fallback for older hosts that do not support PowerPoint.run
          await Office.context.document.setSelectedDataAsync(textContent, {
            coercionType: Office.CoercionType.Text,
          });
        }
      } else {
        // Binary PPTX: insert slides from base64
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
            coercionType: (Office.CoercionType as unknown as Record<string, number>).SlideRange,
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
   * Clear the active PowerPoint presentation by removing all shapes from every
   * slide, then leaving only a single blank slide with no placeholders.
   *
   * Strategy:
   *   1. Keep slide[0] and delete all others (avoids an empty-presentation error).
   *   2. Strip every shape off slide[0] so it has no placeholders.
   *
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

      if (slides.items.length === 0) {
        return;
      }

      // Delete all slides after the first one (back-to-front to avoid index shift)
      for (let i = slides.items.length - 1; i > 0; i--) {
        slides.items[i].delete();
      }
      await context.sync();

      // Strip all shapes (title/subtitle placeholders) off the remaining slide
      await clearSlideShapes(slides.items[0], context);
    });
  },
};
