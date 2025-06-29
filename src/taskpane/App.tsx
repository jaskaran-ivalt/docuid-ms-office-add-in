import React, { useState, useEffect } from "react";
import LoginForm from "@/taskpane/components/LoginForm";
import DocumentList from "@/taskpane/components/DocumentList";
import Header from "@/taskpane/components/Header";
import { AuthService } from "@/taskpane/services/AuthService";
import { DocumentService } from "@/taskpane/services/DocumentService";

interface Document {
  id: string;
  title: string;
  type: string;
  dateModified: string;
  size: string;
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [user, setUser] = useState<{ phone: string } | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // Check if user is already authenticated
    const savedAuth = AuthService.getStoredAuth();
    if (savedAuth) {
      setIsAuthenticated(true);
      setUser({ phone: savedAuth.phone });
      loadDocuments();
    }
  }, []);

  const handleLogin = async (phoneNumber: string) => {
    setIsLoading(true);
    setError("");

    try {
      // Simulate API call to docuid.net
      await AuthService.login(phoneNumber);
      setIsAuthenticated(true);
      setUser({ phone: phoneNumber });
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const docs = await DocumentService.getDocuments();
      setDocuments(docs);
    } catch (err) {
      setError("Failed to load documents");
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
      setError("Failed to open document");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Header user={user} onLogout={handleLogout} />

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
        ) : (
          <DocumentList
            documents={documents}
            onDocumentOpen={handleDocumentOpen}
            isLoading={isLoading}
          />
        )}
      </main>
    </div>
  );
};

export default App;
