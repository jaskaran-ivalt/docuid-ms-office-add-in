import React, { useState } from "react";
import { SearchBox, Spinner, PrimaryButton, DefaultButton, Stack, Text, Icon } from "@fluentui/react";
import { Shield, RefreshCw } from "lucide-react";
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
        return <Icon iconName="PDF" styles={{ root: { fontSize: 40, color: "#d32f2f" } }} />;
      case "docx":
      case "doc":
        return <Icon iconName="WordDocument" styles={{ root: { fontSize: 40, color: "#2b579a" } }} />;
      case "xlsx":
      case "xls":
        return <Icon iconName="ExcelDocument" styles={{ root: { fontSize: 40, color: "#217346" } }} />;
      case "pptx":
      case "ppt":
        return <Icon iconName="PowerPointDocument" styles={{ root: { fontSize: 40, color: "#d24726" } }} />;
      default:
        return <Icon iconName="Page" styles={{ root: { fontSize: 40, color: "#605e5c" } }} />;
    }
  };

  // Skeleton loading component
  const DocumentSkeleton = () => (
    <Card elevation={1}>
      <Stack horizontal tokens={{ childrenGap: 12 }}>
        <Spinner />
        <Text>Loading...</Text>
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
          {[1, 2, 3, 4, 5].map((index) => (
            <DocumentSkeleton key={index} />
          ))}
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack tokens={{ padding: 16, childrenGap: 16 }}>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <Text variant="xLarge" styles={{ root: { fontWeight: 600 } }}>
          Your Documents
        </Text>
        {onReload && (
          <DefaultButton
            iconProps={{ iconName: "Refresh" }}
            text={isReloading ? "Reloading..." : "Reload"}
            onClick={handleReload}
            disabled={isReloading || isLoadingDocuments}
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
            <Card key={i} elevation={1}>
              <Stack horizontal tokens={{ childrenGap: 12 }}>
                <Spinner />
                <Text>Loading documents...</Text>
              </Stack>
            </Card>
          ))}
        </Stack>
      ) : filteredDocuments.length === 0 ? (
        <Stack horizontalAlign="center" tokens={{ padding: 40, childrenGap: 12 }}>
          <Icon iconName="FabricFolder" styles={{ root: { fontSize: 48, color: "#a19f9d" } }} />
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
            <Card key={document.id} elevation={1} hoverable>
              <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
                <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="center">
                  {getFileIcon(document.type)}
                  <Stack tokens={{ childrenGap: 4 }}>
                    <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                      <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>
                        {document.title}
                      </Text>
                      {document.isPasswordProtected && (
                        <Shield size={14} style={{ color: "#0078d4" }} />
                      )}
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
