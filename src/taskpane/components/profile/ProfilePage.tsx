import React, { useState, useEffect } from "react";
import {
  PrimaryButton,
  DefaultButton,
  MessageBar,
  MessageBarType,
  Spinner,
} from "@fluentui/react";
import { X } from "lucide-react";
import { AuthService } from "../../services/AuthService";
import { User as UserProfile } from "../../common/types";
import { 
  validateEmail, 
  validatePhone, 
  validateIMEI, 
  formatPhoneNumber,
  sanitizeInput
} from "../../common/utils";

import ProfileCard from "./ProfileCard";
import PersonalInfoSection from "./PersonalInfoSection";
import AccountInfoSection from "./AccountInfoSection";
import "./ProfilePage.css";

interface ProfilePageProps {
  onBack: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<UserProfile | null>(null);

  useEffect(() => {
    const loadUserData = () => {
      const storedAuth = AuthService.getStoredAuth();
      if (storedAuth?.user) {
        setProfile(storedAuth.user);
        setFormData(storedAuth.user);
      }
    };
    loadUserData();
  }, []);

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    if (!formData) return;
    const sanitizedValue = typeof value === "string" ? sanitizeInput(value) : value;
    setFormData(prev => ({ ...prev!, [field]: sanitizedValue }));
  };

  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (!formData) return { isValid: false, errors: ["Form data not available"] };

    if (!formData.name || formData.name.trim().length < 2) errors.push("Name too short");
    if (!formData.email || !validateEmail(formData.email)) errors.push("Invalid email");
    if (!formData.mobile || !validatePhone(formData.mobile)) errors.push("Invalid mobile");
    if (!formData.country_code || formData.country_code.replace(/\D/g, "").length === 0) errors.push("Invalid country code");
    if (!formData.address || formData.address.trim().length < 5) errors.push("Address too short");
    if (formData.imei && formData.imei !== "N/A" && !validateIMEI(formData.imei)) errors.push("Invalid IMEI");

    return { isValid: errors.length === 0, errors };
  };

  const handleSave = async () => {
    if (!formData) return;
    const validation = validateForm();
    if (!validation.isValid) {
      setError(`Validation failed: ${validation.errors.join(", ")}`);
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProfile(formData);
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to update profile.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
    setError("");
  };

  if (!profile || !formData) {
    return (
      <div className="profile-page">
        <div className="profile-header">
          <button className="back-button" onClick={onBack}><X size={20} /></button>
          <h1 className="profile-title">Profile Settings</h1>
        </div>
        <div className="loading-container">
          <Spinner size={3} label="Loading profile..." />
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <button className="back-button" onClick={onBack}><X size={20} /></button>
        <h1 className="profile-title">Profile Settings</h1>
      </div>

      {error && <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError("")}>{error}</MessageBar>}
      {success && <MessageBar messageBarType={MessageBarType.success} onDismiss={() => setSuccess("")}>{success}</MessageBar>}

      <div className="profile-content">
        <ProfileCard profile={profile} />
        
        <PersonalInfoSection 
          formData={formData} 
          isEditing={isEditing} 
          onInputChange={handleInputChange} 
        />

        <AccountInfoSection profile={profile} />

        {isEditing && (
          <div className="profile-actions">
            <PrimaryButton
              text={isLoading ? "Saving..." : "Save Changes"}
              onClick={handleSave}
              disabled={isLoading}
            />
            <DefaultButton
              text="Cancel"
              onClick={handleCancel}
              disabled={isLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
