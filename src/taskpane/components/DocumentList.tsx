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
  Shield,
  RefreshCw,
} from "lucide-react";
import ShareSidebar from "./ShareSidebar";
import ShareSuccessModal from "./ShareSuccessModal";
import "./DocumentList.css";

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

interface ShareData {
  documentId: string;
  email?: string;
  mobile?: string;
  message?: string;
}

interface ShareResponse {
  shareLink?: string;
  shareId?: number;
  message?: string;
  recipientEmail?: string;
  recipientMobile?: string;
  customMessage?: string;
}

interface DocumentListProps {
  documents: Document[];
  onDocumentOpen: (document: Document) => Promise<void>;
  onDocumentShare?: (shareData: ShareData) => Promise<ShareResponse>;
  onCloseDocument?: (documentId: string) => Promise<void>;
  isLoadingDocuments: boolean;
  openingDocumentId: string | null;
  closingDocumentId: string | null;
  onReload?: () => Promise<void>;
}

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onDocumentOpen,
  onDocumentShare,
  onCloseDocument,
  isLoadingDocuments,
  openingDocumentId,
  closingDocumentId,
  onReload,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isShareSidebarOpen, setIsShareSidebarOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [shareResponse, setShareResponse] = useState<ShareResponse | null>(null);
  const [isReloading, setIsReloading] = useState(false);

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReload = async () => {
    if (!onReload || isReloading) return;
    setIsReloading(true);
    try {
      await onReload();
    } catch (error) {
      console.error("Failed to reload documents:", error);
    } finally {
      setIsReloading(false);
    }
  };

  const handleShareSuccess = (response: ShareResponse) => {
    setShareResponse(response);
    setIsSuccessModalOpen(true);
  };

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

  if (isLoadingDocuments) {
    return (
      <div className="documents-container">
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
    );
  }

  return (
    <div className="documents-container">
      <div className="documents-header">
        <div className="documents-header-top">
          <h2>Your Documents</h2>
          {onReload && (
            <button
              className="reload-button"
              onClick={handleReload}
              disabled={isReloading || isLoadingDocuments}
              title="Reload documents"
            >
              <RefreshCw size={18} className={isReloading ? "spinning" : ""} />
              <span>{isReloading ? "Reloading..." : "Reload"}</span>
            </button>
          )}
        </div>
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
                <h3 className="document-title">
                  {document.title}
                  {document.isPasswordProtected && (
                    <Shield size={14} className="document-protected-icon" />
                  )}
                </h3>
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
                  disabled={isLoadingDocuments || openingDocumentId === document.id || closingDocumentId === document.id}
                >
                  {openingDocumentId === document.id ? (
                    <>
                      <Loader2 size={14} className="spinning" />
                      <span>Opening...</span>
                    </>
                  ) : (
                    "Open"
                  )}
                </button>
                <button
                  className="document-share-btn"
                  onClick={() => {
                    setSelectedDocument(document);
                    setIsShareSidebarOpen(true);
                  }}
                  disabled={isLoadingDocuments || openingDocumentId === document.id || closingDocumentId === document.id}
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
            return await onDocumentShare(shareData);
          } else {
            // Default implementation - you can customize this
            console.log("Sharing document:", shareData);
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return { message: "Document shared successfully" };
          }
        }}
        onCloseDocument={onCloseDocument}
        onShareSuccess={handleShareSuccess}
      />

      <ShareSuccessModal
        isOpen={isSuccessModalOpen}
        onDismiss={() => {
          setIsSuccessModalOpen(false);
          setShareResponse(null);
        }}
        document={selectedDocument}
        shareDetails={
          shareResponse
            ? {
                shareLink: shareResponse.shareLink,
                recipientEmail: shareResponse.recipientEmail,
                recipientMobile: shareResponse.recipientMobile,
                message: shareResponse.customMessage,
                expiryDate: undefined, // Will be populated from API response if needed
              }
            : null
        }
      />
    </div>
  );
};

export default DocumentList;
