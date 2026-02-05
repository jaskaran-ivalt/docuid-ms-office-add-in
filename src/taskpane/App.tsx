import React, { useState, useEffect } from "react";
import LoginForm from "@/taskpane/components/LoginForm";
import DocumentList from "@/taskpane/components/DocumentList";
import Header from "@/taskpane/components/Header";
import ProfilePage from "@/taskpane/components/ProfilePage";
import DebugPanel from "@/taskpane/components/DebugPanel";
import { AuthService } from "@/taskpane/services/AuthService";
import { DocuIdApiService } from "@/taskpane/services/DocuIdApiService";
import { DocumentService } from "@/taskpane/services/DocumentService";
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
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [user, setUser] = useState<{ phone: string; name?: string; email?: string } | null>(null);
  const [error, setError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<"documents" | "profile">("documents");
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const savedAuth = AuthService.getStoredAuth();
    const savedUser = AuthService.getStoredUser();
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
    setIsLoading(true);
    setError("");

    try {
      await AuthService.login(phoneNumber);
      setIsAuthenticated(true);

      // Get user data from stored auth
      const savedUser = AuthService.getStoredUser();
      setUser({
        phone: phoneNumber,
        name: savedUser?.name,
        email: savedUser?.email
      });

      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const docs = await DocumentService.getDocuments();
      setDocuments(docs);
    } catch (err) {
      // Check if it's a 401 Unauthorized error
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status?: number } };
        if (axiosError.response?.status === 401) {
          // Session expired or invalid - logout and show login screen
          handleLogout();
          setError("Session expired. Please login again.");
          return;
        }
      }
      setError("Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setDocuments([]);
    setError("");
  };

  const handleDocumentOpen = async (document: Document) => {
    try {
      setIsLoading(true);
      await DocumentService.openDocument(document.id);
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
      setIsLoading(false);
    }
  };

  const handleDocumentClose = async (documentId: string) => {
    try {
      setIsLoading(true);
      await DocumentService.closeDocument(documentId);
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
      setIsLoading(false);
    }
  };

  const handleDocumentShare = async (shareData: {
    documentId: string;
    email?: string;
    countryCode?: string;
    mobile?: string;
    message?: string;
  }) => {
    try {
      setIsLoading(true);
      const parsedDocumentId = Number(shareData.documentId);

      if (Number.isNaN(parsedDocumentId)) {
        throw new Error("Invalid document ID");
      }

      const response = await DocuIdApiService.shareDocument({
        documentId: parsedDocumentId,
        email: shareData.email,
        countryCode: shareData.countryCode,
        mobile: shareData.mobile,
        message: shareData.message,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to share document");
      }
    } catch (err) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as { response?: { status?: number } };
        if (axiosError.response?.status === 401) {
          handleLogout();
          setError("Session expired. Please login again.");
          return;
        }
      }

      setError(err instanceof Error ? err.message : "Failed to share document");
      throw err;
    } finally {
      setIsLoading(false);
    }
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
            <LoginForm onLogin={handleLogin} isLoading={isLoading} />
          ) : currentPage === "profile" ? (
            <ProfilePage onBack={handleNavigateToDocuments} />
          ) : (
            <DocumentList
              documents={documents}
              onDocumentOpen={handleDocumentOpen}
              onDocumentShare={handleDocumentShare}
              onCloseDocument={handleDocumentClose}
              isLoading={isLoading}
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
