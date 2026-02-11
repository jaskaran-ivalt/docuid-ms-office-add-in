import React, { useState, useRef, useEffect } from "react";
import { Stack, Persona, PersonaSize, IconButton, Callout, DirectionalHint } from "@fluentui/react";
import "./Header.css";

interface HeaderProps {
  user: { name: string; phone: string; email: string } | null;
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

  // Format phone number for display
  const formatPhone = (phone: string) => {
    if (!phone) return "";
    // Remove + and format as needed
    return phone;
  };

  // Use actual user data
  const displayName = user?.name ? user?.name : "User";
  const displayEmail = user?.email || "";

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
            {/* {onToggleDebug && (
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
                  color: "rgba(255, 255, 255, 0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "8px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)";
                }}
              >
                <Bug size={16} />
              </button>
            )} */}

            {/* Search Icon */}
            {/* <div className="search-icon-wrapper">
              <Search size={18} />
            </div> */}

            {/* User Profile Dropdown */}
            <div className="user-profile-dropdown" ref={dropdownRef}>
              <div
                onClick={toggleDropdown}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  transition: "background-color 0.08s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "600",
                    fontSize: "14px",
                  }}
                >
                  {getInitials(user?.name || "User")}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ color: "white", fontSize: "14px", fontWeight: "600" }}>
                    {displayName}
                  </span>
                  <span style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "12px" }}>
                    {truncateEmail(displayEmail)}
                  </span>
                </div>
              </div>

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
                    <Stack
                      horizontal
                      tokens={{ childrenGap: 12 }}
                      styles={{ root: { paddingBottom: 8, borderBottom: "1px solid #edebe9" } }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          backgroundColor: "#f3f2f1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#323130",
                          fontWeight: "600",
                          fontSize: "16px",
                        }}
                      >
                        {displayName.charAt(0)}
                      </div>
                      <Stack tokens={{ childrenGap: 2 }}>
                        <Text
                          variant="medium"
                          styles={{ root: { fontWeight: 600, color: "#323130" } }}
                        >
                          {displayName}
                        </Text>
                        <Text variant="small" styles={{ root: { color: "#605e5c" } }}>
                          {displayEmail}
                        </Text>
                      </Stack>
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
                          styles={{
                            root: { width: "100%", justifyContent: "flex-start" },
                            label: { color: "#323130" },
                          }}
                        />
                      )}
                      <IconButton
                        text="Settings"
                        iconProps={{ iconName: "Settings" }}
                        styles={{
                          root: { width: "100%", justifyContent: "flex-start" },
                          label: { color: "#323130" },
                        }}
                      />
                      <IconButton
                        text="Logout"
                        iconProps={{ iconName: "SignOut" }}
                        onClick={onLogout}
                        styles={{
                          root: { width: "100%", justifyContent: "flex-start" },
                          label: { color: "#323130" },
                        }}
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
