import React, { useState } from "react";
import { TextField, Spinner, DefaultButton, Stack } from "@fluentui/react";
import {
  FileText,
  Search,
  Folder,
  File,
  FileSpreadsheet,
  Presentation,
} from "lucide-react";
import ShareSidebar from "./ShareSidebar";

interface Document {
  id: string;
  title: string;
  type: string;
  dateModified: string;
  size: string;
}

interface ShareData {
  documentId: string;
  email?: string;
  mobile?: string;
  message?: string;
}

interface DocumentListProps {
  documents: Document[];
  onDocumentOpen: (document: Document) => Promise<void>;
  onDocumentShare?: (shareData: ShareData) => Promise<void>;
  isLoading: boolean;
}

const DocumentList: React.FC<DocumentListProps> = ({ 
  documents, 
  onDocumentOpen, 
  onDocumentShare,
  isLoading 
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isShareSidebarOpen, setIsShareSidebarOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
        return <FileText size={24} style={{ color: '#d13438' }} />;
      case "docx":
      case "doc":
        return <File size={24} style={{ color: '#2b579a' }} />;
      case "xlsx":
      case "xls":
        return <FileSpreadsheet size={24} style={{ color: '#217346' }} />;
      case "pptx":
      case "ppt":
        return <Presentation size={24} style={{ color: '#d24726' }} />;
      default:
        return <File size={24} style={{ color: '#605e5c' }} />;
    }
  };

  if (isLoading) {
    return (
      <div className="documents-loading">
        <Spinner size={3} label="Loading your documents..." />
      </div>
    );
  }

  return (
    <div className="documents-container">
      <div className="documents-header">
        <h2>Your Documents</h2>
        <div className="search-container">
          <Search size={16} className="search-icon" />
          <TextField
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(_, v) => setSearchTerm(v || "")}
            styles={{ 
              root: { width: 220 },
              field: { paddingLeft: 36 }
            }}
            borderless
            underlined
          />
        </div>
      </div>
      
      {filteredDocuments.length === 0 ? (
        <div className="no-documents">
          {documents.length === 0 ? (
            <>
              <Folder size={48} className="no-docs-icon" />
              <h3>No Documents Available</h3>
              <p>You don't have any documents available at the moment.</p>
            </>
          ) : (
            <>
              <Search size={48} className="no-docs-icon" />
              <h3>No Documents Found</h3>
              <p>No documents match your search criteria.</p>
            </>
          )}
        </div>
      ) : (
        <div className="documents-list">
          {filteredDocuments.map((document) => (
            <div key={document.id} className="document-item">
              <div className="document-icon">
                {getFileIcon(document.type)}
              </div>
              <div className="document-info">
                <h3 className="document-title">{document.title}</h3>
                <div className="document-meta">
                  <span className="document-type">{document.type.toUpperCase()}</span>
                  <span className="document-separator">•</span>
                  <span>{document.size}</span>
                  <span className="document-separator">•</span>
                  <span>{document.dateModified}</span>
                </div>
              </div>
              <div className="document-actions">
                <button 
                  className="document-open-btn"
                  onClick={() => onDocumentOpen(document)}
                  disabled={isLoading}
                >
                  Open
                </button>
                <button 
                  className="document-share-btn"
                  onClick={() => {
                    setSelectedDocument(document);
                    setIsShareSidebarOpen(true);
                  }}
                  disabled={isLoading}
                >
                  Share
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <ShareSidebar
        isOpen={isShareSidebarOpen}
        onDismiss={() => {
          setIsShareSidebarOpen(false);
          setSelectedDocument(null);
        }}
        document={selectedDocument}
        onShare={async (shareData) => {
          if (onDocumentShare) {
            await onDocumentShare(shareData);
          } else {
            // Default implementation - you can customize this
            console.log('Sharing document:', shareData);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }}
      />
    </div>
  );
};

export default DocumentList;
