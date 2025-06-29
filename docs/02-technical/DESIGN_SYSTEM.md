# DocuID Design System

## Overview

The DocuID design system is built on Microsoft's Fluent UI framework, providing a consistent, accessible, and modern user interface for secure document access within Office applications.

## Theme Configuration

### Primary Colors

```typescript
themePrimary: "#0078d4"; // Microsoft Blue
themeSecondary: "#1a86d9"; // Darker Blue
themeDarkAlt: "#006cbe"; // Dark Blue Alt
themeDark: "#005ba1"; // Dark Blue
themeDarker: "#004377"; // Darkest Blue
```

### Neutral Colors

```typescript
neutralPrimary: "#323130"; // Primary Text
neutralSecondary: "#605e5c"; // Secondary Text
neutralTertiary: "#a19f9d"; // Tertiary Text
neutralLight: "#edebe9"; // Light Backgrounds
neutralLighter: "#f3f2f1"; // Lighter Backgrounds
neutralLighterAlt: "#faf9f8"; // Lightest Backgrounds
white: "#ffffff"; // Pure White
black: "#000000"; // Pure Black
```

## Typography

### Font Family

- **Primary**: Segoe UI, Arial, sans-serif
- **Fallback**: System fonts for cross-platform compatibility

### Font Weights

- **Regular**: 400 (body text)
- **Semibold**: 600 (headings, emphasis)
- **Bold**: 700 (strong emphasis)

### Font Sizes

- **H1**: 32px (Page titles)
- **H2**: 24px (Section headers)
- **H3**: 20px (Subsection headers)
- **Body**: 14px (Regular text)
- **Small**: 12px (Captions, metadata)

## Spacing System

Based on 8px grid system:

```typescript
tokens: {
  childrenGap: 8; // xs
  childrenGap: 12; // sm
  childrenGap: 16; // md
  childrenGap: 24; // lg
  childrenGap: 32; // xl
  childrenGap: 48; // xxl
}
```

## Component Library

### Buttons

#### Primary Button

- **Usage**: Main actions (Login, Submit)
- **Color**: Theme Primary (#0078d4)
- **Text**: White
- **States**: Default, Hover, Pressed, Disabled

#### Default Button

- **Usage**: Secondary actions (Cancel, Open)
- **Color**: Neutral border with primary text
- **States**: Default, Hover, Pressed, Disabled

### Form Controls

#### TextField

- **Variants**:
  - Standard (with border)
  - Borderless (clean look)
  - Underlined (minimal)
- **States**: Default, Focused, Error, Disabled

#### Dropdown

- **Usage**: Country selection, filters
- **Style**: Consistent with TextField styling
- **Options**: Support for icons and text

### Layout Components

#### Stack

- **Purpose**: Consistent spacing and alignment
- **Directions**: Horizontal, Vertical
- **Alignment**: Start, Center, End, Space-between, Space-around

### Icons

#### File Type Icons

- **PDF**: `DocumentPdf24Regular`
- **Generic Document**: `Document24Regular`
- **Search**: `Search24Regular`
- **Folder**: `Folder24Regular`

#### UI Icons

- **Security**: `LockClosed24Regular`, `ShieldLock24Regular`
- **Communication**: `Phone24Regular`

## Usage Guidelines

### Color Usage

1. **Primary Blue**: Use for main actions and brand elements
2. **Neutral Colors**: Use for text hierarchy and backgrounds
3. **White/Light**: Use for content backgrounds and cards
4. **Avoid**: Custom colors outside the defined palette

### Spacing Guidelines

1. **Consistent Gaps**: Always use token-based spacing
2. **Component Padding**: 12px-16px for cards and containers
3. **Section Spacing**: 24px-32px between major sections
4. **Element Spacing**: 8px-12px between related elements

### Typography Guidelines

1. **Hierarchy**: Use consistent heading levels (H1 > H2 > H3)
2. **Line Height**: 1.4-1.6 for readability
3. **Text Color**: Use neutral colors for proper contrast
4. **Emphasis**: Use font weight rather than color for emphasis

### Accessibility

1. **Contrast Ratio**: Minimum 4.5:1 for normal text
2. **Focus States**: Visible focus indicators on all interactive elements
3. **Screen Readers**: Proper ARIA labels and semantic HTML
4. **Keyboard Navigation**: Full keyboard accessibility

## Component Examples

### Login Form

```tsx
<Stack tokens={{ childrenGap: 24 }}>
  <TextField placeholder="Enter phone number" styles={{ root: { flexGrow: 1 } }} />
  <PrimaryButton text="Login with Biometrics" style={{ width: "100%" }} />
</Stack>
```

### Document List Item

```tsx
<Stack
  horizontal
  verticalAlign="center"
  tokens={{ childrenGap: 16 }}
  style={{
    padding: 12,
    border: "1px solid #eee",
    borderRadius: 6,
  }}
>
  <DocumentPdf24Regular />
  <Stack grow>
    <h3>Document Title</h3>
    <Stack horizontal tokens={{ childrenGap: 8 }}>
      <span>PDF • 2.5MB • Today</span>
    </Stack>
  </Stack>
  <DefaultButton text="Open" />
</Stack>
```

## Implementation

### Theme Provider Setup

```tsx
import { DocuIdThemeProvider } from "./components/DesignSystem";

function App() {
  return <DocuIdThemeProvider>{/* Your app content */}</DocuIdThemeProvider>;
}
```

### Custom Styling

- **Avoid**: Inline styles where possible
- **Prefer**: Fluent UI styling props and tokens
- **Override**: Only when necessary, using theme-aware values

## Browser Support

- **Modern Browsers**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Office Add-ins**: Compatible with Office 365 web and desktop clients
- **Mobile**: Responsive design for mobile Office apps

## Maintenance

### Regular Updates

1. **Fluent UI**: Keep dependencies updated
2. **Theme Consistency**: Regular audits of color usage
3. **Accessibility**: Ongoing accessibility testing
4. **Performance**: Monitor bundle size and performance

### Documentation Updates

- Update this document when adding new components
- Document any custom styling patterns
- Maintain component usage examples
- Keep accessibility guidelines current
