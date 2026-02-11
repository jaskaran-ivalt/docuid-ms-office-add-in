import React, { useState } from "react";
import { PrimaryButton, Spinner, Stack, TextField, Text } from "@fluentui/react";
import { Shield } from "lucide-react";
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
            padding: "32px",
            border: "1px solid #edebe9",
          },
        }}
      >
        {/* Header Section */}
        <Stack horizontalAlign="center" tokens={{ childrenGap: 12 }}>
          <img
            src="assets/logo-transparent-bg.png"
            alt="DocuID Logo"
            style={{ width: "140px", objectFit: "contain" }}
          />
          <Text variant="xLarge" styles={{ root: { fontWeight: 600 } }}>
            DocuID™ Security Platform
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
              <Text variant="medium" styles={{ root: { fontWeight: 600, marginBottom: 8 } }}>
                Mobile Number
              </Text>
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

        {/* Secure Process Section */}
        <Stack
          tokens={{ childrenGap: 8 }}
          styles={{
            root: { padding: 16, backgroundColor: "#faf9f8", border: "1px solid #edebe9" },
          }}
        >
          <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
            <Shield size={18} />
            <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>
              Secure Process:
            </Text>
          </Stack>
          <Stack
            as="ol"
            tokens={{ childrenGap: 4 }}
            styles={{ root: { paddingLeft: 20, margin: 0 } }}
          >
            <Text as="li" variant="small">
              Enter your iVALT registered mobile number
            </Text>
            <Text as="li" variant="small">
              Complete biometric verification on your device
            </Text>
            <Text as="li" variant="small">
              Access your documents securely
            </Text>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default LoginForm;
