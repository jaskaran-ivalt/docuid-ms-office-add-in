import React, { useState, useEffect } from "react";
import {
  Stack,
  TextField,
  Label,
  MessageBar,
  MessageBarType,
  Spinner,
} from "@fluentui/react";
import {
  User as UserIcon,
  Calendar,
  X,
} from "lucide-react";
import { AuthService } from "../services/AuthService";
import { User } from "../types";
import "./ProfilePage.css";

interface ProfilePageProps {
  onBack: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
  const [profile, setProfile] = useState<User | null>(null);
  const [lastActivity, setLastActivity] = useState<string>("");

  useEffect(() => {
    const storedAuth = AuthService.getStoredAuth();
    if (storedAuth?.user) {
      setProfile(storedAuth.user);
      setLastActivity(storedAuth.timestamp || "");
    }
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp || timestamp === "N/A") return "N/A";
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="profile-header">
          <button className="back-button" onClick={onBack}>
            <X size={20} />
          </button>
          <h1 className="profile-title">Profile Settings</h1>
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
          <Spinner size={3} label="Loading profile..." />
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <button className="back-button" onClick={onBack}>
          <X size={20} />
        </button>
        <h1 className="profile-title">Profile Settings</h1>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              <div className="avatar-placeholder">{getInitials(profile.name)}</div>
            </div>
            <div className="profile-info">
              <h2 className="profile-name">{profile.name}</h2>
              <p className="profile-position">{profile.email}</p>
              <p className="profile-company">{profile.phone}</p>
              {lastActivity && (
                <p className="profile-timestamp">
                  <Calendar size={14} style={{ marginRight: "4px" }} />
                  Last Activity: {formatTimestamp(lastActivity)}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h3 className="section-title">
            <UserIcon size={18} />
            Personal Information
          </h3>

          <div className="form-grid">
            <div className="form-group">
              <Label className="form-label">Full Name</Label>
              <TextField value={profile.name} disabled={true} />
            </div>

            <div className="form-group">
              <Label className="form-label">Email Address</Label>
              <TextField value={profile.email} disabled={true} />
            </div>

            <div className="form-group">
              <Label className="form-label">Mobile Number</Label>
              <TextField value={profile.mobile} disabled={true} />
            </div>

            <div className="form-group">
              <Label className="form-label">Country Code</Label>
              <TextField value={profile.countryCode} disabled={true} />
            </div>

            <div className="form-group">
              <Label className="form-label">Address</Label>
              <TextField value={profile.address || "N/A"} disabled={true} multiline rows={2} />
            </div>
          </div>
        </div>

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
              <span className="info-label">Account Status:</span>
              <span className="info-value status-active">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
