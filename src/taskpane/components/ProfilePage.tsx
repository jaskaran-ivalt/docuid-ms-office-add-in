import React, { useState, useEffect } from "react";
import {
  Stack,
  TextField,
  PrimaryButton,
  DefaultButton,
  Label,
  MessageBar,
  MessageBarType,
  Spinner,
  Toggle,
  ChoiceGroup,
  IChoiceGroupOption,
} from "@fluentui/react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Shield,
  Bell,
  Globe,
  Save,
  Edit,
  X,
  Check,
  Smartphone,
} from "lucide-react";
import { authService } from "../services/ServiceContainer";
import "./ProfilePage.css";

interface ProfilePageProps {
  onBack: () => void;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  mobile: string;
  country_code: string;
  address: string;
  latitude?: number;
  longitude?: number;
  imei?: string;
  message?: string;
  timestamp?: string;
  preferences: {
    notifications: boolean;
    language: string;
    theme: string;
    privacy: string;
  };
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<UserProfile | null>(null);

  // Load user data from AuthService on component mount
  useEffect(() => {
    const loadUserData = () => {
      const storedAuth = authService.getStoredAuth();
      if (storedAuth?.user) {
        const userProfile: UserProfile = {
          id: storedAuth.user.id.toString(),
          name: storedAuth.user.name || "N/A",
          email: storedAuth.user.email || "N/A",
          phone: formatPhoneNumber(storedAuth.user.country_code || "", storedAuth.user.mobile || ""),
          mobile: storedAuth.user.mobile || "N/A",
          country_code: storedAuth.user.country_code || "N/A",
          address: storedAuth.user.address || "N/A",
          latitude: storedAuth.user.latitude,
          longitude: storedAuth.user.longitude,
          imei: storedAuth.user.imei || "N/A",
          message: storedAuth.message || "N/A",
          timestamp: storedAuth.timestamp || "N/A",
          preferences: {
            notifications: true,
            language: "en",
            theme: "light",
            privacy: "public",
          },
        };
        setProfile(userProfile);
        setFormData(userProfile);
      }
    };

    loadUserData();
  }, []);

  const languageOptions: IChoiceGroupOption[] = [
    { key: "en", text: "English" },
    { key: "es", text: "Spanish" },
    { key: "fr", text: "French" },
    { key: "de", text: "German" },
  ];

  const themeOptions: IChoiceGroupOption[] = [
    { key: "light", text: "Light" },
    { key: "dark", text: "Dark" },
    { key: "auto", text: "Auto" },
  ];

  const privacyOptions: IChoiceGroupOption[] = [
    { key: "public", text: "Public" },
    { key: "private", text: "Private" },
    { key: "friends", text: "Friends Only" },
  ];

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    if (!formData) return;
    
    // Sanitize input
    const sanitizedValue = typeof value === 'string' ? sanitizeInput(value) : value;
    
