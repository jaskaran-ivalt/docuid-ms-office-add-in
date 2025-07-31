import React, { useState } from "react";
import {
  PrimaryButton,
  Spinner,
  Stack,
} from "@fluentui/react";
import { Lock, Shield } from "lucide-react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "./LoginForm.css";

interface LoginFormProps {
  onLogin: (phoneNumber: string) => Promise<void>;
  isLoading: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, isLoading }) => {
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber && phoneNumber.length >= 10) {
      await onLogin(phoneNumber);
    }
  };

  const isValidPhone = phoneNumber && phoneNumber.length >= 10;

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Header Section */}
        <div className="login-header">
          <h1 className="login-title">Welcome to DocuID</h1>
          <p className="login-subtitle">
            Secure access to your documents using biometric authentication
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              Mobile Number
            </label>
            <PhoneInput
              id="phone"
              international
              defaultCountry="IN"
              value={phoneNumber}
              onChange={(value) => setPhoneNumber(value || "")}
              placeholder="Enter your mobile number"
              disabled={isLoading}
              className="phone-input-field"
            />
          </div>

          <PrimaryButton
            type="submit"
            disabled={!isValidPhone || isLoading}
            text={isLoading ? "Authenticating..." : "Login with Biometrics"}
            iconProps={{ iconName: undefined }}
            className="login-button"
            style={{
              width: "100%",
              height: "48px",
              fontSize: "16px",
              fontWeight: "500",
              borderRadius: "6px",
              border: "none",
              background: isValidPhone && !isLoading 
                ? "linear-gradient(135deg, #0078d4 0%, #106ebe 100%)" 
                : "#f3f2f1",
              color: isValidPhone && !isLoading ? "white" : "#605e5c",
              cursor: isValidPhone && !isLoading ? "pointer" : "not-allowed",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginTop: "8px"
            }}
            onMouseEnter={(e) => {
              if (isValidPhone && !isLoading) {
                const target = e.currentTarget as HTMLElement;
                target.style.transform = "translateY(-1px)";
                target.style.boxShadow = "0 4px 12px rgba(0, 120, 212, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.transform = "translateY(0)";
              target.style.boxShadow = "none";
            }}
          >
            {isLoading ? (
              <Spinner size={1} />
            ) : (
              <Lock size={18} style={{ marginRight: "4px" }} />
            )}
          </PrimaryButton>
        </form>

        {/* Secure Process Section */}
        <div className="secure-process">
          <div className="secure-process-header">
            <Shield size={18} className="shield-icon" />
            <h3 className="secure-process-title">Secure Process:</h3>
          </div>
          <ol className="secure-process-steps">
            <li>Enter your registered mobile number</li>
            <li>Complete biometric verification on your device</li>
            <li>Access your documents securely</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
