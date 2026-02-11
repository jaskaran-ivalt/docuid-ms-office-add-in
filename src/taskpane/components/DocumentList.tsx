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
        return <FileText size={32} color="#dc3545" />;
      case "docx":
      case "doc":
        return <FileText size={32} color="#0d6efd" />;
      case "xlsx":
      case "xls":
        return <FileText size={32} color="#198754" />;
      case "pptx":
      case "ppt":
        return <FileText size={32} color="#fd7e14" />;
      default:
        return <FileText size={32} color="#6c757d" />;
    }
  };

  // Skeleton loading component
  const DocumentSkeleton = () => (
    <Card elevation={1}>
      <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="center">
        <div style={{ width: 40, height: 40, backgroundColor: "#f3f2f1", borderRadius: 4 }} />
        <Stack tokens={{ childrenGap: 4 }} styles={{ root: { flex: 1 } }}>
          <div style={{ width: "60%", height: 16, backgroundColor: "#f3f2f1", borderRadius: 2 }} />
          <div style={{ width: "40%", height: 12, backgroundColor: "#f3f2f1", borderRadius: 2 }} />
        </Stack>
      </Stack>
    </Card>
  );

  if (isLoadingDocuments) {
    return (
      <Stack tokens={{ padding: 16, childrenGap: 16 }}>
        <Text variant="xLarge" styles={{ root: { fontWeight: 600 } }}>
          Your Documents
        </Text>
        <SearchBox placeholder="Search documents..." disabled />
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
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <Text variant="xLarge" styles={{ root: { fontWeight: 600 } }}>
          Your Documents
        </Text>
        {onReload && (
          <DefaultButton
            text={isReloading ? "Reloading..." : "Reload"}
            onClick={handleReload}
            disabled={isReloading || isLoadingDocuments}
            onRenderIcon={() => <RefreshCw size={16} style={{ marginRight: 4 }} />}
          />
        )}
      </Stack>

      <SearchBox
        placeholder="Search documents..."
        value={searchTerm}
        onChange={(_, value) => setSearchTerm(value || "")}
        onClear={() => setSearchTerm("")}
      />

      {isLoadingDocuments ? (
        <Stack tokens={{ childrenGap: 12 }}>
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              styles={{
                root: {
                  backgroundColor: "white",
                  border: "1px solid #edebe9",
                  boxShadow: "0 0 transparent",
                },
              }}
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
          tokens={{ padding: 40, childrenGap: 12 }}
          styles={{ root: { backgroundColor: "white", border: "1px solid #edebe9" } }}
        >
          <FolderOpen size={48} color="#a19f9d" />
          <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
            {documents.length === 0 ? "No Documents Available" : "No Documents Found"}
          </Text>
          <Text variant="medium" styles={{ root: { color: "#605e5c" } }}>
            {documents.length === 0
              ? "You don't have any documents available at the moment."
              : "No documents match your search criteria."}
          </Text>
        </Stack>
      ) : (
        <Stack tokens={{ childrenGap: 12 }}>
          {filteredDocuments.map((document) => (
            <Card
              key={document.id}
              styles={{
                root: {
                  backgroundColor: "white",
                  border: "1px solid #edebe9",
                  borderRadius: 0,
                  boxShadow: "0 0 transparent",
                },
              }}
            >
              <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
                <Stack horizontal tokens={{ childrenGap: 16 }} verticalAlign="center">
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      backgroundColor: "#f5f5f5",
                      border: "1px solid #edebe9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {getFileIcon(document.type)}
                  </div>
                  <Stack tokens={{ childrenGap: 4 }}>
                    <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                      <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>
                        {document.title}
                      </Text>
                    </Stack>
                    <Stack horizontal tokens={{ childrenGap: 8 }}>
                      <Text variant="small" styles={{ root: { color: "#605e5c" } }}>
                        {document.type.toUpperCase()}
                      </Text>
                      <Text variant="small" styles={{ root: { color: "#a19f9d" } }}>
                        •
                      </Text>
                      <Text variant="small" styles={{ root: { color: "#605e5c" } }}>
                        {document.size}
                      </Text>
                      <Text variant="small" styles={{ root: { color: "#a19f9d" } }}>
                        •
                      </Text>
                      <Text variant="small" styles={{ root: { color: "#605e5c" } }}>
                        {document.dateModified}
                      </Text>
                    </Stack>
                  </Stack>
                </Stack>
                <Stack horizontal tokens={{ childrenGap: 8 }}>
                  <PrimaryButton
                    text={openingDocumentId === document.id ? "Opening..." : "Open"}
                    onClick={() => onDocumentOpen(document)}
                    disabled={
                      isLoadingDocuments ||
                      openingDocumentId === document.id ||
                      closingDocumentId === document.id
                    }
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
