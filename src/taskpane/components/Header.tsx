import React, { useState, useRef, useEffect } from "react";
import { Stack, Persona, PersonaSize, IconButton, Callout, DirectionalHint } from "@fluentui/react";
import { User, Settings, LogOut, Bug } from "lucide-react";
import "./Header.css";

interface HeaderProps {
  user: { phone: string } | null;
  onLogout: () => void;
  onNavigateToProfile?: () => void;
  onToggleDebug?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, onNavigateToProfile, onToggleDebug }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Generate initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase();
  };

  // Truncate email for display
  const truncateEmail = (email: string) => {
    if (email.length <= 20) return email;
    const [localPart, domain] = email.split("@");
    if (localPart.length <= 12) {
      return `${localPart}@${domain.substring(0, 8)}...`;
    }
    return `${localPart.substring(0, 12)}...@${domain.substring(0, 8)}...`;
  };

  // Dummy user data based on the image
  const dummyUser = {
    name: "Jaskaran Singh",
    email: "jaskaran@ivalt.com",
    phone: user?.phone || "+91 98765 43210",
    plan: "PRO",
  };

  return (
    <div className="header">
      <div className="header-content">
        <div className="header-brand">
          <div className="brand-logo">
            <img src="assets/logo-transparent.png" alt="DocuID Logo" />
          </div>
          <div className="brand-text">
            <h1 className="brand-title">DocuID</h1>
            <span className="brand-subtitle">Powered by iVALT</span>
            {/* <span className="brand-subtitle">Secure Document Access</span> */}
          </div>
        </div>

        {user && (
          <div className="header-user-section">
            {/* Debug Button */}
            {onToggleDebug && (
              <button
                className="debug-button"
                onClick={onToggleDebug}
                title="Toggle Debug Panel (Ctrl+Shift+D)"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px",
                  borderRadius: "4px",
                  color: "#666",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "8px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f0f0f0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <Bug size={16} />
              </button>
            )}

            {/* Search Icon */}
            {/* <div className="search-icon-wrapper">
              <Search size={18} />
            </div> */}

            {/* User Profile Dropdown */}
            <div className="user-profile-dropdown" ref={dropdownRef}>
              <Persona
                text={dummyUser.name}
                secondaryText={truncateEmail(dummyUser.email)}
                size={PersonaSize.size32}
                onClick={toggleDropdown}
                styles={{
                  root: { cursor: "pointer" },
                }}
              />

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <Callout
                  target={dropdownRef.current}
                  onDismiss={() => setIsDropdownOpen(false)}
                  directionalHint={DirectionalHint.bottomRightEdge}
                  styles={{
                    root: { padding: 0 },
                  }}
                >
                  <Stack tokens={{ padding: 16, childrenGap: 8 }}>
                    <Stack horizontal tokens={{ childrenGap: 12 }}>
                      <Persona
                        text={dummyUser.name}
                        secondaryText={dummyUser.email}
                        size={PersonaSize.size40}
                      />
                    </Stack>
                    <Stack tokens={{ childrenGap: 4 }}>
                      {onNavigateToProfile && (
                        <IconButton
                          text="Profile"
                          iconProps={{ iconName: "Contact" }}
                          onClick={() => {
                            onNavigateToProfile();
                            setIsDropdownOpen(false);
                          }}
                          styles={{ root: { width: "100%", justifyContent: "flex-start" } }}
                        />
                      )}
                      <IconButton
                        text="Settings"
                        iconProps={{ iconName: "Settings" }}
                        styles={{ root: { width: "100%", justifyContent: "flex-start" } }}
                      />
                      <IconButton
                        text="Logout"
                        iconProps={{ iconName: "SignOut" }}
                        onClick={onLogout}
                        styles={{ root: { width: "100%", justifyContent: "flex-start" } }}
                      />
                    </Stack>
                  </Stack>
                </Callout>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
