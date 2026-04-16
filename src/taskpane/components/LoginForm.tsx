import React, { useState } from "react";
import {
  PrimaryButton,
  Spinner,
  Stack,
  TextField,
  Text,
  IconButton,
  Callout,
  DirectionalHint,
} from "@fluentui/react";
import { Info } from "lucide-react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "./LoginForm.css";
import AppDownloadButtons from "./AppDownloadButtons";

interface LoginFormProps {
  onLogin: (phoneNumber: string) => Promise<void>;
  isLoading: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, isLoading }) => {
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isInfoPopupOpen, setIsInfoPopupOpen] = useState(false);
  const infoButtonRef = React.useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber && phoneNumber.length >= 10) {
      await onLogin(phoneNumber);
    }
  };

  const isValidPhone = phoneNumber && phoneNumber.length >= 10;

  return (
    <Stack
      tokens={{ padding: 24, childrenGap: 24 }}
      styles={{ root: { justifyContent: "center", backgroundColor: "#f5f5f5" } }}
    >
      <Stack
        tokens={{ childrenGap: 16 }}
        styles={{
          root: {
            maxWidth: 400,
            margin: "0 auto",
            width: "100%",
            backgroundColor: "white",
            padding: "30px 15px",
            border: "1px solid #edebe9",
          },
        }}
      >
        {/* Header Section */}
        <Stack horizontalAlign="center" tokens={{ childrenGap: 12 }}>
          <img
            src="assets/logo-transparent-bg.png"
            alt="iVALT Docuid"
            style={{ width: "100px", objectFit: "contain" }}
          />
          <Text variant="medium" styles={{ root: { fontWeight: 600, color: "#323130" } }}>
            Security Platform
          </Text>
          <Text variant="medium" styles={{ root: { textAlign: "center", color: "#605e5c" } }}>
            Secure your digital assets with our advanced file identity and verification system
            powered by iVALT technology
          </Text>
        </Stack>

        {/* Form Section */}
        <form onSubmit={handleSubmit}>
          <Stack tokens={{ childrenGap: 16 }}>
            <Stack.Item>
              <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
                <Text variant="medium" styles={{ root: { fontWeight: 600, marginBottom: 8 } }}>
                  Mobile Number
                </Text>
                <div ref={infoButtonRef}>
                  <IconButton
                    onClick={() => setIsInfoPopupOpen(!isInfoPopupOpen)}
                    styles={{
                      root: {
                        width: 24,
                        height: 24,
                        marginBottom: 8,
                        borderRadius: "50%",
                        backgroundColor: "#e8f4fd",
                        color: "#0078d4",
                        border: "1px solid #b3e5fc",
                      },
                      rootHovered: {
                        backgroundColor: "#b3e5fc",
                      },
                    }}
                  >
                    <Info size={14} />
                  </IconButton>
                </div>
              </Stack>
              {isInfoPopupOpen && (
                <Callout
                  target={infoButtonRef.current}
                  onDismiss={() => setIsInfoPopupOpen(false)}
                  directionalHint={DirectionalHint.bottomLeftEdge}
                  styles={{
                    root: {
                      maxWidth: 320,
                    },
                  }}
                >
                  <Stack
                    tokens={{ padding: 16, childrenGap: 8 }}
                    styles={{
                      root: {
                        backgroundColor: "white",
                        border: "1px solid #edebe9",
                        borderRadius: 4,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      },
                    }}
                  >
                    <Text variant="medium" styles={{ root: { fontWeight: 600, color: "#323130" } }}>
                      How to get started:
                    </Text>
                    <Stack
                      as="ol"
                      tokens={{ childrenGap: 4 }}
                      styles={{ root: { paddingLeft: 20, margin: 0, color: "#605e5c" } }}
                    >
                      <Text as="li" variant="small">
                        Download the iVALT app from the links below
                      </Text>
                      <Text as="li" variant="small">
                        Register your mobile number in the app
                      </Text>
                      <Text as="li" variant="small">
                        Enter the same mobile number here to login
                      </Text>
                      <Text as="li" variant="small">
                        Complete biometric verification on your phone
                      </Text>
                    </Stack>
                  </Stack>
                </Callout>
              )}
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
            </Stack.Item>

            <PrimaryButton
              type="submit"
              disabled={!isValidPhone || isLoading}
              text={isLoading ? "Authenticating..." : "Login with Biometrics"}
              styles={{
                root: {
                  height: 40,
                  borderRadius: 4,
                },
              }}
            >
              {isLoading && <Spinner size={1} />}
            </PrimaryButton>
          </Stack>
        </form>

        {/* Account Links Section */}
        <AppDownloadButtons />
      </Stack>
    </Stack>
  );
};

export default LoginForm;
