import React from "react";
import {
  Dialog,
  DialogType,
  PrimaryButton,
  Stack,
  Text,
} from "@fluentui/react";
import { CheckCircle, Copy, ExternalLink, FileText, Mail, Phone, Calendar } from "lucide-react";
import "./ShareSuccessModal.css";

interface ShareSuccessModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  document: {
    title: string;
    type: string;
    size: string;
    dateModified: string;
  } | null;
  shareDetails: {
    shareLink?: string;
    recipientEmail?: string;
    recipientMobile?: string;
    message?: string;
    expiryDate?: string;
  } | null;
}

const ShareSuccessModal: React.FC<ShareSuccessModalProps> = ({
  isOpen,
  onDismiss,
  document,
  shareDetails,
}) => {
  // Calculate expiry date (7 days from now, as per API default)
  const getExpiryDate = (): string => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    return expiryDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleCopyLink = () => {
    if (shareDetails?.shareLink) {
      navigator.clipboard.writeText(shareDetails.shareLink);
    }
  };

  const handleOpenLink = () => {
    if (shareDetails?.shareLink) {
      window.open(shareDetails.shareLink, "_blank");
    }
  };

  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={onDismiss}
      dialogContentProps={{
        type: DialogType.normal,
        title: "",
        showCloseButton: true,
        styles: {
          title: {
            display: "none",
          },
        },
      }}
      modalProps={{
        isBlocking: false,
        styles: {
          main: {
            maxWidth: "520px",
          },
        },
      }}
    >
      <div className="share-success-modal">
        {/* Success Icon */}
        <div className="success-icon-wrapper">
          <CheckCircle size={48} className="success-icon" />
        </div>

        {/* Success Title */}
        <Text className="success-title">Document Shared Successfully!</Text>
        <Text className="success-subtitle">
          Your document has been shared with the recipient.
        </Text>

        {/* Document Details */}
        {document && (
          <div className="document-details-section">
            <div className="section-header">
              <FileText size={18} />
              <Text className="section-title">Document Details</Text>
            </div>
            <div className="details-grid">
              <div className="detail-item">
                <Text className="detail-label">Document Name</Text>
                <Text className="detail-value">{document.title}</Text>
              </div>
              <div className="detail-item">
                <Text className="detail-label">File Type</Text>
                <Text className="detail-value">{document.type.toUpperCase()}</Text>
              </div>
              <div className="detail-item">
                <Text className="detail-label">File Size</Text>
                <Text className="detail-value">{document.size}</Text>
              </div>
              <div className="detail-item">
                <Text className="detail-label">Last Modified</Text>
                <Text className="detail-value">{document.dateModified}</Text>
              </div>
            </div>
          </div>
        )}

        {/* Share Details */}
        {shareDetails && (
          <div className="share-details-section">
            <div className="section-header">
              <CheckCircle size={18} />
              <Text className="section-title">Share Information</Text>
            </div>
            <div className="details-grid">
              {shareDetails.recipientEmail && (
                <div className="detail-item">
                  <Mail size={16} className="detail-icon" />
                  <div className="detail-content">
                    <Text className="detail-label">Recipient Email</Text>
                    <Text className="detail-value">{shareDetails.recipientEmail}</Text>
                  </div>
                </div>
              )}
              {shareDetails.recipientMobile && (
                <div className="detail-item">
                  <Phone size={16} className="detail-icon" />
                  <div className="detail-content">
                    <Text className="detail-label">Recipient Mobile</Text>
                    <Text className="detail-value">+{shareDetails.recipientMobile}</Text>
                  </div>
                </div>
              )}
              <div className="detail-item">
                <Calendar size={16} className="detail-icon" />
                <div className="detail-content">
                  <Text className="detail-label">Expires On</Text>
                  <Text className="detail-value">
                    {shareDetails.expiryDate || getExpiryDate()}
                  </Text>
                </div>
              </div>
              {shareDetails.message && (
                <div className="detail-item full-width">
                  <div className="detail-content">
                    <Text className="detail-label">Personal Message</Text>
                    <Text className="detail-value message-text">{shareDetails.message}</Text>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Share Link */}
        {shareDetails?.shareLink && (
          <div className="share-link-section">
            <Text className="share-link-label">Share Link</Text>
            <div className="share-link-container">
              <Text className="share-link-text" title={shareDetails.shareLink}>
                {shareDetails.shareLink}
              </Text>
              <Stack horizontal tokens={{ childrenGap: 8 }}>
                <button
                  className="share-link-button"
                  onClick={handleCopyLink}
                >
                  <Copy size={14} />
                  <span>Copy</span>
                </button>
                <button
                  className="share-link-button"
                  onClick={handleOpenLink}
                >
                  <ExternalLink size={14} />
                  <span>Open</span>
                </button>
              </Stack>
            </div>
          </div>
        )}

        {/* Action Button */}
        <Stack horizontal horizontalAlign="center" style={{ marginTop: 24 }}>
          <PrimaryButton
            text="Done"
            onClick={onDismiss}
            styles={{
              root: {
                minWidth: "120px",
                height: "40px",
              },
            }}
          />
        </Stack>
      </div>
    </Dialog>
  );
};

export default ShareSuccessModal;
