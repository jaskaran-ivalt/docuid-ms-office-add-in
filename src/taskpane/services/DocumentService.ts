import axios from "axios";
import { AuthService } from "./AuthService";

/* global Word, Office */

interface Document {
  id: string;
  title: string;
  type: string;
  dateModified: string;
  size: string;
}

interface DocumentContent {
  id: string;
  content: string;
  contentType: string;
  fileName: string;
}

export class DocumentService {
  private static readonly API_BASE_URL = "https://api.docuid.net"; // Replace with actual API URL

  /**
   * Get user's documents from the API
   */
  static async getDocuments(): Promise<Document[]> {
    try {
      // For development, return mock data
      return this.getMockDocuments();

      // Production implementation:
      /*
      const sessionToken = AuthService.getSessionToken();
      if (!sessionToken) {
        throw new Error('Not authenticated');
      }

      const response = await axios.get(`${this.API_BASE_URL}/api/documents`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.documents;
      */
    } catch (error) {
      throw new Error("Failed to fetch documents");
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
            title: "Budget Analysis.xlsx",
            type: "xlsx",
            dateModified: "2024-01-08",
            size: "945 KB",
          },
          {
            id: "4",
            title: "Presentation Slides.pptx",
            type: "pptx",
            dateModified: "2024-01-05",
            size: "5.2 MB",
          },
          {
            id: "5",
            title: "Contract Agreement.pdf",
            type: "pdf",
            dateModified: "2024-01-03",
            size: "1.2 MB",
          },
        ]);
      }, 1000);
    });
  }

  /**
   * Open a document in Word
   */
  static async openDocument(documentId: string): Promise<void> {
    try {
      // Get document content
      const documentContent = await this.getDocumentContent(documentId);

      // Insert into Word using Office.js
      await this.insertIntoWord(documentContent);
    } catch (error) {
      throw new Error("Failed to open document in Word");
    }
  }

  /**
   * Get document content from API
   */
  private static async getDocumentContent(documentId: string): Promise<DocumentContent> {
    // For development, return mock content
    return this.getMockDocumentContent(documentId);

    // Production implementation:
    /*
    const sessionToken = AuthService.getSessionToken();
    if (!sessionToken) {
      throw new Error('Not authenticated');
    }

    const response = await axios.get(`${this.API_BASE_URL}/api/documents/${documentId}`, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
    */
  }

  /**
   * Mock document content for development
   */
  private static async getMockDocumentContent(documentId: string): Promise<DocumentContent> {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mockContent = {
      "1": "This is the content of Annual Report 2024. It contains financial data and business insights.",
      "2": "Project Proposal Document\n\nExecutive Summary:\nThis project aims to improve our document management system...",
      "3": "Budget Analysis data would be inserted here as a table.",
      "4": "Presentation content would be formatted for Word document.",
      "5": "Contract Agreement\n\nParty A: Company Name\nParty B: Client Name\n\nTerms and Conditions...",
    };

    return {
      id: documentId,
      content:
        mockContent[documentId as keyof typeof mockContent] || "Document content not available.",
      contentType: "text/plain",
      fileName: `document_${documentId}.txt`,
    };
  }

  /**
   * Insert document content into Word
   */
  private static async insertIntoWord(documentContent: DocumentContent): Promise<void> {
    return Word.run(async (context) => {
      // Clear existing content (optional)
      // context.document.body.clear();

      // Insert document title
      const titleParagraph = context.document.body.insertParagraph(
        `Document: ${documentContent.fileName}`,
        Word.InsertLocation.start
      );
      titleParagraph.styleBuiltIn = Word.BuiltInStyleName.title;

      // Insert separator
      context.document.body.insertParagraph("", Word.InsertLocation.end);

      // Insert document content
      const contentParagraph = context.document.body.insertParagraph(
        documentContent.content,
        Word.InsertLocation.end
      );
      contentParagraph.styleBuiltIn = Word.BuiltInStyleName.normal;

      // Insert timestamp
      const timestampParagraph = context.document.body.insertParagraph(
        `\n---\nInserted via DocuID on ${new Date().toLocaleString()}`,
        Word.InsertLocation.end
      );
      timestampParagraph.font.size = 10;
      timestampParagraph.font.color = "#666666";

      await context.sync();
    });
  }

  /**
   * Download document (for future implementation)
   */
  static async downloadDocument(documentId: string): Promise<Blob> {
    const sessionToken = AuthService.getSessionToken();
    if (!sessionToken) {
      throw new Error("Not authenticated");
    }

    const response = await axios.get(`${this.API_BASE_URL}/api/documents/${documentId}/download`, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
      responseType: "blob",
    });

    return response.data;
  }
}
