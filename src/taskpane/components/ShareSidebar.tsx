import React, { useState } from "react";
import {
  Panel,
  PanelType,
  TextField,
  PrimaryButton,
  DefaultButton,
  Stack,
  MessageBar,
  MessageBarType,
  Spinner,
  Label,
} from "@fluentui/react";
import { Share, Mail, Phone, FileText, Calendar, HardDrive, X, Loader2 } from "lucide-react";
import PhoneInput, { parsePhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "./ShareSidebar.css";

interface Document {
  id: string;
  title: string;
  type: string;
  dateModified: string;
  size: string;
}

interface ShareSidebarProps {
  isOpen: boolean;
  onDismiss: () => void;
  document: Document | null;
  onShare: (shareData: ShareData) => Promise<ShareResponse>;
  onCloseDocument?: (documentId: string) => Promise<void>;
  onShareSuccess?: (response: ShareResponse) => void;
}

interface ShareData {
  documentId: string;
  email?: string;
  countryCode?: string;
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

const ShareSidebar: React.FC<ShareSidebarProps> = ({
  isOpen,
  onDismiss,
  document,
  onShare,
  onCloseDocument,
  onShareSuccess,
}) => {
  const [email, setEmail] = useState("");
  const [phoneValue, setPhoneValue] = useState<string | undefined>("");
  const [countryCode, setCountryCode] = useState(""); // e.g., "US", "IN"
  const [mobile, setMobile] = useState(""); // e.g., "9530654704" (without country code)
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [shareResponse, setShareResponse] = useState<ShareResponse | null>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateMobile = (mobile: string): boolean => {
    return mobile && mobile.length > 0;
  };

  const handlePhoneChange = (value: string | undefined) => {
    setPhoneValue(value || "");

    if (value) {
      const phoneNumber = parsePhoneNumber(value);
      if (phoneNumber) {
        setCountryCode(phoneNumber.countryCallingCode || "");
        setMobile(phoneNumber.nationalNumber || "");
      } else {
        setCountryCode("");
        setMobile("");
      }
    } else {
      setCountryCode("");
      setMobile("");
    }
  };

  const handleShare = async () => {
    if (!document) return;

    setError("");
    setSuccess("");

    if (!email && !mobile) {
      setError("Please enter either an email address or mobile number.");
      return;
    }

    if (email && !validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (mobile && !validateMobile(mobile)) {
      setError("Please enter a valid mobile number.");
      return;
    }

    if (mobile && !countryCode) {
      setError("Please select a valid country code.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const shareData: ShareData = {
        documentId: document.id,
        ...(email && { email }),
        ...(mobile && countryCode && { countryCode, mobile }),
        ...(message && { message }),
      };

      const response = await onShare(shareData);
      const enrichedResponse = {
        ...response,
        recipientEmail: email || undefined,
        recipientMobile: mobile ? `${countryCode}${mobile}` : undefined,
        customMessage: message || undefined,
      };
      setShareResponse(enrichedResponse);
      setSuccess("Document shared successfully!");

      // Notify parent component of successful share
      if (onShareSuccess) {
        onShareSuccess(enrichedResponse);
      }

      // Close sidebar after short delay to show success message
      setTimeout(() => {
        onDismiss();
        // Reset form after sidebar closes
        setTimeout(() => {
          setEmail("");
          setPhoneValue("");
          setCountryCode("");
          setMobile("");
          setMessage("");
          setSuccess("");
          setShareResponse(null);
        }, 300);
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to share document. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setEmail("");
    setPhoneValue("");
    setCountryCode("");
    setMobile("");
    setMessage("");
    setError("");
    setSuccess("");
    setShareResponse(null);
    onDismiss();
  };

  const handleCloseDocument = async () => {
    if (!document || !onCloseDocument) return;

    try {
      await onCloseDocument(document.id);
      setSuccess("Document closed successfully!");
      setTimeout(() => {
        onDismiss();
      }, 1500);
    } catch (err) {
      setError("Failed to close document. Please try again.");
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
        return <FileText size={20} color="#dc3545" />;
      case "doc":
      case "docx":
        return <FileText size={20} color="#0d6efd" />;
      case "xls":
      case "xlsx":
        return <FileText size={20} color="#198754" />;
      case "ppt":
      case "pptx":
        return <FileText size={20} color="#fd7e14" />;
      default:
        return <FileText size={20} color="#6c757d" />;
    }
  };

  return (
    <Panel
      isOpen={isOpen}
      onDismiss={handleDismiss}
      type={PanelType.custom}
      customWidth="85%"
      headerText="Share Document"
      closeButtonAriaLabel="Close"
      onRenderHeader={() => (
        <div className="panel-header-content">
          <h2 className="panel-header-title">Share Document</h2>
          <button
            className="panel-close-btn"
            onClick={handleDismiss}
            aria-label="Close share sidebar"
          >
            <X size={18} />
          </button>
        </div>
      )}
    >
      {document && (
        <div className="share-sidebar-content">
          {/* Document Info Card */}
          <div className="document-info-card">
            <div className="document-icon-wrapper">{getDocumentIcon(document.type)}</div>
            <div className="document-details">
              <h3 className="document-title">{document.title}</h3>
              <div className="document-meta">
                <span className="document-type-badge">{document.type.toUpperCase()}</span>
                <span className="document-separator">•</span>
                <span className="document-size">{document.size}</span>
                <span className="document-separator">•</span>
                <span className="document-date">
                  <Calendar size={12} />
                  {document.dateModified}
                </span>
              </div>
            </div>
          </div>

          {/* Share Form */}
          <div className="share-form">
            <h4 className="share-section-title">Share with:</h4>

            <div className="form-group">
              <Label className="form-label">Email Address</Label>
              <div className="input-wrapper">
                <Mail size={16} className="input-icon" />
                <TextField
                  placeholder="Enter email address"
                  value={email}
                  onChange={(_, value) => setEmail(value || "")}
                  disabled={isLoading}
                  styles={{
                    field: { paddingLeft: "44px" },
                    fieldGroup: { border: "none" }
                  }}
                  className="share-textfield"
                />
              </div>
            </div>

            <div className="divider">
              <span className="divider-text">OR</span>
            </div>

            <div className="form-group">
              <Label className="form-label">Mobile Number</Label>
              <PhoneInput
                placeholder="Enter mobile number"
                value={phoneValue}
                onChange={handlePhoneChange}
                defaultCountry="US"
                disabled={isLoading}
                className="phone-input-field"
              />
            </div>

            <div className="form-group">
              <Label className="form-label">Message (Optional)</Label>
              <TextField
                placeholder="Add a personal message..."
                value={message}
                onChange={(_, value) => setMessage(value || "")}
                multiline
                rows={3}
                disabled={isLoading}
                styles={{
                  field: { padding: "10px" },
                  fieldGroup: { border: "none" }
                }}
                className="share-textfield-multiline"
              />
            </div>
          </div>

          {/* Messages */}
          {error && (
            <MessageBar
              messageBarType={MessageBarType.error}
              onDismiss={() => setError("")}
              styles={{
                root: {
                  marginBottom: success ? "8px" : "0",
                  borderRadius: "6px",
                },
              }}
            >
              {error}
            </MessageBar>
          )}

          {success && (
            <MessageBar
              messageBarType={MessageBarType.success}
              onDismiss={() => setSuccess("")}
              styles={{
                root: {
                  marginBottom: "0",
                  borderRadius: "6px",
                },
              }}
            >
              {success}
            </MessageBar>
          )}

          {/* Action Buttons */}
          <div className="action-buttons">
            <PrimaryButton
              onClick={handleShare}
              disabled={isLoading || (!email && !mobile)}
              className="share-submit-btn"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="spinning" />
                  <span>Sharing...</span>
                </>
              ) : (
                <>
                  <Share size={16} />
                  <span>Share Document</span>
                </>
              )}
            </PrimaryButton>
            <DefaultButton
              text="Cancel"
              onClick={handleDismiss}
              disabled={isLoading}
              className="share-cancel-btn"
            />
          </div>
        </div>
      )}
    </Panel>
  );
};

export default ShareSidebar;
