import React, { useState, useEffect } from "react";
import { ThemeProvider } from "@fluentui/react";
import LoginForm from "@/taskpane/components/LoginForm";
import DocumentList from "@/taskpane/components/DocumentList";
import Header from "@/taskpane/components/Header";
import ProfilePage from "@/taskpane/components/ProfilePage";
import DebugPanel from "@/taskpane/components/DebugPanel";
import { AuthService } from "@/taskpane/services/AuthService";
import { DocuIdApiService } from "@/taskpane/services/DocuIdApiService";
import { DocumentService } from "@/taskpane/services/DocumentService";
import { docuIdTheme } from "./theme/fluentTheme";
import { Logger } from "@/taskpane/services/Logger";
import { Document, User } from "./types";
import "./App.css";

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const [isOpeningDocument, setIsOpeningDocument] = useState<string | null>(null);
  const [isClosingDocument, setIsClosingDocument] = useState<string | null>(null);
  const [isSavingDocument, setIsSavingDocument] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<"documents" | "profile">("documents");
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);
  const logger = Logger.getInstance().createContextLogger("App");

  useEffect(() => {
    const savedAuth = AuthService.getStoredAuth();
    if (savedAuth) {
      setIsAuthenticated(true);
      setUser(savedAuth.user || null);
      loadDocuments();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === "D") {
        event.preventDefault();
        setDebugPanelOpen((prev) => !prev);
        logger.info("Debug panel toggled", { open: !debugPanelOpen });
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleError = (err: any, defaultMessage: string) => {
    if (err?.response?.status === 401) {
      handleLogout();
      setError("Session expired. Please login again.");
      return;
    }
    setError(err instanceof Error ? err.message : defaultMessage);
  };

  const handleLogin = async (phoneNumber: string) => {
    setIsLoadingLogin(true);
    setError("");
    try {
      await AuthService.login(phoneNumber);
      setIsAuthenticated(true);
      setUser(AuthService.getStoredAuth()?.user || null);
      await loadDocuments();
    } catch (err) {
      handleError(err, "Login failed");
    } finally {
      setIsLoadingLogin(false);
    }
  };

  const loadDocuments = async () => {
    try {
      setIsLoadingDocuments(true);
      setDocuments(await DocumentService.getDocuments());
    } catch (err) {
      handleError(err, "Failed to load documents");
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
    setCurrentPage("documents");
  };

  const handleDocumentOpen = async (doc: Document) => {
    try {
      setIsOpeningDocument(doc.id);
      await DocumentService.openDocument(doc.id);
    } catch (err) {
      handleError(err, "Failed to open document");
    } finally {
      setIsOpeningDocument(null);
    }
  };

  const handleDocumentClose = async (id: string) => {
    try {
      setIsClosingDocument(id);
      await DocumentService.closeDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      handleError(err, "Failed to close document");
    } finally {
      setIsClosingDocument(null);
    }
  };

  const handleDocumentShare = async (data: any) => {
    const id = Number(data.documentId);
    if (isNaN(id)) throw new Error("Invalid document ID");

    const resp = await DocuIdApiService.shareDocument({
      documentId: id,
      email: data.email,
      countryCode: data.countryCode,
      mobile: data.mobile,
      message: data.message,
    });

    if (!resp.success) throw new Error(resp.message || "Failed to share document");
    return { shareLink: resp.data?.shareLink, shareId: resp.data?.shareId, message: resp.message };
  };

  const handleDocumentSave = async (doc: Document) => {
    try {
      setIsSavingDocument(doc.id);
      setError("");
      setSuccessMessage("");
      const result = await DocumentService.saveDocumentToServer(doc.id, doc.title);
      setSuccessMessage(`Document saved successfully as "${result.fileName}"`);
      setTimeout(() => setSuccessMessage(""), 4000);
      await loadDocuments();
    } catch (err) {
      handleError(err, "Failed to save document to server");
    } finally {
      setIsSavingDocument(null);
    }
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

        <main className="app-main">
          {error && (
            <div className="error-banner">
              <span>{error}</span>
              <button onClick={() => setError("")} className="error-close">×</button>
            </div>
          )}

          {successMessage && (
            <div className="success-banner">
              <span>{successMessage}</span>
              <button onClick={() => setSuccessMessage("")} className="success-close">×</button>
            </div>
          )}

          {!isAuthenticated ? (
            <LoginForm onLogin={handleLogin} isLoading={isLoadingLogin} />
          ) : currentPage === "profile" ? (
            <ProfilePage onBack={() => setCurrentPage("documents")} />
          ) : (
            <DocumentList
              documents={documents}
              onDocumentOpen={handleDocumentOpen}
              onDocumentShare={handleDocumentShare}
              onDocumentSave={handleDocumentSave}
              onCloseDocument={handleDocumentClose}
              isLoadingDocuments={isLoadingDocuments}
              openingDocumentId={isOpeningDocument}
              closingDocumentId={isClosingDocument}
              savingDocumentId={isSavingDocument}
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
