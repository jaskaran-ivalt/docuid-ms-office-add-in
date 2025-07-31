import React, { useState } from "react";
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
} from "lucide-react";
import "./ProfilePage.css";

interface ProfilePageProps {
  onBack: () => void;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  location: string;
  joinDate: string;
  avatar: string;
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

  // Dummy user profile data
  const [profile, setProfile] = useState<UserProfile>({
    id: "user_001",
    name: "Jaskaran Singh",
    email: "jaskaran.singh@ivalt.com",
    phone: "+1 (555) 123-4567",
    company: "iVALT Technologies",
    position: "Senior Software Engineer",
    location: "San Francisco, CA",
    joinDate: "January 2023",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    preferences: {
      notifications: true,
      language: "en",
      theme: "light",
      privacy: "public",
    },
  });

  const [formData, setFormData] = useState<UserProfile>(profile);

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
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePreferenceChange = (field: keyof UserProfile['preferences'], value: any) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setProfile(formData);
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
    setFormData(profile);
    setIsEditing(false);
    setError("");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <button className="back-button" onClick={onBack}>
          <X size={20} />
        </button>
        <h1 className="profile-title">Profile Settings</h1>
        {!isEditing && (
          <button 
            className="edit-button"
            onClick={() => setIsEditing(true)}
          >
            <Edit size={16} />
            Edit
          </button>
        )}
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

      <div className="profile-content">
        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name} />
              ) : (
                <div className="avatar-placeholder">
                  {getInitials(profile.name)}
                </div>
              )}
            </div>
            <div className="profile-info">
              <h2 className="profile-name">{profile.name}</h2>
              <p className="profile-position">{profile.position}</p>
              <p className="profile-company">{profile.company}</p>
            </div>
          </div>

          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-value">156</span>
              <span className="stat-label">Documents</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">23</span>
              <span className="stat-label">Shared</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">12</span>
              <span className="stat-label">Favorites</span>
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
                onChange={(_, value) => handleInputChange('name', value)}
                disabled={!isEditing}
                styles={{
                  field: {
                    fontSize: '14px',
                    border: '1px solid #d1d1d1',
                    borderRadius: '6px',
                    height: '40px',
                  },
                  fieldGroup: {
                    border: 'none',
                  },
                }}
              />
            </div>

            <div className="form-group">
              <Label className="form-label">Email Address</Label>
              <TextField
                value={formData.email}
                onChange={(_, value) => handleInputChange('email', value)}
                disabled={!isEditing}
                styles={{
                  field: {
                    fontSize: '14px',
                    border: '1px solid #d1d1d1',
                    borderRadius: '6px',
                    height: '40px',
                  },
                  fieldGroup: {
                    border: 'none',
                  },
                }}
              />
            </div>

            <div className="form-group">
              <Label className="form-label">Phone Number</Label>
              <TextField
                value={formData.phone}
                onChange={(_, value) => handleInputChange('phone', value)}
                disabled={!isEditing}
                styles={{
                  field: {
                    fontSize: '14px',
                    border: '1px solid #d1d1d1',
                    borderRadius: '6px',
                    height: '40px',
                  },
                  fieldGroup: {
                    border: 'none',
                  },
                }}
              />
            </div>

            <div className="form-group">
              <Label className="form-label">Location</Label>
              <TextField
                value={formData.location}
                onChange={(_, value) => handleInputChange('location', value)}
                disabled={!isEditing}
                styles={{
                  field: {
                    fontSize: '14px',
                    border: '1px solid #d1d1d1',
                    borderRadius: '6px',
                    height: '40px',
                  },
                  fieldGroup: {
                    border: 'none',
                  },
                }}
              />
            </div>

            <div className="form-group">
              <Label className="form-label">Company</Label>
              <TextField
                value={formData.company}
                onChange={(_, value) => handleInputChange('company', value)}
                disabled={!isEditing}
                styles={{
                  field: {
                    fontSize: '14px',
                    border: '1px solid #d1d1d1',
                    borderRadius: '6px',
                    height: '40px',
                  },
                  fieldGroup: {
                    border: 'none',
                  },
                }}
              />
            </div>

            <div className="form-group">
              <Label className="form-label">Position</Label>
              <TextField
                value={formData.position}
                onChange={(_, value) => handleInputChange('position', value)}
                disabled={!isEditing}
                styles={{
                  field: {
                    fontSize: '14px',
                    border: '1px solid #d1d1d1',
                    borderRadius: '6px',
                    height: '40px',
                  },
                  fieldGroup: {
                    border: 'none',
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Preferences */}
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
                onChange={(_, checked) => handlePreferenceChange('notifications', checked)}
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
                onChange={(_, option) => option && handlePreferenceChange('language', option.key)}
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
                onChange={(_, option) => option && handlePreferenceChange('theme', option.key)}
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
                onChange={(_, option) => option && handlePreferenceChange('privacy', option.key)}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="profile-section">
          <h3 className="section-title">
            <Calendar size={18} />
            Account Information
          </h3>
          
          <div className="account-info">
            <div className="info-item">
              <span className="info-label">Member Since:</span>
              <span className="info-value">{profile.joinDate}</span>
            </div>
            <div className="info-item">
              <span className="info-label">User ID:</span>
              <span className="info-value">{profile.id}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Account Status:</span>
              <span className="info-value status-active">Active</span>
            </div>
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
                  height: '44px',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderRadius: '6px',
                  border: 'none',
                  background: isLoading 
                    ? '#f3f2f1' 
                    : 'linear-gradient(135deg, #0078d4 0%, #106ebe 100%)',
                  color: isLoading ? '#605e5c' : 'white',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: '120px',
                },
                rootHovered: {
                  background: isLoading 
                    ? '#f3f2f1' 
                    : 'linear-gradient(135deg, #106ebe 0%, #005a9e 100%)',
                  transform: isLoading ? 'none' : 'translateY(-1px)',
                  boxShadow: isLoading 
                    ? 'none' 
                    : '0 4px 12px rgba(0, 120, 212, 0.3)',
                },
                rootPressed: {
                  transform: 'translateY(0)',
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
                  height: '44px',
                  fontSize: '14px',
                  fontWeight: '500',
                  borderRadius: '6px',
                  border: '1px solid #d1d1d1',
                  background: 'white',
                  color: '#323130',
                  transition: 'all 0.2s ease',
                  minWidth: '80px',
                },
                rootHovered: {
                  background: '#f8f9fa',
                  borderColor: '#0078d4',
                  color: '#0078d4',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                },
                rootPressed: {
                  transform: 'translateY(0)',
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