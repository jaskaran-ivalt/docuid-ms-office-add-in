import React from "react";

interface HeaderProps {
  user: { phone: string } | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-brand">
          <h1 className="brand-title">DocuID</h1>
          <span className="brand-subtitle">Secure Document Access</span>
        </div>
        {user && (
          <div className="header-user">
            <span className="user-info">📱 {user.phone}</span>
            <button onClick={onLogout} className="logout-btn">
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
