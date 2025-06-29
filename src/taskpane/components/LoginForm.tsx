import React, { useState } from "react";

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

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Welcome to DocuID</h2>
          <p>Secure access to your documents using biometric authentication</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="phone">Mobile Number</label>
            <div className="phone-input-group">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="country-select"
                disabled={isLoading}
              >
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+91">🇮🇳 +91</option>
                <option value="+49">🇩🇪 +49</option>
              </select>
              <input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter your mobile number"
                className="phone-input"
                disabled={isLoading}
                maxLength={15}
              />
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={!isValidPhone || isLoading}>
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Authenticating...
              </>
            ) : (
              <>🔐 Login with Biometrics</>
            )}
          </button>
        </form>

        <div className="login-info">
          <p>
            <strong>🛡️ Secure Process:</strong>
            <br />
            1. Enter your registered mobile number
            <br />
            2. Complete biometric verification on your device
            <br />
            3. Access your documents securely
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
