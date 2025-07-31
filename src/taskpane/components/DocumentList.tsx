import React, { useState } from "react";
import { TextField, Spinner, DefaultButton, Stack } from "@fluentui/react";
import {
  FileText,
  Search,
  Folder,
  File,
  FileSpreadsheet,
  Presentation,
  Loader2,
  Database,
  Shield,
  CheckCircle,
} from "lucide-react";
import ShareSidebar from "./ShareSidebar";
import "./DocumentList.css";

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
  onCloseDocument?: (documentId: string) => Promise<void>;
  isLoading: boolean;
}

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onDocumentOpen,
  onDocumentShare,
  onCloseDocument,
  isLoading,
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
        return (
          <img
            src="assets/pdf.png"
            alt="PDF"
            style={{ marginTop: "10px", width: "40px", height: "40px", objectFit: "contain" }}
          />
        );
      case "docx":
      case "doc":
        return (
          <img
            src="assets/docx.png"
            alt="Word Document"
            style={{ marginTop: "10px", width: "40px", height: "40px", objectFit: "contain" }}
          />
        );
      case "xlsx":
      case "xls":
        return <FileSpreadsheet size={24} style={{ color: "#217346" }} />;
      case "pptx":
      case "ppt":
        return <Presentation size={24} style={{ color: "#d24726" }} />;
      default:
        return <File size={24} style={{ color: "#605e5c" }} />;
    }
  };

  // Skeleton loading component
  const DocumentSkeleton = () => (
    <div className="document-skeleton">
      <div className="skeleton-icon"></div>
      <div className="skeleton-content">
        <div className="skeleton-title"></div>
        <div className="skeleton-meta">
          <div className="skeleton-badge"></div>
          <div className="skeleton-text"></div>
          <div className="skeleton-text"></div>
        </div>
      </div>
      <div className="skeleton-actions">
        <div className="skeleton-button"></div>
        <div className="skeleton-button"></div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="documents-loading-container">
        {/* Loading Header */}
        <div className="loading-header">
          <div className="loading-title">
            <Database size={20} className="loading-icon" />
            <h2>Loading Your Documents</h2>
          </div>
          <div className="loading-subtitle">Securely fetching your documents from DocuID</div>
        </div>

        {/* Progress Indicator */}
        <div className="loading-progress">
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
          <div className="progress-steps">
            <div className="progress-step completed">
              <CheckCircle size={16} />
              <span>Authentication Verified</span>
            </div>
            <div className="progress-step active">
              <Loader2 size={16} className="spinning" />
              <span>Fetching Documents</span>
            </div>
            <div className="progress-step">
              <Shield size={16} />
              <span>Security Check</span>
            </div>
          </div>
        </div>

        {/* Skeleton Loading */}
        <div className="documents-container loading">
          <div className="documents-header">
            <h2>Your Documents</h2>
            <div className="search-container">
              <Search size={16} className="search-icon" />
              <div className="skeleton-search"></div>
            </div>
          </div>

          <div className="documents-list">
            {[1, 2, 3, 4, 5].map((index) => (
              <DocumentSkeleton key={index} />
            ))}
          </div>
        </div>

        {/* Loading Tips */}
        <div className="loading-tips">
          <div className="tip-item">
            <Shield size={16} />
            <span>Your documents are encrypted and secure</span>
          </div>
          <div className="tip-item">
            <FileText size={16} />
            <span>All file types are supported</span>
          </div>
          <div className="tip-item">
            <Search size={16} />
            <span>You can search and filter documents</span>
          </div>
        </div>
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
              field: { paddingLeft: 36 },
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
              <div className="document-icon">{getFileIcon(document.type)}</div>
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
            console.log("Sharing document:", shareData);
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }}
        onCloseDocument={onCloseDocument}
      />
    </div>
  );
};

export default DocumentList;
