/**
 * IDocumentHandler
 *
 * Shared interface implemented by each Office-host-specific document handler
 * (Word, Excel, PowerPoint). Keeps the DocumentService orchestrator decoupled
 * from host-specific Office API details.
 */

export interface DocumentContent {
  id: string;
  content: string;
  contentType: string;
  fileName: string;
  documentType?: string;
  binaryContent?: Blob;
}

export interface IDocumentHandler {
  /**
   * Insert the given document content into the active host application.
   */
  insert(content: DocumentContent): Promise<void>;

  /**
   * Clear the active document's content in the host application.
   */
  clear(): Promise<void>;
}
