import React, { useState, useEffect } from "react";
import LoginForm from "@/taskpane/components/LoginForm";
import DocumentList from "@/taskpane/components/DocumentList";
import Header from "@/taskpane/components/Header";
import ProfilePage from "@/taskpane/components/ProfilePage";
import DebugPanel from "@/taskpane/components/DebugPanel";
import { authService, documentService } from "@/taskpane/services/ServiceContainer";
import { DocuIdThemeProvider } from "./components/DesignSystem";
import { logger } from "@/taskpane/services/Logger";
import "./App.css";

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

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const [isOpeningDocument, setIsOpeningDocument] = useState<string | null>(null);
  const [isClosingDocument, setIsClosingDocument] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [user, setUser] = useState<{ phone: string; name?: string; email?: string } | null>(null);
  const [error, setError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<"documents" | "profile">("documents");
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const savedAuth = authService.getStoredAuth();
    const savedUser = authService.getStoredAuth()?.user;
    if (savedAuth) {
      setIsAuthenticated(true);
      setUser({
        phone: savedAuth.phone,
        name: savedUser?.name,
        email: savedUser?.email
      });
      loadDocuments();
    }

    // Add keyboard shortcut for debug panel (Ctrl+Shift+D)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        setDebugPanelOpen(prev => !prev);
        logger.createContextLogger('App').info('Debug panel toggled', { open: !debugPanelOpen });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [debugPanelOpen]);

  const handleLogin = async (phoneNumber: string) => {
    setIsLoadingLogin(true);
    setError("");

    try {
      await authService.login(phoneNumber);
      setIsAuthenticated(true);

      // Get user data from stored auth
      const savedUser = authService.getStoredAuth()?.user;
      setUser({
        phone: phoneNumber,
        name: savedUser?.name,
        email: savedUser?.email
      });

      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoadingLogin(false);
    }
  };

  const loadDocuments = async () => {
    try {
      setIsLoadingDocuments(true);
      const docs = await documentService.getDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error("[App] Load documents failed:", err);
      // Check if it's a 401 Unauthorized error
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status?: number } };
        if (axiosError.response?.status === 401) {
          console.warn("[App] Session expired (401), logging out...");
          // Session expired or invalid - logout and show login screen
          handleLogout();
          setError("Session expired. Please login again.");
          return;
        }
      }
      setError("Failed to load documents");
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setDocuments([]);
    setError("");
  };

  const handleDocumentOpen = async (document: Document) => {
    try {
      setIsOpeningDocument(document.id);
      await documentService.openDocument(document.id);
    } catch (err) {
      // Check if it's a 401 Unauthorized error
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status?: number } };
        if (axiosError.response?.status === 401) {
          handleLogout();
          setError("Session expired. Please login again.");
          return;
        }
      }
      setError("Failed to open document");
    } finally {
      setIsOpeningDocument(null);
    }
  };

  const handleDocumentClose = async (documentId: string) => {
    try {
      setIsClosingDocument(documentId);
      await documentService.closeDocument(documentId); 
      // Remove the document from the list
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    } catch (err) {
      // Check if it's a 401 Unauthorized error
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status?: number } };
        if (axiosError.response?.status === 401) {
          handleLogout();
          setError("Session expired. Please login again.");
          return;
        }
      }
      setError("Failed to close document");
    } finally {
      setIsClosingDocument(null);
    }
  };

  const handleDocumentShare = async (shareData: {
    documentId: string;
    email?: string;
    countryCode?: string;
    mobile?: string;
    message?: string;
  }) => {
    // Share loading is handled internally in ShareSidebar
    const parsedDocumentId = Number(shareData.documentId);

    if (Number.isNaN(parsedDocumentId)) {
      throw new Error("Invalid document ID");
    }

    const response = await documentService.shareDocument({
      documentId: parsedDocumentId,
      email: shareData.email,
      countryCode: shareData.countryCode,
      mobile: shareData.mobile,
      message: shareData.message,
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to share document");
    }

    // Return share response for success modal
    return {
      shareLink: response.data?.shareLink,
      shareId: response.data?.shareId,
      message: response.message,
    };
  };

  const handleNavigateToProfile = () => {
    setCurrentPage("profile");
  };

  const handleNavigateToDocuments = () => {
    setCurrentPage("documents");
  };

  return (
    <DocuIdThemeProvider>
      <div className="app-container">
        <Header
          user={user}
          onLogout={handleLogout}
          onNavigateToProfile={isAuthenticated ? handleNavigateToProfile : undefined}
          onToggleDebug={() => setDebugPanelOpen(prev => !prev)}
        />

        <main className="main-content">
          {error && (
            <div className="error-message">
              {error}
              <button onClick={() => setError("")} className="error-close">
                ×
              </button>
            </div>
          )}

          {!isAuthenticated ? (
            <LoginForm onLogin={handleLogin} isLoading={isLoadingLogin} />
          ) : currentPage === "profile" ? (
            <ProfilePage onBack={handleNavigateToDocuments} />
          ) : (
            <DocumentList
              documents={documents}
              onDocumentOpen={handleDocumentOpen}
              onDocumentShare={handleDocumentShare}
              onCloseDocument={handleDocumentClose}
              isLoadingDocuments={isLoadingDocuments}
              openingDocumentId={isOpeningDocument}
              closingDocumentId={isClosingDocument}
              onReload={loadDocuments}
            />
          )}
        </main>

        <DebugPanel
          isOpen={debugPanelOpen}
          onClose={() => setDebugPanelOpen(false)}
        />
      </div>
    </DocuIdThemeProvider>
  );
};

export default App;
