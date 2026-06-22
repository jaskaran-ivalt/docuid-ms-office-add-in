import { arrayBufferToBase64 } from '../../common/utils';
import { logger } from '../Logger';
import type { DocumentContent } from './types';

const log = logger.createContextLogger('PowerPointService');

export async function insertIntoPowerPoint(documentContent: DocumentContent): Promise<void> {
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
      log.debug('Inserting demo PowerPoint slides with welcome info');

      if (typeof PowerPoint !== 'undefined' && PowerPoint.run) {
        await PowerPoint.run(async (context) => {
          const slides = context.presentation.slides;
          slides.load('items');
          await context.sync();

          for (let i = slides.items.length - 1; i >= 0; i--) {
            slides.items[i].delete();
          }

          const slide1 = context.presentation.slides.add();
          const titleShape = slide1.shapes.addTextBox('Welcome to iVALT DocuID', {
            left: 50, top: 50, width: 600, height: 70,
          });
          titleShape.textRange.font.size = 40;
          titleShape.textRange.font.bold = true;

          slide1.shapes.addTextBox(
            'Biometric-Secured Document Management\nfor Microsoft Office',
            { left: 50, top: 130, width: 600, height: 60 },
          ).textRange.font.size = 20;

          slide1.shapes.addTextBox(
            'Access, manage, and share your documents securely with\none-tap biometric authentication via the iVALT mobile app.',
            { left: 50, top: 210, width: 600, height: 50 },
          ).textRange.font.size = 15;

          const footerShape = slide1.shapes.addTextBox('iVALT DocuID', {
            left: 50, top: 290, width: 600, height: 30,
          });
          footerShape.textRange.font.size = 12;
          footerShape.textRange.font.color = '#888888';

          const slide2 = context.presentation.slides.add();
          const featTitle = slide2.shapes.addTextBox('Key Features', {
            left: 50, top: 30, width: 600, height: 60,
          });
          featTitle.textRange.font.size = 32;
          featTitle.textRange.font.bold = true;

          slide2.shapes.addTextBox(
            '  Biometric document access with one-tap login\n' +
            '  Secure sharing with full audit trail\n' +
            '  Works across Word, Excel, and PowerPoint\n' +
            '  Real-time document activity tracking\n' +
            '  End-to-end encrypted file storage',
            { left: 50, top: 110, width: 600, height: 200 },
          ).textRange.font.size = 18;

          const slide3 = context.presentation.slides.add();
          const howTitle = slide3.shapes.addTextBox('How It Works', {
            left: 50, top: 30, width: 600, height: 60,
          });
          howTitle.textRange.font.size = 32;
          howTitle.textRange.font.bold = true;

          slide3.shapes.addTextBox(
            '1. Login with your registered mobile number\n' +
            '2. Approve the biometric request on the iVALT app\n' +
            '3. Browse and open documents from the task pane\n' +
            '4. Share documents securely with colleagues',
            { left: 50, top: 110, width: 600, height: 180 },
          ).textRange.font.size = 18;

          await context.sync();
        });
      }
    } else {
      // For real pptx files use insertSlidesFromBase64 (if available)
      log.debug('Inserting base64 PPTX content into PowerPoint');
      const base64String = arrayBufferToBase64(arrayBuffer);
      if (typeof PowerPoint !== 'undefined' && PowerPoint.run) {
        await PowerPoint.run(async (context) => {
          context.presentation.insertSlidesFromBase64(base64String);
          await context.sync();
        });
      } else {
        throw new Error('PowerPoint.run API required for document insertion');
      }
    }

    log.logOfficeOperation('Document insertion (PowerPoint)', true);
  } catch (error) {
    log.logOfficeOperation('Document insertion (PowerPoint)', false, error);
    throw error;
  }
}

export async function clearPowerPointDocument(): Promise<void> {
  if (typeof PowerPoint !== 'undefined' && PowerPoint.run) {
    try {
      await PowerPoint.run(async (context) => {
        const slides = context.presentation.slides;
        slides.load('items');
        await context.sync();

        if (slides.items.length > 0) {
          for (let i = slides.items.length - 1; i >= 0; i--) {
            slides.items[i].delete();
          }
          context.presentation.slides.add();
        }
        await context.sync();
      });
    } catch (_e) {
      log.info('PowerPoint.run error while clearing slides (non-fatal)');
    }
  } else {
    log.info('PowerPoint.run not available for clearing slides');
  }
}
