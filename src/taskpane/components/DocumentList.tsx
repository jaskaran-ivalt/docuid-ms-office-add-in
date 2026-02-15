import React, { useState } from "react";
import {
  SearchBox,
  Spinner,
  PrimaryButton,
  DefaultButton,
  Stack,
  Text,
} from "@fluentui/react";
import { FileText, FolderOpen, RefreshCw, Save } from "lucide-react";
import { Card } from "./shared/Card";
import ShareSidebar from "./ShareSidebar";
import ShareSuccessModal from "./ShareSuccessModal";
import { Document } from "../types";
import "./DocumentList.css";

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
  onDocumentShare?: (shareData: any) => Promise<ShareResponse>;
  onDocumentSave?: (document: Document) => Promise<void>;
  onCloseDocument?: (documentId: string) => Promise<void>;
  isLoadingDocuments: boolean;
  openingDocumentId: string | null;
  closingDocumentId: string | null;
  savingDocumentId: string | null;
  onReload?: () => Promise<void>;
}

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onDocumentOpen,
  onDocumentShare,
  onDocumentSave,
  onCloseDocument,
  isLoadingDocuments,
  openingDocumentId,
  closingDocumentId,
  savingDocumentId,
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

  const getFileIcon = (type: string) => {
    const colors: Record<string, string> = {
      pdf: "#dc3545",
      docx: "#0d6efd",
      doc: "#0d6efd",
      xlsx: "#198754",
      xls: "#198754",
      pptx: "#fd7e14",
      ppt: "#fd7e14",
    };
    return <FileText size={32} color={colors[type.toLowerCase()] || "#6c757d"} />;
  };

  if (isLoadingDocuments && documents.length === 0) {
    return (
      <Stack tokens={{ padding: 16, childrenGap: 16 }}>
        <Text variant="xLarge" styles={{ root: { fontWeight: 600 } }}>Your Documents</Text>
        <SearchBox placeholder="Search documents..." disabled />
        <Stack horizontalAlign="center" tokens={{ padding: 40 }}>
          <Spinner size={3} label="Loading your documents..." />
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack tokens={{ padding: 16, childrenGap: 16 }} className="document-list-container">
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <Text variant="xLarge" styles={{ root: { fontWeight: 600 } }}>Your Documents</Text>
        {onReload && (
          <DefaultButton
            text={isReloading ? "Reloading..." : "Reload"}
            onClick={handleReload}
            disabled={isReloading || isLoadingDocuments}
            onRenderIcon={() => <RefreshCw size={16} />}
          />
        )}
      </Stack>

      <SearchBox
        placeholder="Search documents..."
        value={searchTerm}
        onChange={(_, value) => setSearchTerm(value || "")}
        onClear={() => setSearchTerm("")}
      />

      {filteredDocuments.length === 0 ? (
        <Stack horizontalAlign="center" tokens={{ padding: 40, childrenGap: 12 }} className="empty-state">
          <FolderOpen size={48} color="#a19f9d" />
          <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
            {documents.length === 0 ? "No Documents Available" : "No Documents Found"}
          </Text>
          <Text variant="medium" styles={{ root: { color: "#605e5c" } }}>
            {documents.length === 0 ? "You don't have any documents available." : "No documents match your search."}
          </Text>
        </Stack>
      ) : (
        <Stack tokens={{ childrenGap: 12 }}>
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="document-card">
              <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
                <Stack horizontal tokens={{ childrenGap: 16 }} verticalAlign="center">
                  <div className="file-icon-container">{getFileIcon(doc.type)}</div>
                  <Stack tokens={{ childrenGap: 4 }}>
                    <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>{doc.title}</Text>
                    <Stack horizontal tokens={{ childrenGap: 8 }}>
                      <Text variant="small" styles={{ root: { color: "#605e5c" } }}>{doc.type.toUpperCase()}</Text>
                      <Text variant="small" styles={{ root: { color: "#a19f9d" } }}>•</Text>
                      <Text variant="small" styles={{ root: { color: "#605e5c" } }}>{doc.size}</Text>
                      <Text variant="small" styles={{ root: { color: "#a19f9d" } }}>•</Text>
                      <Text variant="small" styles={{ root: { color: "#605e5c" } }}>{doc.dateModified}</Text>
                    </Stack>
                  </Stack>
                </Stack>
                <Stack horizontal tokens={{ childrenGap: 8 }}>
                  <PrimaryButton
                    text={openingDocumentId === doc.id ? "Opening..." : "Open"}
                    onClick={() => onDocumentOpen(doc)}
                    disabled={!!openingDocumentId || !!closingDocumentId || !!savingDocumentId}
                  />
                  {onDocumentSave && (
                    <DefaultButton
                      text={savingDocumentId === doc.id ? "Saving..." : "Save"}
                      onClick={() => onDocumentSave(doc)}
                      disabled={!!openingDocumentId || !!closingDocumentId || !!savingDocumentId}
                      onRenderIcon={() => <Save size={14} />}
                    />
                  )}
                  <DefaultButton
                    text="Share"
                    onClick={() => { setSelectedDocument(doc); setIsShareSidebarOpen(true); }}
                    disabled={!!openingDocumentId || !!closingDocumentId || !!savingDocumentId}
                  />
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}

      <ShareSidebar
        isOpen={isShareSidebarOpen}
        onDismiss={() => { setIsShareSidebarOpen(false); setSelectedDocument(null); }}
        document={selectedDocument}
        onShare={onDocumentShare}
        onCloseDocument={onCloseDocument}
        onShareSuccess={(resp) => { setShareResponse(resp); setIsSuccessModalOpen(true); }}
      />

      <ShareSuccessModal
        isOpen={isSuccessModalOpen}
        onDismiss={() => { setIsSuccessModalOpen(false); setShareResponse(null); }}
        document={selectedDocument}
        shareDetails={shareResponse ? {
          shareLink: shareResponse.shareLink,
          recipientEmail: shareResponse.recipientEmail,
          recipientMobile: shareResponse.recipientMobile,
          message: shareResponse.customMessage,
        } : null}
      />
    </Stack>
  );
};

export default DocumentList;
