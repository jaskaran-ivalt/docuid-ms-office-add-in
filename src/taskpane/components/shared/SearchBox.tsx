import { SearchBox as FluentSearchBox, type ISearchBoxProps } from '@fluentui/react';
import type React from 'react';

export const SearchBox: React.FC<ISearchBoxProps> = (props) => {
  return (
    <FluentSearchBox
      placeholder="Search documents..."
      styles={{
        root: {
          width: '100%',
          borderRadius: '4px',
        },
      }}
      {...props}
    />
  );
};
