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
import { Share, Mail, Phone, FileText, Calendar, HardDrive, X } from "lucide-react";
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
  onShare: (shareData: ShareData) => Promise<void>;
  onCloseDocument?: (documentId: string) => Promise<void>;
}

interface ShareData {
  documentId: string;
  email?: string;
  countryCode?: string;
  mobile?: string;
  message?: string;
}

const ShareSidebar: React.FC<ShareSidebarProps> = ({
  isOpen,
  onDismiss,
  document,
  onShare,
  onCloseDocument,
}) => {
  const [email, setEmail] = useState("");
  const [phoneValue, setPhoneValue] = useState<string | undefined>("");
  const [countryCode, setCountryCode] = useState(""); // e.g., "US", "IN"
  const [mobile, setMobile] = useState(""); // e.g., "9530654704" (without country code)
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

    try {
      const shareData: ShareData = {
        documentId: document.id,
        ...(email && { email }),
        ...(mobile && countryCode && { countryCode, mobile }),
        ...(message && { message }),
      };

      await onShare(shareData);
      setSuccess("Document shared successfully!");

      setTimeout(() => {
        setEmail("");
        setPhoneValue("");
        setCountryCode("");
        setMobile("");
        setMessage("");
        setSuccess("");
        onDismiss();
      }, 2000);
    } catch (err) {
      setError("Failed to share document. Please try again.");
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
      type={PanelType.medium}
      headerText="Share Document"
      closeButtonAriaLabel="Close"
      onRenderHeader={() => (
        <div className="panel-header-content flex justify-between items-center px-2 py-4">
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
      styles={{
        main: {
          backgroundColor: "#f8f9fa",
        },
        content: {
          padding: "24px",
        },
        header: {
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e9ecef",
          padding: "20px 24px",
        },
        headerText: {
          fontSize: "20px",
          fontWeight: "600",
          color: "#323130",
        },
      }}
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
            {/* {onCloseDocument && (
               <button 
                 className="close-document-btn"
                 onClick={handleCloseDocument}
                 title="Close this document"
               >
                 <X size={16} />
                 <span>Close</span>
               </button>
             )} */}
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
                    field: {
                      paddingLeft: "40px",
                      fontSize: "14px",
                      border: "1px solid #d1d1d1",
                      borderRadius: "6px",
                      height: "40px",
                    },
                    fieldGroup: {
                      border: "none",
                    },
                  }}
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
                  field: {
                    fontSize: "14px",
                    border: "1px solid #d1d1d1",
                    borderRadius: "6px",
                    padding: "12px",
                    resize: "none",
                  },
                  fieldGroup: {
                    border: "none",
                  },
                }}
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
                  marginBottom: "16px",
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
                  marginBottom: "16px",
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
              text={isLoading ? "Sharing..." : "Share Document"}
              onClick={handleShare}
              disabled={isLoading || (!email && !mobile)}
              iconProps={isLoading ? undefined : { iconName: undefined }}
              styles={{
                root: {
                  height: "44px",
                  fontSize: "14px",
                  fontWeight: "600",
                  borderRadius: "6px",
                  border: "none",
                  background:
                    (!email && !mobile) || isLoading
                      ? "#f3f2f1"
                      : "linear-gradient(135deg, #0078d4 0%, #106ebe 100%)",
                  color: (!email && !mobile) || isLoading ? "#605e5c" : "white",
                  cursor: (!email && !mobile) || isLoading ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  flex: 1,
                },
                rootHovered: {
                  background:
                    (!email && !mobile) || isLoading
                      ? "#f3f2f1"
                      : "linear-gradient(135deg, #106ebe 0%, #005a9e 100%)",
                  transform: (!email && !mobile) || isLoading ? "none" : "translateY(-1px)",
                  boxShadow:
                    (!email && !mobile) || isLoading ? "none" : "0 4px 12px rgba(0, 120, 212, 0.3)",
                },
                rootPressed: {
                  transform: "translateY(0)",
                },
              }}
            >
              {isLoading && <Spinner size={1} style={{ marginRight: 8 }} />}
            </PrimaryButton>
            <DefaultButton
              text="Cancel"
              onClick={handleDismiss}
              disabled={isLoading}
              styles={{
                root: {
                  height: "44px",
                  fontSize: "14px",
                  fontWeight: "500",
                  borderRadius: "6px",
                  border: "1px solid #d1d1d1",
                  background: "white",
                  color: "#323130",
                  transition: "all 0.2s ease",
                  minWidth: "80px",
                },
                rootHovered: {
                  background: "#f8f9fa",
                  borderColor: "#0078d4",
                  color: "#0078d4",
                  transform: "translateY(-1px)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                },
                rootPressed: {
                  transform: "translateY(0)",
                },
              }}
            />
          </div>
        </div>
      )}
    </Panel>
  );
};

export default ShareSidebar;
