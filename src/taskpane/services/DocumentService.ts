import { DocuIdApiService, DocuIdDocument } from "./DocuIdApiService";
import { logger } from "./Logger";

/* global Word, Office */

interface Document {
  id: string;
  title: string;
  type: string;
  dateModified: string;
  size: string;
  // Extended fields from DocuID API
  documentId?: number;
  isPasswordProtected?: boolean;
  isEncrypted?: boolean;
  description?: string | null;
}

interface DocumentContent {
  id: string;
  content: string;
  contentType: string;
  fileName: string;
  documentType?: string;
  binaryContent?: Blob;
}

export class DocumentService {
  // Use proxy in development, direct API in production
  private static readonly API_BASE_URL = process.env.NODE_ENV === 'development'
    ? '' // Use relative URLs for webpack proxy
    : "https://api.docuid.net";

  // Flag to use mock data during development when API is unavailable
  private static readonly USE_MOCK_DATA = false;

  /**
   * Format file size for display
   */
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Extract file extension from filename
   */
  private static getFileExtension(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    return ext;
  }

  /**
   * Get user's Word documents from the DocuID API
   */
  static async getDocuments(): Promise<Document[]> {
    const docLogger = logger.createContextLogger('DocumentService');

    try {
      // Use mock data if flag is set
      if (this.USE_MOCK_DATA) {
        docLogger.debug('Using mock documents');
        return this.getMockDocuments();
      }

      docLogger.info('Fetching Word documents from DocuID API');

      const apiDocs = await DocuIdApiService.getWordDocuments();

      // Transform API response to Document interface
      const documents: Document[] = apiDocs.map((doc: DocuIdDocument) => ({
        id: doc.documentId.toString(),
        title: doc.fileName,
        type: this.getFileExtension(doc.fileName),
        dateModified: new Date(doc.updatedAt).toLocaleDateString(),
        size: this.formatFileSize(doc.fileSize),
        documentId: doc.documentId,
        isPasswordProtected: doc.isPasswordProtected,
        description: doc.description,
      }));

      docLogger.info('Documents fetched successfully', { count: documents.length });
      return documents;
    } catch (error) {
      const docLogger = logger.createContextLogger('DocumentService');
      docLogger.error('Failed to fetch documents', error as Error);
      
      // Only fallback to mock data if USE_MOCK_DATA flag is set
      if (this.USE_MOCK_DATA) {
        docLogger.warn('Falling back to mock documents');
        return this.getMockDocuments();
      }
      
      // Otherwise, throw the error
      throw error;
    }
  }

