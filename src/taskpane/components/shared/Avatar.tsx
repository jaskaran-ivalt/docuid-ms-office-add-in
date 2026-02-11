import React from "react";
import { Persona, PersonaSize, IPersonaProps } from "@fluentui/react";

interface AvatarProps extends Partial<IPersonaProps> {
  name: string;
  size?: PersonaSize;
  imageUrl?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  name, 
  size = PersonaSize.size32, 
  imageUrl,
  ...props 
}) => {
  return (
    <Persona
      text={name}
      size={size}
      imageUrl={imageUrl}
      hidePersonaDetails
      {...props}
    />
  );
};
