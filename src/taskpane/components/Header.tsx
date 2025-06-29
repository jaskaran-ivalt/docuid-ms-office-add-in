import React from "react";
import { DefaultButton, Stack } from "@fluentui/react";
import { Phone24Regular } from "@fluentui/react-icons";

interface HeaderProps {
  user: { phone: string } | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <Stack
      as="header"
      horizontal
      verticalAlign="center"
      horizontalAlign="space-between"
      style={{ padding: 16, boxShadow: "0 2px 8px #eee", marginBottom: 16 }}
    >
      <Stack>
        <h1 style={{ margin: 0 }}>DocuID</h1>
        <span>Secure Document Access</span>
      </Stack>
      {user && (
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
          <span>
            <Phone24Regular style={{ marginRight: 4 }} />
            {user.phone}
          </span>
          <DefaultButton onClick={onLogout} text="Logout" />
        </Stack>
      )}
    </Stack>
  );
};

export default Header;