  /**
   * Mock documents for development
   */
  private static getMockDocuments(): Promise<Document[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: "1",
            title: "Annual Report 2024.pdf",
            type: "pdf",
            dateModified: "2024-01-15",
            size: "2.3 MB",
          },
          {
            id: "2",
            title: "Project Proposal.docx",
            type: "docx",
            dateModified: "2024-01-10",
            size: "1.8 MB",
          },
          {
            id: "3",
            title: "Contract Agreement.pdf",
            type: "pdf",
            dateModified: "2024-01-10",
            size: "1.2 MB",
          },
        ]);
      }, 10000);
    });
  }

  /**
   * Open a document in Word
   */
  static async openDocument(documentId: string): Promise<void> {
    const docLogger = logger.createContextLogger('DocumentService');

    try {
      docLogger.info(`Opening document: ${documentId}`);

      // Get document content
      docLogger.debug(`Fetching content for document: ${documentId}`);
      const documentContent = await this.getDocumentContent(documentId);

      // Insert into Word using Office.js
      docLogger.debug(`Inserting document into Word: ${documentContent.fileName}`);
      await this.insertIntoWord(documentContent);

      docLogger.info(`Successfully opened document: ${documentId}`, {
        fileName: documentContent.fileName,
        contentType: documentContent.contentType
      });
    } catch (error) {
      docLogger.error(`Failed to open document: ${documentId}`, error instanceof Error ? error : new Error(String(error)));
      throw new Error("Failed to open document in Word");
    }
  }

  /**
   * Close a document
   */
  static async closeDocument(documentId: string): Promise<void> {
    const docLogger = logger.createContextLogger('DocumentService');

    try {
      docLogger.info(`Closing document: ${documentId}`);

      // Simulate API call to close document
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In a real implementation, you would call the API to close the document
      docLogger.info(`Document closed successfully: ${documentId}`);
    } catch (error) {
      docLogger.error(`Failed to close document: ${documentId}`, error instanceof Error ? error : new Error(String(error)));
      throw new Error("Failed to close document");
    }
  }

  /**
   * Get document content from API
   */
  private static async getDocumentContent(documentId: string): Promise<DocumentContent> {
    const docLogger = logger.createContextLogger('DocumentService');

    // Use mock data if flag is set
    if (this.USE_MOCK_DATA) {
      return this.getMockDocumentContent(documentId);
    }

    try {
      const docId = parseInt(documentId);
      if (isNaN(docId)) {
        throw new Error('Invalid document ID');
      }

      docLogger.info('Fetching document access info', { documentId });

      // Get document access information
      const accessInfo = await DocuIdApiService.getDocumentAccess(docId);

      if (!accessInfo.access.url) {
        throw new Error('Document access URL not available');
      }

      docLogger.debug('Downloading document content', {
        documentId,
        url: accessInfo.access.url,
        fileType: accessInfo.fileType,
      });

      // Download the document content
      const blobContent = await DocuIdApiService.downloadDocumentContent(accessInfo.access.url);

      // For Word documents, we'll need to handle binary content differently
      // For now, return the basic info with binary content attached
      return {
        id: documentId,
        content: '', // Binary content is in binaryContent field
        contentType: accessInfo.fileType,
        fileName: accessInfo.fileName,
        documentType: this.getFileExtension(accessInfo.fileName),
        binaryContent: blobContent,
      };
    } catch (error) {
      docLogger.error('Failed to get document content', error as Error);

      // Only fallback to mock if USE_MOCK_DATA flag is set
      if (this.USE_MOCK_DATA) {
        docLogger.warn('Falling back to mock document content');
        return this.getMockDocumentContent(documentId);
      }

      // Otherwise, throw the error so the user knows what went wrong
      throw error;
    }
  }

  /**
   * Mock document content for development
   */
  private static async getMockDocumentContent(documentId: string): Promise<DocumentContent> {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mockContent = {
      "1": {
        title: "Annual Report 2024",
        content: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Executive Summary
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Financial Performance
Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

Key Highlights:
• Revenue increased by 15% year-over-year
• Market expansion into new territories
• Successful product launches
• Strong customer satisfaction scores

Future Outlook
Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.`,
        type: "report",
      },
      "2": {
        title: "Project Proposal",
        content: `Project Proposal: Document Management System Enhancement

Project Overview
Lorem ipsum dolor sit amet, consectetur adipiscing elit. This project aims to revolutionize our document management capabilities through innovative technology solutions.

Objectives
• Improve document accessibility and security
• Streamline workflow processes
• Enhance user experience
• Reduce operational costs

Scope of Work
Phase 1: System Analysis and Design
- Requirements gathering and analysis
- System architecture design
- User interface mockups
- Technical specifications

Phase 2: Development and Testing
- Core system development
- Integration with existing platforms
- Comprehensive testing protocols
- User acceptance testing

Phase 3: Deployment and Training
- System deployment
- User training programs
- Documentation creation
- Post-deployment support

Timeline: 6 months
Budget: $500,000
ROI: Expected 200% return within 2 years`,
        type: "proposal",
      },
      "3": {
        title: "Budget Analysis",
        content: `Budget Analysis Report

Revenue Streams
Q1 2024: $2,500,000
Q2 2024: $2,750,000
Q3 2024: $3,000,000
Q4 2024: $3,250,000

Expense Categories
• Personnel: 45% of total budget
• Technology: 25% of total budget
• Marketing: 15% of total budget
• Operations: 10% of total budget
• Miscellaneous: 5% of total budget

Key Metrics
• Gross Profit Margin: 65%
• Net Profit Margin: 28%
• Operating Expenses Ratio: 37%
• Revenue Growth Rate: 10% quarterly

Financial Projections
Based on current trends and market analysis, we project continued growth in all revenue streams with improved efficiency in operational costs.`,
        type: "financial",
      },
      "4": {
        title: "Presentation Slides",
        content: `Strategic Business Presentation

Slide 1: Executive Summary
Our company has achieved remarkable growth through strategic initiatives and market expansion. This presentation outlines our key achievements and future roadmap.

Slide 2: Market Position
• Market Leader in our segment
• 25% market share
• Strong brand recognition
• Competitive advantages

Slide 3: Financial Performance
• Revenue: $12M (15% YoY growth)
• Profit: $3.6M (28% margin)
• Cash Flow: Positive
• Debt: Minimal

Slide 4: Strategic Initiatives
1. Product Innovation
2. Market Expansion
3. Digital Transformation
4. Talent Development

Slide 5: Future Outlook
• 20% revenue growth target
• New market entry
• Technology investments
• Sustainability focus

Slide 6: Action Items
• Immediate: Q1 planning
• Short-term: Q2 execution
• Long-term: Annual strategy`,
        type: "presentation",
      },
      "5": {
        title: "Contract Agreement",
        content: `CONTRACT AGREEMENT

This agreement is made and entered into on this day of January 2024, by and between:

PARTY A: [Company Name]
Address: [Company Address]
Represented by: [Authorized Representative]

PARTY B: [Client Name]
Address: [Client Address]
Represented by: [Authorized Representative]

1. SCOPE OF WORK
Lorem ipsum dolor sit amet, consectetur adipiscing elit. The contractor shall provide professional services as outlined in the attached statement of work.

2. TERM AND TERMINATION
This agreement shall commence on the effective date and continue for a period of 12 months, unless terminated earlier in accordance with the terms herein.

3. COMPENSATION
The total compensation for services rendered shall be $50,000, payable in monthly installments of $4,167.

4. CONFIDENTIALITY
Both parties agree to maintain strict confidentiality regarding all proprietary information shared during the course of this agreement.

5. INTELLECTUAL PROPERTY
All intellectual property created during the performance of this agreement shall remain the property of Party A.

6. GOVERNING LAW
This agreement shall be governed by and construed in accordance with the laws of the applicable jurisdiction.

SIGNATURES:
Party A: _________________ Date: _________
Party B: _________________ Date: _________`,
        type: "legal",
      },
    };

    const content = mockContent[documentId as keyof typeof mockContent];
    return {
      id: documentId,
      content: content?.content || "Document content not available.",
      contentType: "text/plain",
      fileName: content?.title || `document_${documentId}.txt`,
      documentType: content?.type || "general",
    };
  }

  /**
   * Insert document content into Word
   */
  private static async insertIntoWord(documentContent: DocumentContent): Promise<void> {
    const officeLogger = logger.createContextLogger('DocumentService.Office');

    // Check if we have binary content (real Word document)
    if (documentContent.binaryContent) {
      return this.insertBinaryDocumentIntoWord(documentContent, officeLogger);
    }

    // Fall back to text-based insertion for mock content or plain text
    return this.insertTextDocumentIntoWord(documentContent, officeLogger);
  }

  /**
   * Insert binary Word document content using Office.js
   */
  private static async insertBinaryDocumentIntoWord(
    documentContent: DocumentContent,
    officeLogger: ReturnType<typeof logger.createContextLogger>
  ): Promise<void> {
    return Word.run(async (context) => {
      officeLogger.debug('Starting Word.run context for binary document insertion', {
        fileName: documentContent.fileName,
        contentType: documentContent.contentType,
      });

      try {
        // Convert blob to base64
        const arrayBuffer = await documentContent.binaryContent!.arrayBuffer();
        const base64String = this.arrayBufferToBase64(arrayBuffer);

        officeLogger.debug('Converted document to base64', {
          originalSize: arrayBuffer.byteLength,
          base64Length: base64String.length,
        });

        // Insert the file into Word
        // Using insertFileFromBase64 to insert the Word document content
        context.document.body.insertFileFromBase64(
          base64String,
          Word.InsertLocation.end
        );

        await context.sync();
        officeLogger.logOfficeOperation('Binary document insertion', true);
      } catch (error) {
        officeLogger.logOfficeOperation('Binary document insertion', false, error);
        
        // If binary insertion fails, try to fall back to text notification
        officeLogger.warn('Binary insertion failed, inserting notification instead');
        const errorParagraph = context.document.body.insertParagraph(
          `[DocuID] Document "${documentContent.fileName}" loaded. Binary insertion not supported for this document type.`,
          Word.InsertLocation.end
        );
        errorParagraph.font.color = "#666666";
        errorParagraph.font.italic = true;
        await context.sync();
      }
    }).catch((error) => {
      officeLogger.logOfficeOperation('Document insertion', false, error);
      throw error;
    });
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Insert text-based document content into Word (for mock data or plain text)
   */
  private static async insertTextDocumentIntoWord(
    documentContent: DocumentContent,
    officeLogger: ReturnType<typeof logger.createContextLogger>
  ): Promise<void> {
    return Word.run(async (context) => {
      officeLogger.debug('Starting Word.run context for text document insertion', {
        fileName: documentContent.fileName,
        contentLength: documentContent.content.length
      });
      // Clear existing content (optional)
      // context.document.body.clear();

      // Insert document title with proper formatting
      officeLogger.debug('Inserting document title');
      const titleParagraph = context.document.body.insertParagraph(
        documentContent.fileName,
        Word.InsertLocation.start
      );
      titleParagraph.styleBuiltIn = Word.BuiltInStyleName.title;
      titleParagraph.font.size = 24;
      titleParagraph.font.bold = true;
      titleParagraph.alignment = Word.Alignment.centered;

      // Insert separator
      context.document.body.insertParagraph("", Word.InsertLocation.end);

      // Format content based on document type
      const contentLines = documentContent.content.split("\n");
      let currentParagraph: Word.Paragraph;

      for (let i = 0; i < contentLines.length; i++) {
        const line = contentLines[i].trim();

        if (line === "") {
          // Empty line - add spacing
          context.document.body.insertParagraph("", Word.InsertLocation.end);
          continue;
        }

        // Check if line is a heading (all caps or contains specific patterns)
        const isHeading = this.isHeading(line, documentContent.documentType);

        currentParagraph = context.document.body.insertParagraph(line, Word.InsertLocation.end);

        if (isHeading) {
          // Format as heading
          currentParagraph.styleBuiltIn = Word.BuiltInStyleName.heading1;
          currentParagraph.font.size = 16;
          currentParagraph.font.bold = true;
          currentParagraph.font.color = "#2b579a";
        } else if (line.startsWith("•") || line.startsWith("-")) {
          // Format as bullet point
          currentParagraph.styleBuiltIn = Word.BuiltInStyleName.listParagraph;
          currentParagraph.font.size = 12;
        } else if (line.includes(":") && line.length < 50) {
          // Format as subheading
          currentParagraph.styleBuiltIn = Word.BuiltInStyleName.heading2;
          currentParagraph.font.size = 14;
          currentParagraph.font.bold = true;
          currentParagraph.font.color = "#404040";
        } else {
          // Regular paragraph
          currentParagraph.styleBuiltIn = Word.BuiltInStyleName.normal;
          currentParagraph.font.size = 12;
        }
      }

      // Insert footer with timestamp
      officeLogger.debug('Inserting document footer');
      context.document.body.insertParagraph("", Word.InsertLocation.end);
      const footerParagraph = context.document.body.insertParagraph(
        `---\nDocument inserted via DocuID on ${new Date().toLocaleString()}`,
        Word.InsertLocation.end
      );
      footerParagraph.font.size = 10;
      footerParagraph.font.color = "#666666";
      footerParagraph.alignment = Word.Alignment.centered;
      footerParagraph.styleBuiltIn = Word.BuiltInStyleName.footer;

      officeLogger.debug('Synchronizing Word context changes');
      await context.sync();
      officeLogger.logOfficeOperation('Text document insertion', true);
    }).catch((error) => {
      officeLogger.logOfficeOperation('Document insertion', false, error);
      throw error;
    });
  }

  /**
   * Determine if a line should be formatted as a heading
   */
  private static isHeading(line: string, documentType?: string): boolean {
    // Check for common heading patterns
    const headingPatterns = [
      /^[A-Z\s]+$/, // All caps
      /^(Executive Summary|Financial Performance|Key Highlights|Future Outlook|Project Overview|Objectives|Scope of Work|Timeline|Budget|ROI|Revenue Streams|Expense Categories|Key Metrics|Financial Projections|Slide \d+|PARTY [AB]|SIGNATURES?)$/i,
      /^[A-Z][a-z]+ [A-Z][a-z]+$/, // Title Case
    ];

    return headingPatterns.some((pattern) => pattern.test(line.trim()));
  }

  /**
   * Download document (for future implementation)
   */
  static async downloadDocument(documentId: string): Promise<Blob> {
    const docId = parseInt(documentId);
    if (isNaN(docId)) {
      throw new Error("Invalid document ID");
    }

    // Get document access info which includes the download URL
    const accessInfo = await DocuIdApiService.getDocumentAccess(docId);

    if (!accessInfo.access.url) {
      throw new Error("Document download URL not available");
    }

    // Download using the presigned URL
    return DocuIdApiService.downloadDocumentContent(accessInfo.access.url);
  }
}
