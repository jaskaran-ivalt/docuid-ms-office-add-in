import React from "react";
import { Stack, IStackProps } from "@fluentui/react";

interface CardProps extends IStackProps {
  elevation?: 1 | 2 | 3;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  elevation = 1, 
  hoverable = false, 
  children, 
  styles,
  ...props 
}) => {
  const shadowMap = {
    1: "0 1.6px 3.6px rgba(0,0,0,0.13), 0 0.3px 0.9px rgba(0,0,0,0.11)",
    2: "0 3.2px 7.2px rgba(0,0,0,0.13), 0 0.6px 1.8px rgba(0,0,0,0.11)",
    3: "0 6.4px 14.4px rgba(0,0,0,0.13), 0 1.2px 3.6px rgba(0,0,0,0.11)",
  };

  return (
    <Stack
      {...props}
      styles={{
        root: {
          backgroundColor: "#ffffff",
          borderRadius: "4px",
          padding: "16px",
          boxShadow: shadowMap[elevation],
          transition: hoverable ? "box-shadow 0.2s ease, transform 0.2s ease" : undefined,
          ":hover": hoverable ? {
            boxShadow: shadowMap[elevation === 3 ? 3 : (elevation + 1) as 2 | 3],
            transform: "translateY(-2px)",
          } : undefined,
          ...styles?.root,
        },
      }}
    >
      {children}
    </Stack>
  );
};
