# DocuID Development Guide

## Overview

This guide provides comprehensive instructions for setting up, developing, and maintaining the DocuID Office Add-in. It covers everything from initial environment setup to advanced development workflows.

## Prerequisites

### Required Software

- **Node.js**: LTS version (18.x or higher)
- **Package Manager**: pnpm (recommended) or npm
- **IDE**: Visual Studio Code (recommended)
- **Office Application**: Microsoft Word (Office 365 or Office 2019+)
- **Operating System**: Windows 10+ or macOS 10.14+

### Development Tools

```bash
# Install global dependencies
npm install -g yo generator-office
npm install -g pnpm

# Verify installations
node --version    # Should be 18.x or higher
pnpm --version    # Should be 7.x or higher
yo --version      # Should be 4.x or higher
```

## Environment Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd DocuID

# Install dependencies
pnpm install

# Verify installation
pnpm run build:dev
```

### 2. Development Certificates

The project uses HTTPS for Office Add-in requirements. Certificates are automatically managed by `office-addin-dev-certs`.

```bash
# Certificates are auto-generated on first run
# Trust the certificate when prompted
pnpm run dev-server
```

### 3. Office Configuration

```bash
# Sign in to M365 account (if using Office 365)
pnpm run signin

# Start development with automatic sideloading
pnpm start
```

## Project Structure Deep Dive

### Source Code Organization

```
src/
├── taskpane/                 # Main React application
│   ├── App.tsx              # Root component with state management
│   ├── index.tsx            # Entry point and Office.js initialization
│   ├── components/          # Reusable UI components
│   │   ├── Header.tsx       # App header with user info
│   │   ├── LoginForm.tsx    # Authentication form
│   │   └── DocumentList.tsx # Document listing and management
│   ├── services/            # Business logic and API integration
│   │   ├── AuthService.ts   # Authentication and session management
│   │   └── DocumentService.ts # Document operations and Office.js
│   ├── taskpane.html        # HTML template
│   ├── taskpane.css         # Styling
│   └── taskpane.ts          # Office.js initialization
└── commands/                # Office ribbon commands
    ├── commands.html        # Commands HTML template
    └── commands.ts          # Command implementations
```

### Configuration Files

```
├── package.json             # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── webpack.config.js       # Build configuration
├── babel.config.json       # Transpilation settings
├── manifest.xml            # Office Add-in manifest
└── .eslintrc.json         # Code quality rules
```

## Development Workflow

### 1. Starting Development

```bash
# Start development server with hot reload
pnpm run dev-server

# Start with automatic Office sideloading (recommended)
pnpm start

# Build for development (without server)
pnpm run build:dev
```

### 2. Code Development Process

#### Component Development

```typescript
// Example: Creating a new component
import React, { useState, useEffect } from 'react';

interface Props {
  // Define props interface
}

export const NewComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  const [state, setState] = useState<StateType>(initialState);

  useEffect(() => {
    // Component lifecycle logic
  }, [dependencies]);

  return (
    <div className="new-component">
      {/* JSX content */}
    </div>
  );
};

export default NewComponent;
```

#### Service Development

```typescript
// Example: Extending a service
export class ExtendedService {
  private static readonly API_BASE = "https://dev.docuid.net";

