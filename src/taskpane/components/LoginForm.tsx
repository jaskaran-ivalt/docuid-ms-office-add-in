import React, { useState } from "react";
import {
  PrimaryButton,
  Spinner,
  Stack,
} from "@fluentui/react";
import { Lock, Shield } from "lucide-react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

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
            <PhoneInput
              id="phone"
              international
              defaultCountry="IN"
              value={phoneNumber}
              onChange={(value) => setPhoneNumber(value || "")}
              placeholder="Enter your mobile number"
              disabled={isLoading}
            />
            <PrimaryButton
              type="submit"
              disabled={!isValidPhone || isLoading}
              text={isLoading ? "Authenticating..." : "Login with Biometrics"}
              iconProps={{ iconName: undefined }}
              style={{ width: "100%" }}
            >
              {isLoading ? <Spinner size={1} /> : <Lock size={16} />}
            </PrimaryButton>
          </Stack>
        </form>
        <Stack tokens={{ childrenGap: 8 }}>
          <p>
            <strong>
              <Shield size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Secure Process:
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
