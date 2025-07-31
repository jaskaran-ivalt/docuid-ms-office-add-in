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
import { Share24Regular, Mail24Regular, Phone24Regular } from "@fluentui/react-icons";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

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
}

interface ShareData {
  documentId: string;
  email?: string;
  mobile?: string;
  message?: string;
}

const ShareSidebar: React.FC<ShareSidebarProps> = ({ isOpen, onDismiss, document, onShare }) => {
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateMobile = (mobile: string): boolean => {
    // react-phone-number-input already validates and formats the number
    return mobile && mobile.length > 0;
  };

  const handleShare = async () => {
    if (!document) return;

    setError("");
    setSuccess("");

    // Validation
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

    setIsLoading(true);

    try {
      const shareData: ShareData = {
        documentId: document.id,
        ...(email && { email }),
        ...(mobile && { mobile }),
        ...(message && { message }),
      };

      await onShare(shareData);
      setSuccess("Document shared successfully!");
      
      // Reset form after successful share
      setTimeout(() => {
        setEmail("");
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
    setMobile("");
    setMessage("");
    setError("");
    setSuccess("");
    onDismiss();
  };

  return (
    <Panel
      isOpen={isOpen}
      onDismiss={handleDismiss}
      type={PanelType.medium}
      headerText="Share Document"
      closeButtonAriaLabel="Close"
    >
      {document && (
        <Stack tokens={{ childrenGap: 20 }}>
          {/* Document Info */}
          <Stack
            horizontal
            verticalAlign="center"
            tokens={{ childrenGap: 12 }}
            style={{
              padding: 16,
              backgroundColor: "#f8f9fa",
              borderRadius: 6,
              border: "1px solid #e1e5e9",
            }}
          >
            <Share24Regular style={{ fontSize: 24, color: "#0078d4" }} />
            <Stack>
              <h3 style={{ margin: 0, fontSize: 16 }}>{document.title}</h3>
              <span style={{ fontSize: 14, color: "#666" }}>
                {document.type.toUpperCase()} • {document.size}
              </span>
            </Stack>
          </Stack>

          {/* Share Form */}
          <Stack tokens={{ childrenGap: 16 }}>
            <h4 style={{ margin: 0 }}>Share with:</h4>

            <TextField
              label="Email Address"
              placeholder="Enter email address"
              value={email}
              onChange={(_, value) => setEmail(value || "")}
              iconProps={{ iconName: undefined }}
              prefix={<Mail24Regular style={{ fontSize: 16 }} />}
              disabled={isLoading}
            />

            <div style={{ textAlign: "center", color: "#666", fontSize: 14 }}>OR</div>

            <Stack tokens={{ childrenGap: 4 }}>
              <Label>Mobile Number</Label>
              <div style={{ position: "relative" }}>
                <PhoneInput
                  placeholder="Enter mobile number"
                  value={mobile}
                  onChange={(value) => setMobile(value || "")}
                  defaultCountry="US"
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d1d1",
                    borderRadius: "2px",
                    fontSize: "14px",
                    fontFamily: "Segoe UI, sans-serif",
                  }}
                />
              </div>
            </Stack>

            <TextField
              label="Message (Optional)"
              placeholder="Add a message..."
              value={message}
              onChange={(_, value) => setMessage(value || "")}
              multiline
              rows={3}
              disabled={isLoading}
            />
          </Stack>

          {/* Messages */}
          {error && (
            <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError("")}>
              {error}
            </MessageBar>
          )}

          {success && (
            <MessageBar messageBarType={MessageBarType.success} onDismiss={() => setSuccess("")}>
              {success}
            </MessageBar>
          )}

          {/* Actions */}
          <Stack horizontal tokens={{ childrenGap: 12 }} style={{ marginTop: 20 }}>
            <PrimaryButton
              text={isLoading ? "Sharing..." : "Share"}
              onClick={handleShare}
              disabled={isLoading || (!email && !mobile)}
              iconProps={isLoading ? undefined : { iconName: undefined }}
            >
              {isLoading && <Spinner size={1} style={{ marginRight: 8 }} />}
            </PrimaryButton>
            <DefaultButton text="Cancel" onClick={handleDismiss} disabled={isLoading} />
          </Stack>
        </Stack>
      )}
    </Panel>
  );
};

export default ShareSidebar;