import React from "react";
import { DefaultButton, Stack } from "@fluentui/react";
import { Phone24Regular } from "@fluentui/react-icons";

interface HeaderProps {
  user: { phone: string } | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <div className="header">
      <div className="header-content">
        <div className="header-brand">
          <h1 className="brand-title">DocuID</h1>
          <span className="brand-subtitle">Secure Document Access</span>
        </div>
        {user && (
          <div className="header-user">
            <div className="user-info">
              <Phone24Regular style={{ marginRight: 8, verticalAlign: 'middle' }} />
              <span>{user.phone}</span>
            </div>
            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
