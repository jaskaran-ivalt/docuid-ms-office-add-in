# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Primary Development Commands

- `bun run dev-server` - Start HTTPS development server on port 3000
- `bun run start` - Start development server and sideload add-in in Word
- `bun run build` - Production build
- `bun run build:dev` - Development build
- `bun run lint` - Run ESLint with Office Add-ins plugin
- `bun run lint:fix` - Auto-fix ESLint issues
- `bun run validate` - Validate manifest.xml
- `bun run prettier` - Format code with Prettier

### Office Add-in Specific Commands

- `bun run signin` - Sign in to M365 account for testing
- `bun run signout` - Sign out of M365 account
- `bun run stop` - Stop sideloaded add-in

### Testing Commands

- Manual testing is done through `bun run start` which sideloads in Word
- Test with different phone numbers in AuthService: include "invalid" or "error" to test error scenarios

## Architecture Overview

### Technology Stack

- **Frontend**: React 19 with TypeScript, targeting ES5 for Office compatibility
- **Build System**: Webpack 5 with Babel for transpilation
- **Office Integration**: Office.js API for Word document manipulation
- **Authentication**: Mock biometric authentication via phone number (production: docuid.net + iVALT)
- **Styling**: CSS modules with responsive design for Office task pane

### Project Structure

```
src/
├── taskpane/          # Main React application
│   ├── App.tsx        # Root component with auth state management
│   ├── components/    # React components (Header, LoginForm, DocumentList)
│   ├── services/      # Business logic (AuthService, DocumentService)
│   └── index.tsx      # Entry point
└── commands/          # Office ribbon commands
```

### Key Architectural Patterns

#### Authentication Flow

- Phone number input → Mock biometric verification → Session token storage
- AuthService handles localStorage persistence with 24-hour expiration
- Production ready for docuid.net API integration (currently commented out)

#### Document Management

- DocumentService provides mock documents for development
- Office.js integration inserts content into Word documents using Word.run()
- Supports document metadata display (title, type, size, date)

#### State Management

- React hooks (useState, useEffect) for component state
- No external state management library - using local component state
- Authentication state managed in App.tsx and persisted via AuthService

#### Office Add-in Architecture

- manifest.xml configures add-in permissions and entry points
- Webpack replaces localhost URLs with production URLs for deployment
- HTTPS required for Office Add-in security requirements

## Development Environment

### Configuration Files

- `tsconfig.json` - TypeScript with ES5 target for Office compatibility
- `webpack.config.js` - Configures HTTPS dev server, manifest URL replacement
- `babel.config.json` - Transpilation for React/TypeScript to ES5
- `package.json` - Development server runs on port 3000
- `.eslintrc.json` - Uses office-addins plugin for Office-specific linting

### Path Aliases

- `@/*` resolves to `./src/*` for cleaner imports
- Configured in both tsconfig.json and webpack.config.js

### Development vs Production

- Development: Uses localhost:3000 with self-signed certificates
- Production: URLs replaced with production domain in manifest.xml during build
- Mock authentication and documents in development mode

## API Integration

### Current Implementation

- **AuthService**: Mock authentication with localStorage session management
- **DocumentService**: Mock document data with simulated API delays
- Production API calls commented out but ready for integration

### Production API Integration

- Base URL: https://dev.docuid.net
- JWT token authentication
- Document CRUD operations
- Error handling for network failures and authentication errors

## Office.js Integration

### Word API Usage

- `Word.run()` for document manipulation
- Inserts content using `context.document.body.insertParagraph()`
- Applies Word built-in styles (Title, Normal)
- Includes metadata and timestamps in inserted content

### Add-in Manifest

- Targets Word (Document host)
- ReadWriteDocument permissions
- Ribbon button in Home tab
- Desktop form factor support

## Testing Strategy

### Development Testing

- Use `bun run start` to sideload in Word
- Test authentication with different phone numbers
- Verify document list loading and Office.js integration

### Error Scenarios

- Phone numbers containing "invalid" or "error" trigger test failures
- Network simulation with setTimeout delays
- Token expiration handling

## Security Considerations

- HTTPS enforced for Office Add-in requirements
- Session tokens stored in localStorage with expiration
- Input validation for phone numbers
- CORS headers configured for Office Add-in domains
- No sensitive data in localStorage (production will use secure token storage)

## Deployment Notes

### Development Deployment

- Self-signed certificates via office-addin-dev-certs
- Webpack dev server with HTTPS on port 3000
- Automatic add-in sideloading for testing

### Production Deployment

- Update webpack.config.js production URL (line 8)
- Build with `bun run build`
- Deploy to HTTPS-enabled hosting
- Update manifest.xml URLs to production endpoints
- Configure API base URLs in service classes

## Code Conventions

### TypeScript Patterns

- Interface definitions for API responses and data structures
- Async/await for all API calls
- Error handling with try/catch blocks
- Type safety for Office.js API calls

### React Patterns

- Functional components with hooks
- Props interfaces for type safety
- Error boundary pattern for graceful error handling
- Loading states for all async operations

### Office Add-in Patterns

- Office.js API calls wrapped in service methods
- Proper context synchronization with `await context.sync()`
- Graceful fallbacks for unsupported Office features
