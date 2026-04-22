import React from "react";
import { User as UserProfile } from "../../common/types";
import { formatPhoneNumber } from "../../common/utils";

import { Card } from "../shared/Card";

interface ProfileCardProps {
  profile: UserProfile;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile }) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Card className="profile-card">
      <div className="profile-avatar-section">
        <div className="profile-avatar">
          <div className="avatar-placeholder">{getInitials(profile.name)}</div>
        </div>
        <div className="profile-info">
          <h2 className="profile-name">{profile.name}</h2>
          <p className="profile-position">{profile.email}</p>
          <p className="profile-company">{formatPhoneNumber(profile.country_code, profile.mobile)}</p>
        </div>
      </div>
    </Card>
  );
};

export default ProfileCard;
