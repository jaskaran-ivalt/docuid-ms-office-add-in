import React, { useState, useEffect } from "react";
import { ThemeProvider } from "@fluentui/react";
import LoginForm from "@/taskpane/components/LoginForm";
import DocumentList from "@/taskpane/components/DocumentList";
import Header from "@/taskpane/components/Header";
import ProfilePage from "@/taskpane/components/profile/ProfilePage";
import DebugPanel from "@/taskpane/components/DebugPanel";
import { AuthService } from "@/taskpane/services/AuthService";
import { DocuIdApiService } from "@/taskpane/services/DocuIdApiService";
import { DocumentService } from "@/taskpane/services/DocumentService";
import { docuIdTheme } from "./theme/fluentTheme";
import { logger } from "@/taskpane/services/Logger";
import { Document } from "./common/types";
import "./App.css";

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
    // Session management via custom events from DocuIdApiService
    const handleUnauthorized = () => {
      handleLogout();
      setError("Session expired. Please login again.");
    };

    window.addEventListener("docuid-unauthorized", handleUnauthorized);

    // Initial check for stored auth
    const auth = AuthService.getStoredAuth();
    if (auth) {
      setIsAuthenticated(true);
      setUser({
        phone: auth.phone,
        name: auth.user?.name,
        email: auth.user?.email,
      });
      loadDocuments();
    }

    return () => {
      window.removeEventListener("docuid-unauthorized", handleUnauthorized);
    };
  }, []);

  const handleLogin = async (phoneNumber: string) => {
    setIsLoadingLogin(true);
    setError("");

    try {
      await AuthService.login(phoneNumber);
      setIsAuthenticated(true);

      const auth = AuthService.getStoredAuth();
      if (auth) {
        setUser({
          phone: auth.phone,
          name: auth.user?.name,
          email: auth.user?.email,
        });
      }

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
      const docs = await DocumentService.getDocuments();
      setDocuments(docs);
    } catch (err) {
      setError("Failed to load documents");
    } finally {
      setIsLoadingDocuments(false);
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
      setIsOpeningDocument(document.id);
      await DocumentService.openDocument(document.id);
    } catch (err) {
      setError("Failed to open document");
    } finally {
      setIsOpeningDocument(null);
    }
  };

  const handleDocumentClose = async (documentId: string) => {
    try {
      setIsClosingDocument(documentId);
      await DocumentService.closeDocument(documentId);
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    } catch (err) {
      setError("Failed to close document");
    } finally {
      setIsClosingDocument(null);
    }
  };

  const handleDocumentShare = async (shareData: any) => {
    const response = await DocuIdApiService.shareDocument({
      documentId: Number(shareData.documentId),
      email: shareData.email,
      countryCode: shareData.countryCode,
      mobile: shareData.mobile,
      message: shareData.message,
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to share document");
    }

    return {
      shareLink: response.data?.shareLink,
      shareId: response.data?.shareId,
      message: response.message,
    };
  };

  return (
    <ThemeProvider theme={docuIdTheme}>
      <div className="app-container">
        <Header
          user={user}
          onLogout={handleLogout}
          onNavigateToProfile={() => setCurrentPage("profile")}
          onToggleDebug={() => setDebugPanelOpen(!debugPanelOpen)}
        />

        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={() => setError("")} className="error-close">×</button>
          </div>
        )}

        <main className="app-main">
          {!isAuthenticated ? (
            <LoginForm onLogin={handleLogin} isLoading={isLoadingLogin} />
          ) : currentPage === "profile" ? (
            <ProfilePage onBack={() => setCurrentPage("documents")} />
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

        <DebugPanel isOpen={debugPanelOpen} onClose={() => setDebugPanelOpen(false)} />
      </div>
    </ThemeProvider>
  );
};

export default App;
