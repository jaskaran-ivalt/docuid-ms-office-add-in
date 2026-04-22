import React, { useState, useEffect } from "react";
import { 
  ThemeProvider, 
  Dialog, 
  DialogType, 
  DialogFooter, 
  PrimaryButton, 
  DefaultButton 
} from "@fluentui/react";
import LoginForm from "@/taskpane/components/LoginForm";
import DocumentList from "@/taskpane/components/DocumentList";
import Header from "@/taskpane/components/Header";
import ProfilePage from "@/taskpane/components/profile/ProfilePage";
import DebugPanel from "@/taskpane/components/DebugPanel";
import { AuthService } from "@/taskpane/services/AuthService";
import { DocuIdApiService } from "@/taskpane/services/DocuIdApiService";
import { DocumentService } from "@/taskpane/services/DocumentService";
import { OfficeHost } from "@/taskpane/services/OfficeHostService";
import { docuIdTheme } from "./theme/fluentTheme";
import { logger } from "@/taskpane/services/Logger";
import { Document } from "./common/types";
import "./App.css";

interface AppProps {
  officeHost?: OfficeHost;
}

const App: React.FC<AppProps> = ({ officeHost = "Unknown" }) => {

  // CSS custom properties injected on the root container so every
  // descendant can reference var(--accent), var(--accent-dark), var(--accent-dim)
  // without knowing which Office host is active.
  const getHostVars = (): React.CSSProperties => {
    switch (officeHost) {
      case "Excel":
        return {
          "--accent": "#217346",
          "--accent-dark": "#1a5c39",
          "--accent-dim": "rgba(33,115,70,0.12)",
        } as React.CSSProperties;
      case "PowerPoint":
        return {
          "--accent": "#c7421f",
          "--accent-dark": "#b33519",
          "--accent-dim": "rgba(199,66,31,0.12)",
        } as React.CSSProperties;
      case "Word":
      default:
        return {
          "--accent": "#0067c0",
          "--accent-dark": "#005fb8",
          "--accent-dim": "rgba(0,103,192,0.12)",
        } as React.CSSProperties;
    }
  };
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
  const [openDocumentId, setOpenDocumentId] = useState<string | null>(null);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

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

  const handleLogout = async () => {
    setIsLogoutDialogOpen(false);
    // Clear document content on logout as requested
    await DocumentService.clearDocument();
    
    AuthService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setDocuments([]);
    setError("");
    setOpenDocumentId(null);
  };

  const handleDocumentOpen = async (document: Document) => {
    try {
      setIsOpeningDocument(document.id);
      await DocumentService.openDocument(document.id);
      setOpenDocumentId(document.id);
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
      if (openDocumentId === documentId) {
        setOpenDocumentId(null);
      }
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
      <div className="app-container" style={getHostVars()}>
        <Header
          user={user}
          onLogout={() => setIsLogoutDialogOpen(true)}
          onNavigateToProfile={() => setCurrentPage("profile")}
          onToggleDebug={() => setDebugPanelOpen(!debugPanelOpen)}
          officeHost={officeHost}
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
          ) : (
            <>
              {currentPage === "profile" ? (
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
                  openDocumentId={openDocumentId}
                  onReload={loadDocuments}
                />
              )}
              <Dialog
                hidden={!isLogoutDialogOpen}
                onDismiss={() => setIsLogoutDialogOpen(false)}
                dialogContentProps={{
                  type: DialogType.normal,
                  title: "Sign Out",
                  closeButtonAriaLabel: "Close",
                  subText: "Are you sure you want to sign out? This will also clear the current document content for security.",
                }}
                modalProps={{
                  isBlocking: false,
                  styles: { main: { maxWidth: 450 } },
                }}
              >
                <DialogFooter>
                  <PrimaryButton onClick={handleLogout} text="Sign Out" />
                  <DefaultButton onClick={() => setIsLogoutDialogOpen(false)} text="Cancel" />
                </DialogFooter>
              </Dialog>
            </>
          )}
        </main>

        <DebugPanel isOpen={debugPanelOpen} onClose={() => setDebugPanelOpen(false)} />
      </div>
    </ThemeProvider>
  );
};

export default App;
