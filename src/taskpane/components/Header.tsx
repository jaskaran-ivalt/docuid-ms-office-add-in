import React, { useState, useRef, useEffect } from "react";
import { DefaultButton, Stack } from "@fluentui/react";
import { 
  Phone, 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  Search,
  Crown
} from "lucide-react";
import "./Header.css";

interface HeaderProps {
  user: { phone: string } | null;
  onLogout: () => void;
  onNavigateToProfile?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, onNavigateToProfile }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Generate initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase();
  };

  // Truncate email for display
  const truncateEmail = (email: string) => {
    if (email.length <= 20) return email;
    const [localPart, domain] = email.split('@');
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
    plan: "PRO"
  };

  return (
    <div className="header">
      <div className="header-content">
        <div className="header-brand">
          <div className="brand-logo">
            <img src="./assets/logo-filled.png" alt="DocuID Logo" />
          </div>
          <div className="brand-text">
            <h1 className="brand-title">DocuID</h1>
            <span className="brand-subtitle">Secure Document Access</span>
          </div>
        </div>
        
        {user && (
          <div className="header-user-section">
            {/* Search Icon */}
            {/* <div className="search-icon-wrapper">
              <Search size={18} />
            </div> */}
            
            {/* User Profile Dropdown */}
            <div className="user-profile-dropdown" ref={dropdownRef}>
              <button 
                className="user-profile-trigger" 
                onClick={toggleDropdown}
                aria-expanded={isDropdownOpen}
              >
                <div className="user-avatar">
                  <div className="avatar-initials">
                    {getInitials(dummyUser.name)}
                  </div>
                </div>
                <div className="user-info">
                  <div className="user-name">{dummyUser.name}</div>
                  <div className="user-email" title={dummyUser.email}>
                    {truncateEmail(dummyUser.email)}
                  </div>
                </div>
                {/* <div className="plan-badge">
                  <Crown size={12} />
                  <span>{dummyUser.plan}</span>
                </div> */}
                <ChevronDown 
                  size={16} 
                  className={`dropdown-chevron ${isDropdownOpen ? 'rotated' : ''}`}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="dropdown-menu">
                  {/* User Info Section */}
                  <div className="dropdown-user-info">
                    <div className="dropdown-avatar">
                      <div className="avatar-initials">
                        {getInitials(dummyUser.name)}
                      </div>
                    </div>
                    <div className="dropdown-user-details">
                      <div className="dropdown-user-name">{dummyUser.name}</div>
                      <div className="dropdown-user-email">{dummyUser.email}</div>
                    </div>
                    <div className="dropdown-plan-badge">
                      <Crown size={12} />
                      <span>{dummyUser.plan}</span>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="dropdown-menu-items">
                    {/* {onNavigateToProfile && (
                      <button 
                        className="dropdown-menu-item" 
                        onClick={() => {
                          onNavigateToProfile();
                          setIsDropdownOpen(false);
                        }}
                      >
                        <User size={16} />
                        <span>Profile</span>
                      </button>
                    )} */}
                    <button className="dropdown-menu-item">
                      <Settings size={16} />
                      <span>Settings</span>
                    </button>
                    <button className="dropdown-menu-item logout-item" onClick={onLogout}>
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
