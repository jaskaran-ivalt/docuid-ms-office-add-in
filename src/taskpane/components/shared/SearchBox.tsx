import React from "react";
import { SearchBox as FluentSearchBox, ISearchBoxProps } from "@fluentui/react";

export const SearchBox: React.FC<ISearchBoxProps> = (props) => {
  return (
    <FluentSearchBox
      placeholder="Search documents..."
      styles={{
        root: {
          width: "100%",
          borderRadius: "4px",
        },
      }}
      {...props}
    />
  );
};
