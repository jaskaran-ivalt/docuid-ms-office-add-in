import React, { useState } from "react";
import {
  SearchBox,
  Spinner,
  PrimaryButton,
  DefaultButton,
  Stack,
  Text,
} from "@fluentui/react";
import { FileText, FolderOpen, RefreshCw, Shield } from "lucide-react";
import { Card } from "./shared/Card";
import ShareSidebar from "./ShareSidebar";
import ShareSuccessModal from "./ShareSuccessModal";
import "./DocumentList.css";

import { Document, ShareApiResponse as ShareResponse } from "../common/types";

interface ShareData {
  documentId: string;
  email?: string;
  mobile?: string;
  message?: string;
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
      // Error handled silently for production
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
        return <FileText className="doc-icon" style={{ color: "#dc3545" }} />;
      case "docx":
      case "doc":
        return <FileText className="doc-icon" style={{ color: "#0d6efd" }} />;
      case "xlsx":
      case "xls":
        return <FileText className="doc-icon" style={{ color: "#198754" }} />;
      case "pptx":
      case "ppt":
        return <FileText className="doc-icon" style={{ color: "#fd7e14" }} />;
      default:
        return <FileText className="doc-icon" style={{ color: "#6c757d" }} />;
    }
  };

  // Skeleton loading component
  const DocumentSkeleton = () => (
    <Card elevation={1} className="document-card-skeleton">
      <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="center">
        <div className="skeleton-icon-wrapper" />
        <Stack tokens={{ childrenGap: 4 }} styles={{ root: { flex: 1 } }}>
          <div className="skeleton-title-bar" />
          <div className="skeleton-meta-bar" />
        </Stack>
      </Stack>
    </Card>
  );

  if (isLoadingDocuments) {
    return (
      <Stack tokens={{ padding: 16, childrenGap: 16 }} styles={{ root: { backgroundColor: "#f5f5f5", minHeight: "100%" } }}>
        <Stack horizontal horizontalAlign="space-between" verticalAlign="center" styles={{ root: { flexWrap: "wrap" } }}>
          <Text variant="xLarge" styles={{ root: { fontWeight: 600, flexShrink: 0 } }}>
            Your Documents
          </Text>
        </Stack>
        <SearchBox placeholder="Search documents..." disabled styles={{ root: { width: "100%" } }} />
        <Stack tokens={{ childrenGap: 12 }}>
          {[1, 2, 3].map((index) => (
            <DocumentSkeleton key={index} />
          ))}
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack
      tokens={{ padding: 16, childrenGap: 16 }}
      styles={{ root: { backgroundColor: "#f5f5f5", minHeight: "100%" } }}
    >
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center" styles={{ root: { flexWrap: "wrap" } }}>
        <Text variant="xLarge" styles={{ root: { fontWeight: 600, flexShrink: 0 } }}>
          Your Documents
        </Text>
        {onReload && (
          <DefaultButton
            text={isReloading ? "Reloading..." : "Reload"}
            onClick={handleReload}
            disabled={isReloading || isLoadingDocuments}
            onRenderIcon={() => <RefreshCw className={`reload-icon ${isReloading ? 'spinning' : ''}`} />}
            className="reload-button"
          />
        )}
      </Stack>

      <SearchBox
        placeholder="Search documents..."
        value={searchTerm}
        onChange={(_, value) => setSearchTerm(value || "")}
        onClear={() => setSearchTerm("")}
        styles={{ root: { width: "100%" } }}
      />

      {isLoadingDocuments ? (
        <Stack tokens={{ childrenGap: 12 }}>
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className="document-loading-card"
            >
              <Stack horizontal tokens={{ childrenGap: 12 }}>
                <Spinner />
                <Text>Loading documents...</Text>
              </Stack>
            </Card>
          ))}
        </Stack>
      ) : filteredDocuments.length === 0 ? (
        <Stack
          horizontalAlign="center"
          tokens={{ padding: 32, childrenGap: 12 }}
          className="empty-state"
        >
          <FolderOpen className="empty-state-icon" />
          <Text variant="large" styles={{ root: { fontWeight: 600, textAlign: "center" } }}>
            {documents.length === 0 ? "No Documents Available" : "No Documents Found"}
          </Text>
          <Text variant="medium" styles={{ root: { color: "#605e5c", textAlign: "center" } }}>
            {documents.length === 0
              ? "You don't have any documents available at the moment."
              : "No documents match your search criteria."}
          </Text>
        </Stack>
      ) : (
        <Stack tokens={{ childrenGap: 12 }} className="documents-list">
          {filteredDocuments.map((document) => (
            <Card
              key={document.id}
              className="document-card"
            >
              <Stack
                horizontal
                horizontalAlign="space-between"
                verticalAlign="center"
                tokens={{ childrenGap: 12 }}
                className="document-card-inner"
              >
                <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="center" className="document-card-content">
                  <div className="document-icon-wrapper">
                    {getFileIcon(document.type)}
                  </div>
                  <Stack tokens={{ childrenGap: 4 }} className="document-info">
                    <Text variant="medium" className="document-title">
                      {document.title}
                    </Text>
                    <Stack horizontal tokens={{ childrenGap: 6 }} className="document-meta">
                      <Text variant="small" className="document-type-badge">
                        {document.type.toUpperCase()}
                      </Text>
                      <Text variant="small" className="document-separator">
                        •
                      </Text>
                      <Text variant="small" className="document-meta-text">
                        {document.size}
                      </Text>
                      <Text variant="small" className="document-separator">
                        •
                      </Text>
                      <Text variant="small" className="document-meta-text">
                        {document.dateModified}
                      </Text>
                    </Stack>
                  </Stack>
                </Stack>
                <Stack horizontal tokens={{ childrenGap: 8 }} className="document-actions">
                  <PrimaryButton
                    text={openingDocumentId === document.id ? "Opening..." : "Open"}
                    onClick={() => onDocumentOpen(document)}
                    disabled={
                      isLoadingDocuments ||
                      openingDocumentId === document.id ||
                      closingDocumentId === document.id
                    }
                    className="document-open-button"
                  />
                  <DefaultButton
                    text="Share"
                    onClick={() => {
                      setSelectedDocument(document);
                      setIsShareSidebarOpen(true);
                    }}
                    disabled={
                      isLoadingDocuments ||
                      openingDocumentId === document.id ||
                      closingDocumentId === document.id
                    }
                    className="document-share-button"
                  />
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>
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
          }
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return { message: "Document shared successfully" };
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
                expiryDate: undefined,
              }
            : null
        }
      />
    </Stack>
  );
};

export default DocumentList;