    setFormData((prev) => ({
      ...prev!,
      [field]: sanitizedValue,
    }));
  };

  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!formData) return { isValid: false, errors: ['Form data not available'] };
    
    // Validate required fields
    if (!formData.name || formData.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }
    
    if (!formData.email || !validateEmail(formData.email)) {
      errors.push('Please enter a valid email address');
    }
    
    if (!formData.mobile || !validatePhone(formData.mobile)) {
      errors.push('Please enter a valid mobile number (at least 10 digits)');
    }
    
    if (!formData.country_code || formData.country_code.replace(/\D/g, '').length === 0) {
      errors.push('Please enter a valid country code');
    }
    
    if (!formData.address || formData.address.trim().length < 5) {
      errors.push('Address must be at least 5 characters long');
    }
    
    if (formData.imei && formData.imei !== "N/A" && !validateIMEI(formData.imei)) {
      errors.push('IMEI must be 15 digits long');
    }
    
    return { isValid: errors.length === 0, errors };
  };

  const handlePreferenceChange = (field: keyof UserProfile["preferences"], value: any) => {
    if (!formData) return;
    setFormData((prev) => ({
      ...prev!,
      preferences: {
        ...prev!.preferences,
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!formData) return;
    
    // Validate form before saving
    const validation = validateForm();
    if (!validation.isValid) {
      setError(`Validation failed: ${validation.errors.join(', ')}`);
      return;
    }
    
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update phone number format
      const updatedFormData = {
        ...formData,
        phone: formatPhoneNumber(formData.country_code, formData.mobile)
      };

      setProfile(updatedFormData);
      setFormData(updatedFormData);
      setSuccess("Profile updated successfully!");
      setIsEditing(false);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (!profile) return;
    setFormData(profile);
    setIsEditing(false);
    setError("");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  };

  const validateIMEI = (imei: string): boolean => {
    if (!imei || imei === "N/A") return true; // Optional field
    const imeiRegex = /^\d{15}$/;
    return imeiRegex.test(imei.replace(/\D/g, ''));
  };

  const formatPhoneNumber = (countryCode: string, mobile: string): string => {
    if (!countryCode && !mobile) return "N/A";
    const cleanCountryCode = countryCode?.replace(/\D/g, '') || '';
    const cleanMobile = mobile?.replace(/\D/g, '') || '';
    
    if (cleanCountryCode && cleanMobile) {
      return `+${cleanCountryCode} ${cleanMobile}`;
    } else if (cleanMobile) {
      return cleanMobile;
    }
    return "N/A";
  };

  const sanitizeInput = (value: string): string => {
    return value.trim().replace(/[<>]/g, '');
  };

  const formatLocation = (latitude?: number, longitude?: number): string => {
    if (latitude && longitude) {
      return `Latitude ${latitude}, Longitude ${longitude}`;
    }
    return "Location not available";
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp || timestamp === "N/A") return "N/A";
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  // Show loading state if profile is not loaded yet
  if (!profile || !formData) {
    return (
      <div className="profile-page">
        <div className="profile-header">
          <button className="back-button" onClick={onBack}>
            <X size={20} />
          </button>
          <h1 className="profile-title">Profile Settings</h1>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <Spinner size={3} label="Loading profile..." />
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <button className="back-button" onClick={onBack}>
          <X size={20} />
        </button>
        <h1 className="profile-title">Profile Settings</h1>
        {/*
        {!isEditing && (
          <button className="edit-button" onClick={() => setIsEditing(true)}>
            <Edit size={16} />
            Edit
          </button>
        )} */}

      </div>

      {/* Messages */}
      {error && (
        <MessageBar
          messageBarType={MessageBarType.error}
          onDismiss={() => setError("")}
          className="profile-message"
        >
          {error}
        </MessageBar>
      )}

      {success && (
        <MessageBar
          messageBarType={MessageBarType.success}
          onDismiss={() => setSuccess("")}
          className="profile-message"
        >
          {success}
        </MessageBar>
      )}

      {/* Authentication Status Message */}
      {profile.message && profile.message !== "N/A" && (
        <MessageBar
          messageBarType={MessageBarType.info}
          className="profile-message"
        >
          <strong>Authentication Status:</strong> {profile.message}
        </MessageBar>
      )}

      <div className="profile-content">
        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              <div className="avatar-placeholder">{getInitials(profile.name)}</div>
            </div>
            <div className="profile-info">
              <h2 className="profile-name">{profile.name}</h2>
              <p className="profile-position">{profile.email}</p>
              <p className="profile-company">{profile.phone}</p>
              {profile.timestamp && profile.timestamp !== "N/A" && (
                <p className="profile-timestamp">
                  <Calendar size={14} style={{ marginRight: '4px' }} />
                  Last Activity: {formatTimestamp(profile.timestamp)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="profile-section">
          <h3 className="section-title">
            <User size={18} />
            Personal Information
          </h3>

          <div className="form-grid">
            <div className="form-group">
              <Label className="form-label">Full Name</Label>
              <TextField
                value={formData.name}
                onChange={(_, value) => handleInputChange("name", value)}
                disabled={!isEditing}
                styles={{
                  field: {
                    fontSize: "14px",
                    border: "1px solid #d1d1d1",
                    borderRadius: "6px",
                    height: "40px",
                  },
                  fieldGroup: {
                    border: "none",
                  },
                }}
              />
            </div>

            <div className="form-group">
              <Label className="form-label">Email Address</Label>
              <TextField
                value={formData.email}
                onChange={(_, value) => handleInputChange("email", value)}
                disabled={!isEditing}
                styles={{
                  field: {
                    fontSize: "14px",
                    border: "1px solid #d1d1d1",
                    borderRadius: "6px",
                    height: "40px",
                  },
                  fieldGroup: {
                    border: "none",
                  },
                }}
              />
            </div>

            <div className="form-group">
              <Label className="form-label">Mobile Number</Label>
              <TextField
                value={formData.mobile}
                onChange={(_, value) => handleInputChange("mobile", value)}
                disabled={!isEditing}
                styles={{
                  field: {
                    fontSize: "14px",
                    border: "1px solid #d1d1d1",
                    borderRadius: "6px",
                    height: "40px",
                  },
                  fieldGroup: {
                    border: "none",
                  },
                }}
              />
            </div>

            <div className="form-group">
              <Label className="form-label">Country Code</Label>
              <TextField
                value={formData.country_code}
                onChange={(_, value) => handleInputChange("country_code", value)}
                disabled={!isEditing}
                styles={{
                  field: {
                    fontSize: "14px",
                    border: "1px solid #d1d1d1",
                    borderRadius: "6px",
                    height: "40px",
                  },
                  fieldGroup: {
                    border: "none",
                  },
                }}
              />
            </div>

            <div className="form-group">
              <Label className="form-label">Address</Label>
              <TextField
                value={formData.address}
                onChange={(_, value) => handleInputChange("address", value)}
                disabled={!isEditing}
                multiline
                rows={2}
                styles={{
                  field: {
                    fontSize: "14px",
                    border: "1px solid #d1d1d1",
                    borderRadius: "6px",
                    minHeight: "60px",
                  },
                  fieldGroup: {
                    border: "none",
                  },
                }}
              />
            </div>

            <div className="form-group">
              <Label className="form-label">Location</Label>
              <TextField
                value={formatLocation(formData.latitude, formData.longitude)}
                disabled={true}
                styles={{
                  field: {
                    fontSize: "14px",
                    border: "1px solid #d1d1d1",
                    borderRadius: "6px",
                    height: "40px",
                    backgroundColor: "#f8f9fa",
                  },
                  fieldGroup: {
                    border: "none",
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Device Information */}
                {/* 
        <div className="profile-section">
          <h3 className="section-title">
            <Smartphone size={18} />
            Device Information
          </h3>

          <div className="form-grid">
            <div className="form-group">
              <Label className="form-label">Device IMEI</Label>
              <TextField
                value={formData.imei || "N/A"}
                disabled={true}
                styles={{
                  field: {
                    fontSize: "14px",
                    border: "1px solid #d1d1d1",
                    borderRadius: "6px",
                    height: "40px",
                    backgroundColor: "#f8f9fa",
                  },
                  fieldGroup: {
                    border: "none",
                  },
                }}
              />
            </div>
          </div>
        </div>
 */}
                
        {/* Preferences */}
      {/*
        <div className="profile-section">
          <h3 className="section-title">
            <Shield size={18} />
            Preferences
          </h3>

          <div className="preferences-grid">
            <div className="preference-item">
              <div className="preference-header">
                <Bell size={16} />
                <span>Notifications</span>
              </div>
              <Toggle
                checked={formData.preferences.notifications}
                onText="On"
                offText="Off"
                onChange={(_, checked) => handlePreferenceChange("notifications", checked)}
                disabled={!isEditing}
              />
            </div>

            <div className="preference-item">
              <div className="preference-header">
                <Globe size={16} />
                <span>Language</span>
              </div>
              <ChoiceGroup
                selectedKey={formData.preferences.language}
                options={languageOptions}
                onChange={(_, option) => option && handlePreferenceChange("language", option.key)}
                disabled={!isEditing}
              />
            </div>

            <div className="preference-item">
              <div className="preference-header">
                <Globe size={16} />
                <span>Theme</span>
              </div>
              <ChoiceGroup
                selectedKey={formData.preferences.theme}
                options={themeOptions}
                onChange={(_, option) => option && handlePreferenceChange("theme", option.key)}
                disabled={!isEditing}
              />
            </div>

            <div className="preference-item">
              <div className="preference-header">
                <Shield size={16} />
                <span>Privacy</span>
              </div>
              <ChoiceGroup
                selectedKey={formData.preferences.privacy}
                options={privacyOptions}
                onChange={(_, option) => option && handlePreferenceChange("privacy", option.key)}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>
    */}
        {/* Account Information */}
        <div className="profile-section">
          <h3 className="section-title">
            <Calendar size={18} />
            Account Information
          </h3>

          <div className="account-info">
            <div className="info-item">
              <span className="info-label">User ID:</span>
              <span className="info-value">{profile.id}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Phone Number:</span>
              <span className="info-value">{profile.phone}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Account Status:</span>
              <span className="info-value status-active">Active</span>
            </div>
            {profile.timestamp && profile.timestamp !== "N/A" && (
              <div className="info-item">
                <span className="info-label">Last Activity:</span>
                <span className="info-value">{formatTimestamp(profile.timestamp)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="profile-actions">
            <PrimaryButton
              text={isLoading ? "Saving..." : "Save Changes"}
              onClick={handleSave}
              disabled={isLoading}
              iconProps={isLoading ? undefined : { iconName: undefined }}
              styles={{
                root: {
                  height: "44px",
                  fontSize: "14px",
                  fontWeight: "600",
                  borderRadius: "6px",
                  border: "none",
                  background: isLoading
                    ? "#f3f2f1"
                    : "linear-gradient(135deg, #0078d4 0%, #106ebe 100%)",
                  color: isLoading ? "#605e5c" : "white",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  minWidth: "120px",
                },
                rootHovered: {
                  background: isLoading
                    ? "#f3f2f1"
                    : "linear-gradient(135deg, #106ebe 0%, #005a9e 100%)",
                  transform: isLoading ? "none" : "translateY(-1px)",
                  boxShadow: isLoading ? "none" : "0 4px 12px rgba(0, 120, 212, 0.3)",
                },
                rootPressed: {
                  transform: "translateY(0)",
                },
              }}
            >
              {isLoading && <Spinner size={1} style={{ marginRight: 8 }} />}
            </PrimaryButton>
            <DefaultButton
              text="Cancel"
              onClick={handleCancel}
              disabled={isLoading}
              styles={{
                root: {
                  height: "44px",
                  fontSize: "14px",
                  fontWeight: "500",
                  borderRadius: "6px",
                  border: "1px solid #d1d1d1",
                  background: "white",
                  color: "#323130",
                  transition: "all 0.2s ease",
                  minWidth: "80px",
                },
                rootHovered: {
                  background: "#f8f9fa",
                  borderColor: "#0078d4",
                  color: "#0078d4",
                  transform: "translateY(-1px)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                },
                rootPressed: {
                  transform: "translateY(0)",
                },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
