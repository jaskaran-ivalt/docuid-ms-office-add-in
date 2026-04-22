import React from "react";
import { Stack, TextField, Label } from "@fluentui/react";
import { User as UserIcon } from "lucide-react";
import { User as UserProfile } from "../../common/types";
import { formatLocation } from "../../common/utils";

import { Card } from "../shared/Card";

interface PersonalInfoSectionProps {
  formData: UserProfile;
  isEditing: boolean;
  onInputChange: (field: keyof UserProfile, value: any) => void;
}

const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({ 
  formData, 
  isEditing, 
  onInputChange 
}) => {
  return (
    <Card className="profile-section">
      <h3 className="section-title">
        <UserIcon size={18} />
        Personal Information
      </h3>

      <div className="form-grid">
        <div className="form-group">
          <Label className="form-label">Full Name</Label>
          <TextField
            value={formData.name}
            onChange={(_, value) => onInputChange("name", value)}
            disabled={!isEditing}
            styles={{
              field: { fontSize: "13px", border: "1px solid #d1d1d1", borderRadius: "4px", height: "32px" },
              fieldGroup: { border: "none" },
            }}
          />
        </div>

        <div className="form-group">
          <Label className="form-label">Email Address</Label>
          <TextField
            value={formData.email}
            onChange={(_, value) => onInputChange("email", value)}
            disabled={!isEditing}
            styles={{
              field: { fontSize: "13px", border: "1px solid #d1d1d1", borderRadius: "4px", height: "32px" },
              fieldGroup: { border: "none" },
            }}
          />
        </div>

        <div className="form-group">
          <Label className="form-label">Mobile Number</Label>
          <TextField
            value={formData.mobile}
            onChange={(_, value) => onInputChange("mobile", value)}
            disabled={!isEditing}
            styles={{
              field: { fontSize: "13px", border: "1px solid #d1d1d1", borderRadius: "4px", height: "32px" },
              fieldGroup: { border: "none" },
            }}
          />
        </div>

        <div className="form-group">
          <Label className="form-label">Country Code</Label>
          <TextField
            value={formData.country_code}
            onChange={(_, value) => onInputChange("country_code", value)}
            disabled={!isEditing}
            styles={{
              field: { fontSize: "13px", border: "1px solid #d1d1d1", borderRadius: "4px", height: "32px" },
              fieldGroup: { border: "none" },
            }}
          />
        </div>

        <div className="form-group">
          <Label className="form-label">Address</Label>
          <TextField
            value={formData.address}
            onChange={(_, value) => onInputChange("address", value)}
            disabled={!isEditing}
            multiline
            rows={2}
            styles={{
              field: { fontSize: "13px", border: "1px solid #d1d1d1", borderRadius: "4px", minHeight: "50px" },
              fieldGroup: { border: "none", background: "white" },
            }}
          />
        </div>

        <div className="form-group">
          <Label className="form-label">Location</Label>
          <TextField
            value={formData.latitude && formData.longitude ? `${formData.latitude}, ${formData.longitude}` : "N/A"}
            disabled={true}
            styles={{
              field: { fontSize: "13px", border: "1px solid #d1d1d1", borderRadius: "4px", height: "32px", backgroundColor: "#f8f9fa" },
              fieldGroup: { border: "none" },
            }}
          />
        </div>
      </div>
    </Card>
  );
};

export default PersonalInfoSection;
