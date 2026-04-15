import React, { useState } from "react";
import { PrimaryButton, Spinner, Stack, TextField, Text } from "@fluentui/react";
import { Shield, Apple, Play } from "lucide-react";
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
        <Stack horizontalAlign="center" tokens={{ childrenGap: 8 }}>
          <img
            src="assets/logo-transparent-bg.png"
            alt="iVALT Docuid"
            style={{ width: "100px", objectFit: "contain" }}
          />
          <Text variant="xLarge" styles={{ root: { fontWeight: 600 } }}>
            iVALT Docuid
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

        {/* Account Links Section */}
        <Stack
          horizontalAlign="center"
          tokens={{ childrenGap: 12 }}
          styles={{ root: { padding: "16px 0" } }}
        >
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://play.google.com/store/apps/details?id=com.abisyscorp.ivalt&hl=en_IN&pli=1"
            style={{
              display: "inline-flex",
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              borderRadius: "20px",
              border: "none",
              backgroundColor: "#16a34a",
              padding: "12px 24px",
              fontSize: "16px",
              fontWeight: 500,
              color: "white",
              textDecoration: "none",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#15803d";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#16a34a";
            }}
          >
            <svg fill="#fff" viewBox="0 0 1920 1920" style={{ height: "40px", width: "40px" }} xmlns="http://www.w3.org/2000/svg">
              <path d="M1306.086 25.225c17.167-25.976 52.29-33.091 78.267-15.698 25.976 17.28 32.978 52.29 15.698 78.266l-85.72 128.637c29.25 18.861 57.372 39.416 83.122 62.907 118.473 108.648 183.752 253.435 183.752 407.71v734.102c0 88.318-76.008 160.034-169.408 160.034h-169.409V1920H1129.45v-338.817H790.633V1920H677.694v-338.817H508.286c-93.4 0-169.408-71.716-169.408-160.034V709.296c0-200.58 107.292-380.266 269.246-488.913L519.58 87.906c-17.393-25.976-10.39-60.987 15.472-78.38 25.863-17.28 60.987-10.277 78.38 15.586l94.304 141.06c59.858-25.862 123.78-44.61 191.883-50.596 109.325-9.6 216.956 7.906 314.083 48.112ZM225.939 734.142v564.694H113V734.142h112.939Zm1581.144 0v564.694h-112.94V734.142h112.94Zm-621.164-282.347c-62.23 0-112.939 50.71-112.939 112.939 0 62.23 50.71 112.939 112.939 112.939 62.23 0 112.939-50.71 112.939-112.94 0-62.228-50.71-112.938-112.939-112.938Zm-451.755 0c-62.23 0-112.94 50.71-112.94 112.939 0 62.23 50.71 112.939 112.94 112.939 62.229 0 112.938-50.71 112.938-112.94 0-62.228-50.71-112.938-112.938-112.938Z" fillRule="evenodd"></path>
            </svg>
            <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center" }}>
              <span style={{ fontWeight: "bold" }}>Android</span>
              <p style={{ fontSize: "14px", fontWeight: 300, margin: 0 }}>Get it on Google Play</p>
            </span>
          </a>

          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://apps.apple.com/in/app/ivalt/id1507945806"
            style={{
              display: "inline-flex",
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              borderRadius: "20px",
              border: "none",
              backgroundColor: "#1f2937",
              padding: "12px 24px",
              fontSize: "16px",
              fontWeight: 500,
              color: "white",
              textDecoration: "none",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#374151";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#1f2937";
            }}
          >
            <svg fill="#fff" style={{ height: "40px", width: "40px" }} version="1.1" viewBox="0 0 22.773 22.773" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.769,0c0.053,0,0.106,0,0.162,0c0.13,1.606-0.483,2.806-1.228,3.675c-0.731,0.863-1.732,1.7-3.351,1.573 c-0.108-1.583,0.506-2.694,1.25-3.561C13.292,0.879,14.557,0.16,15.769,0z"></path>
              <path d="M20.67,16.716c0,0.016,0,0.03,0,0.045c-0.455,1.378-1.104,2.559-1.896,3.655c-0.723,0.995-1.609,2.334-3.191,2.334 c-1.367,0-2.275-0.879-3.676-0.903c-1.482-0.024-2.297,0.735-3.652,0.926c-0.155,0-0.31,0-0.462,0 c-0.995-0.144-1.798-0.932-2.383-1.642c-1.725-2.098-3.058-4.808-3.306-8.276c0-0.34,0-0.679,0-1.019 c0.105-2.482,1.311-4.5,2.914-5.478c0.846-0.52,2.009-0.963,3.304-0.765c0.555,0.086,1.122,0.276,1.619,0.464 c0.471,0.181,1.06,0.502,1.618,0.485c0.378-0.011,0.754-0.208,1.135-0.347c1.116-0.403,2.21-0.865,3.652-0.648 c1.733,0.262,2.963,1.032,3.723,2.22c-1.466,0.933-2.625,2.339-2.427,4.74C17.818,14.688,19.086,15.964,20.67,16.716z"></path>
            </svg>
            <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center" }}>
              <span style={{ fontWeight: "bold" }}>iOS</span>
              <p style={{ fontSize: "14px", fontWeight: 300, margin: 0 }}>Get it on the App Store</p>
            </span>
          </a>

          <Text variant="small" styles={{ root: { color: "#605e5c", textAlign: "center" } }}>
            Register in the app, then login here
          </Text>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default LoginForm;