  static async newMethod(param: string): Promise<Result> {
    try {
      const token = AuthService.getSessionToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await axios.get(`${this.API_BASE}/endpoint`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (error) {
      throw new Error("Operation failed");
    }
  }
}
```

### 3. Testing During Development

#### Manual Testing

```bash
# Start with specific Office application
pnpm start --host word

# Test specific scenarios
# 1. Authentication flow with various phone numbers
# 2. Document list loading and display
# 3. Document opening in Word
# 4. Error handling and edge cases
```

#### Phone Number Test Cases

```typescript
// Test authentication with different scenarios
const testPhoneNumbers = {
  valid: "+1234567890", // Success scenario
  invalid: "+1234567invalid", // Triggers validation error
  error: "+1234567error", // Triggers server error
  timeout: "+1234567timeout", // Triggers timeout scenario
};
```

### 4. Code Quality and Linting

```bash
# Run ESLint
pnpm run lint

# Auto-fix ESLint issues
pnpm run lint:fix

# Format code with Prettier
pnpm run prettier

# Validate manifest file
pnpm run validate
```

## Advanced Development

### Office.js Integration

#### Word API Usage

```typescript
// Example: Advanced document manipulation
export class AdvancedDocumentService {
  static async insertFormattedContent(content: DocumentContent): Promise<void> {
    return Word.run(async (context) => {
      const body = context.document.body;

      // Insert title with custom styling
      const title = body.insertParagraph(content.title, Word.InsertLocation.start);
      title.styleBuiltIn = Word.BuiltInStyleName.title;
      title.font.color = "#2b579a";
      title.font.size = 18;

      // Insert content with formatting
      const contentParagraph = body.insertParagraph(content.text, Word.InsertLocation.end);
      contentParagraph.styleBuiltIn = Word.BuiltInStyleName.normal;

      // Insert table if data available
      if (content.tableData) {
        const table = body.insertTable(
          content.tableData.rows,
          content.tableData.cols,
          Word.InsertLocation.end
        );
        table.styleBuiltIn = Word.BuiltInStyleName.gridTable4Accent1;

        // Populate table data
        content.tableData.data.forEach((row, rowIndex) => {
          row.forEach((cell, colIndex) => {
            table.getCell(rowIndex, colIndex).body.insertText(cell, Word.InsertLocation.replace);
          });
        });
      }

      await context.sync();
    });
  }
}
```

#### Error Handling Best Practices

```typescript
// Robust error handling for Office.js
class OfficeErrorHandler {
  static async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof OfficeExtension.Error) {
        console.error(`Office.js Error in ${context}:`, error.code, error.message);
        throw new Error(`Office operation failed: ${error.message}`);
      } else {
        console.error(`General Error in ${context}:`, error);
        throw new Error(`Operation failed: ${context}`);
      }
    }
  }
}
```

### State Management Patterns

#### React Hooks Pattern

```typescript
// Custom hook for authentication state
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (phoneNumber: string) => {
    setLoading(true);
    try {
      await AuthService.login(phoneNumber);
      setIsAuthenticated(true);
      setUser(AuthService.getCurrentUser());
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    AuthService.logout();
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  useEffect(() => {
    const savedAuth = AuthService.getStoredAuth();
    if (savedAuth) {
      setIsAuthenticated(true);
      setUser(savedAuth.user);
    }
  }, []);

  return { isAuthenticated, user, loading, login, logout };
};
```

#### Context Pattern for Global State

```typescript
// Auth context provider
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (phoneNumber: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authState = useAuth();

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};
```

## API Integration Development

### Development vs Production APIs

```typescript
// Environment-aware API configuration
class APIConfig {
  static getBaseURL(): string {
    if (process.env.NODE_ENV === "development") {
      return "http://localhost:3001"; // Mock server
    }
    return "https://dev.docuid.net"; // Production API
  }

  static getEndpoints() {
    return {
      auth: {
        login: `${this.getBaseURL()}/api/auth/login`,
        verify: `${this.getBaseURL()}/api/auth/verify`,
        refresh: `${this.getBaseURL()}/api/auth/refresh`,
        logout: `${this.getBaseURL()}/api/auth/logout`,
      },
      documents: {
        list: `${this.getBaseURL()}/api/documents`,
        detail: `${this.getBaseURL()}/api/documents/:id`,
        content: `${this.getBaseURL()}/api/documents/:id/content`,
        download: `${this.getBaseURL()}/api/documents/:id/download`,
      },
    };
  }
}
```

### Mock Server Setup

```typescript
// Development mock server
export class MockAPIServer {
  static setupMockEndpoints() {
    // Mock authentication
    this.mockAuthEndpoints();

    // Mock document endpoints
    this.mockDocumentEndpoints();
  }

  private static mockAuthEndpoints() {
    // Implementation for mock auth endpoints
  }

  private static mockDocumentEndpoints() {
    // Implementation for mock document endpoints
  }
}
```

## Debugging and Troubleshooting

### Common Development Issues

#### 1. Add-in Not Loading

```bash
# Check if certificates are trusted
pnpm run dev-server

# Verify manifest syntax
pnpm run validate

# Check console for errors
# Open browser developer tools in Office
```

#### 2. Authentication Issues

```typescript
// Debug authentication state
const debugAuth = () => {
  console.log("Auth State:", {
    isAuthenticated: AuthService.isAuthenticated(),
    storedAuth: AuthService.getStoredAuth(),
    sessionToken: AuthService.getSessionToken(),
  });
};
```

#### 3. Office.js Issues

```typescript
// Debug Office.js initialization
Office.onReady((info) => {
  console.log("Office.js ready:", {
    host: info.host,
    platform: info.platform,
    isSupported: Office.context !== undefined,
  });
});
```

### Development Tools

#### Browser Developer Tools

- **Console**: Error messages and debug logs
- **Network**: API call monitoring
- **Application**: localStorage inspection
- **Sources**: Breakpoint debugging

#### Office Add-in Debugging

```typescript
// Enable debug logging
localStorage.setItem("docuid_debug", "true");

// Office.js debugging
if (Office.context.diagnostics) {
  console.log("Office diagnostics:", Office.context.diagnostics);
}
```

## Performance Optimization

### Bundle Optimization

```javascript
// Webpack configuration for performance
module.exports = {
  optimization: {
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all",
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
};
```

### React Performance

```typescript
// Memoization for expensive operations
const ExpensiveComponent = React.memo(({ data }) => {
  const processedData = useMemo(() => {
    return expensiveCalculation(data);
  }, [data]);

  return <div>{processedData}</div>;
});

// Callback memoization
const DocumentList = () => {
  const handleDocumentClick = useCallback((docId: string) => {
    DocumentService.openDocument(docId);
  }, []);

  return (
    <div>
      {documents.map(doc => (
        <DocumentItem key={doc.id} onClick={handleDocumentClick} />
      ))}
    </div>
  );
};
```

## Best Practices

### Code Organization

1. **Single Responsibility**: Each component/service has one clear purpose
2. **Consistent Naming**: Use descriptive, consistent naming conventions
3. **Type Safety**: Leverage TypeScript for type safety
4. **Error Boundaries**: Implement error boundaries for graceful failure handling

### Security Best Practices

1. **Input Validation**: Validate all user inputs
2. **Secure Storage**: Use secure methods for sensitive data storage
3. **Error Handling**: Don't expose sensitive information in error messages
4. **HTTPS**: Always use HTTPS in production

### Performance Best Practices

1. **Lazy Loading**: Load components and data on demand
2. **Memoization**: Cache expensive calculations
3. **Bundle Splitting**: Split code for optimal loading
4. **Image Optimization**: Optimize assets for fast loading

## Deployment Preparation

### Production Build

```bash
# Create production build
pnpm run build

# Verify build output
ls -la dist/

# Test production build locally
# Serve dist/ folder with HTTPS server
```

### Pre-deployment Checklist

- [ ] All tests passing
- [ ] Code quality checks passed
- [ ] Security audit completed
- [ ] Performance optimizations applied
- [ ] Documentation updated
- [ ] Manifest configured for production URLs
- [ ] API endpoints configured for production
- [ ] SSL certificates configured
- [ ] CORS settings verified

---

_This development guide is regularly updated with new patterns and best practices. For questions or improvements, please refer to the project team._
