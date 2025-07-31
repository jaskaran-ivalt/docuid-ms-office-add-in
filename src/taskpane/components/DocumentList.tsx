import React, { useState } from "react";
import { TextField, Spinner, DefaultButton, Stack } from "@fluentui/react";
import {
  DocumentPdf24Regular,
  Document24Regular,
  Search24Regular,
  Folder24Regular,
} from "@fluentui/react-icons";
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
        return <DocumentPdf24Regular />;
      default:
        return <Document24Regular />;
    }
  };

  if (isLoading) {
    return (
      <Stack verticalAlign="center" horizontalAlign="center" style={{ height: 300 }}>
        <Spinner size={3} label="Loading your documents..." />
      </Stack>
    );
  }

  return (
    <Stack tokens={{ childrenGap: 24 }}>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <h2>Your Documents</h2>
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
          <TextField
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(_, v) => setSearchTerm(v || "")}
            styles={{ root: { width: 220 } }}
            borderless
            underlined
            iconProps={{ iconName: undefined }}
          />
          <Search24Regular />
        </Stack>
      </Stack>
      {filteredDocuments.length === 0 ? (
        <Stack verticalAlign="center" horizontalAlign="center" style={{ minHeight: 200 }}>
          {documents.length === 0 ? (
            <>
              <Folder24Regular style={{ fontSize: 48, marginBottom: 8 }} />
              <h3>No Documents Available</h3>
              <p>You don't have any documents available at the moment.</p>
            </>
          ) : (
            <>
              <Search24Regular style={{ fontSize: 48, marginBottom: 8 }} />
              <h3>No Documents Found</h3>
              <p>No documents match your search criteria.</p>
            </>
          )}
        </Stack>
      ) : (
        <Stack tokens={{ childrenGap: 12 }}>
          {filteredDocuments.map((document) => (
            <Stack
              key={document.id}
              horizontal
              verticalAlign="center"
              tokens={{ childrenGap: 16 }}
              style={{ padding: 12, border: "1px solid #eee", borderRadius: 6 }}
            >
              <div>{getFileIcon(document.type)}</div>
              <Stack grow>
                <h3 style={{ margin: 0 }}>{document.title}</h3>
                <Stack horizontal tokens={{ childrenGap: 8 }}>
                  <span>{document.type.toUpperCase()}</span>
                  <span>•</span>
                  <span>{document.size}</span>
                  <span>•</span>
                  <span>{document.dateModified}</span>
                </Stack>
              </Stack>
              <DefaultButton
                onClick={() => onDocumentOpen(document)}
                disabled={isLoading}
                text="Open"
              />
              <DefaultButton
                onClick={() => {
                  setSelectedDocument(document);
                  setIsShareSidebarOpen(true);
                }}
                disabled={isLoading}
                text="Share"
              />
            </Stack>
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
            await onDocumentShare(shareData);
          } else {
            // Default implementation - you can customize this
            console.log('Sharing document:', shareData);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }}
      />
    </Stack>
  );
};

export default DocumentList;
