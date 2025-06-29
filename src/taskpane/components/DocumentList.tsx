import React, { useState } from "react";

interface Document {
  id: string;
  title: string;
  type: string;
  dateModified: string;
  size: string;
}

interface DocumentListProps {
  documents: Document[];
  onDocumentOpen: (document: Document) => Promise<void>;
  isLoading: boolean;
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, onDocumentOpen, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
        return "📄";
      case "docx":
      case "doc":
        return "📝";
      case "xlsx":
      case "xls":
        return "📊";
      case "pptx":
      case "ppt":
        return "📋";
      default:
        return "📄";
    }
  };

  if (isLoading) {
    return (
      <div className="documents-loading">
        <div className="spinner-large"></div>
        <p>Loading your documents...</p>
      </div>
    );
  }

  return (
    <div className="documents-container">
      <div className="documents-header">
        <h2>Your Documents</h2>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="no-documents">
          {documents.length === 0 ? (
            <>
              <div className="no-docs-icon">📁</div>
              <h3>No Documents Available</h3>
              <p>You don't have any documents available at the moment.</p>
            </>
          ) : (
            <>
              <div className="no-docs-icon">🔍</div>
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
                  <span className="document-size">{document.size}</span>
                  <span className="document-separator">•</span>
                  <span className="document-date">{document.dateModified}</span>
                </div>
              </div>
              <button
                onClick={() => onDocumentOpen(document)}
                className="document-open-btn"
                disabled={isLoading}
              >
                Open
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentList;
