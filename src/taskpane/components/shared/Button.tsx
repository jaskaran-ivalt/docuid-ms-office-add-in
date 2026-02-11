import React from "react";
import { PrimaryButton, DefaultButton, IButtonProps } from "@fluentui/react";

interface ButtonProps extends Omit<IButtonProps, "variant"> {
  variant?: "primary" | "default";
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ variant = "primary", loading, children, disabled, ...props }) => {
  const ButtonComponent = variant === "primary" ? PrimaryButton : DefaultButton;
  
  return (
    <ButtonComponent
      {...props}
      disabled={disabled || loading}
      text={loading ? "Loading..." : undefined}
    >
      {!loading && children}
    </ButtonComponent>
  );
};
