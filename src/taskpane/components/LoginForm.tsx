import React, { useState } from "react";
import {
  TextField,
  PrimaryButton,
  Spinner,
  Dropdown,
  IDropdownOption,
  Stack,
} from "@fluentui/react";
import { LockClosed24Regular, ShieldLock24Regular } from "@fluentui/react-icons";

interface LoginFormProps {
  onLogin: (phoneNumber: string) => Promise<void>;
  isLoading: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, isLoading }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+1");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.trim()) {
      await onLogin(`${countryCode}${phoneNumber}`);
    }
  };

  const isValidPhone = phoneNumber.length >= 10;

  const countryOptions: IDropdownOption[] = [
    { key: "+1", text: "🇺🇸 +1" },
    { key: "+44", text: "🇬🇧 +44" },
    { key: "+91", text: "🇮🇳 +91" },
    { key: "+49", text: "🇩🇪 +49" },
  ];

  return (
    <Stack verticalAlign="center" horizontalAlign="center" style={{ minHeight: 400 }}>
      <Stack
        tokens={{ childrenGap: 24 }}
        style={{ width: 340, padding: 32, boxShadow: "0 2px 8px #eee", borderRadius: 8 }}
      >
        <Stack tokens={{ childrenGap: 8 }}>
          <h2>Welcome to DocuID</h2>
          <p>Secure access to your documents using biometric authentication</p>
        </Stack>
        <form onSubmit={handleSubmit}>
          <Stack tokens={{ childrenGap: 12 }}>
            <label htmlFor="phone">Mobile Number</label>
            <Stack horizontal tokens={{ childrenGap: 8 }}>
              <Dropdown
                options={countryOptions}
                selectedKey={countryCode}
                onChange={(_, o) => setCountryCode(o?.key as string)}
                disabled={isLoading}
                styles={{ dropdown: { width: 90 } }}
              />
              <TextField
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(_, v) => setPhoneNumber((v || "").replace(/\D/g, ""))}
                placeholder="Enter your mobile number"
                disabled={isLoading}
                maxLength={15}
                styles={{ root: { flexGrow: 1 } }}
              />
            </Stack>
            <PrimaryButton
              type="submit"
              disabled={!isValidPhone || isLoading}
              text={isLoading ? "Authenticating..." : "Login with Biometrics"}
              iconProps={{ iconName: undefined }}
              style={{ width: "100%" }}
            >
              {isLoading ? <Spinner size={1} /> : <LockClosed24Regular />}
            </PrimaryButton>
          </Stack>
        </form>
        <Stack tokens={{ childrenGap: 8 }}>
          <p>
            <strong>
              <ShieldLock24Regular /> Secure Process:
            </strong>
            <br />
            1. Enter your registered mobile number
            <br />
            2. Complete biometric verification on your device
            <br />
            3. Access your documents securely
          </p>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default LoginForm;
