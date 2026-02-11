# Fluent UI Design System

This project uses Microsoft's Fluent UI design system for consistent, professional Office-integrated UI components.

## 🎨 Design Tokens

### Theme Configuration
Located in `src/taskpane/theme/fluentTheme.ts`

- **Primary Color**: `#0078d4` (Microsoft Blue)
- **Typography**: Segoe UI (Office standard)
- **Spacing**: 4px base unit
- **Elevation**: 3 levels of shadow depth

## 📦 Reusable Components

All reusable components are in `src/taskpane/components/shared/`

### Card
```tsx
import { Card } from "@/taskpane/components/shared";

<Card elevation={2} hoverable>
  <Text>Content here</Text>
</Card>
```

**Props:**
- `elevation`: 1 | 2 | 3 (shadow depth)
- `hoverable`: boolean (adds hover effect)

### Button
```tsx
import { Button } from "@/taskpane/components/shared";

<Button variant="primary" loading={isLoading}>
  Click Me
</Button>
```

**Props:**
- `variant`: "primary" | "default"
- `loading`: boolean

### SearchBox
```tsx
import { SearchBox } from "@/taskpane/components/shared";

<SearchBox 
  placeholder="Search..." 
  onChange={(_, value) => setSearch(value)}
/>
```

### Avatar
```tsx
import { Avatar } from "@/taskpane/components/shared";

<Avatar name="John Doe" size={PersonaSize.size40} />
```

## 🎯 Usage Guidelines

### Spacing
Use Fluent UI Stack component with tokens:
```tsx
<Stack tokens={{ padding: 16, childrenGap: 12 }}>
  <Text>Item 1</Text>
  <Text>Item 2</Text>
</Stack>
```

### Typography
Use Fluent UI Text variants:
```tsx
<Text variant="xLarge">Heading</Text>
<Text variant="medium">Body text</Text>
<Text variant="small">Caption</Text>
```

### Icons
Use Fluent UI Icon component:
```tsx
<Icon iconName="PDF" styles={{ root: { fontSize: 24, color: "#d32f2f" } }} />
```

Common icons:
- `PDF`, `WordDocument`, `ExcelDocument`, `PowerPointDocument`
- `Contact`, `Settings`, `SignOut`
- `Refresh`, `Search`, `FabricFolder`

### Colors
Access theme colors via semantic names:
```tsx
styles={{
  root: {
    color: theme.palette.themePrimary,
    backgroundColor: theme.palette.neutralLighter,
  }
}}
```

## 🔧 Component Structure

### Before (Custom CSS)
```tsx
<div className="document-item">
  <div className="document-icon">...</div>
  <div className="document-info">...</div>
</div>
```

### After (Fluent UI)
```tsx
<Card elevation={1} hoverable>
  <Stack horizontal tokens={{ childrenGap: 12 }}>
    <Icon iconName="PDF" />
    <Stack tokens={{ childrenGap: 4 }}>
      <Text variant="medium">Document Title</Text>
    </Stack>
  </Stack>
</Card>
```

## 📱 Responsive Design

Fluent UI components are responsive by default. Use Stack for layout:

```tsx
<Stack 
  horizontal={!isMobile}
  tokens={{ childrenGap: 16 }}
  wrap
>
  {/* Content */}
</Stack>
```

## 🎨 Customization

### Extending Theme
```tsx
import { createTheme } from "@fluentui/react";

const customTheme = createTheme({
  palette: {
    themePrimary: "#0078d4",
    // Add custom colors
  },
});
```

### Component Styles
```tsx
<PrimaryButton
  styles={{
    root: {
      borderRadius: 4,
      height: 40,
    },
    rootHovered: {
      backgroundColor: "#106ebe",
    },
  }}
/>
```

## 🚀 Best Practices

1. **Use Stack for layout** - Avoid custom flexbox CSS
2. **Use semantic colors** - Reference theme.palette instead of hardcoded colors
3. **Use Text variants** - Consistent typography across the app
4. **Use Icon component** - Office-standard icons
5. **Use elevation consistently** - Card shadows for depth hierarchy

## 📚 Resources

- [Fluent UI Documentation](https://developer.microsoft.com/en-us/fluentui)
- [Office Add-ins Design Guidelines](https://learn.microsoft.com/en-us/office/dev/add-ins/design/add-in-design)
- [Fluent UI React Components](https://react.fluentui.dev/)
