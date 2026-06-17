export interface DocumentContent {
  id: string;
  content: string;
  contentType: string;
  fileName: string;
  documentType?: string;
  binaryContent?: Blob;
}

export type OfficeHost = 'Word' | 'Excel' | 'PowerPoint' | 'Unknown';
