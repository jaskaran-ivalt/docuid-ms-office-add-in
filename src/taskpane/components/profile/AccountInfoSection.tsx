import React from "react";
import { Calendar } from "lucide-react";
import { User as UserProfile } from "../../common/types";
import { formatPhoneNumber } from "../../common/utils";

import { Card } from "../shared/Card";

interface AccountInfoSectionProps {
  profile: UserProfile;
}

const AccountInfoSection: React.FC<AccountInfoSectionProps> = ({ profile }) => {
  return (
    <Card className="profile-section">
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
          <span className="info-value">{formatPhoneNumber(profile.country_code, profile.mobile)}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Account Status:</span>
          <span className="info-value status-active">Active</span>
        </div>
      </div>
    </Card>
  );
};

export default AccountInfoSection;
