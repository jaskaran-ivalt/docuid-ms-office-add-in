# DocuID Testing Guide

## Overview

This guide covers comprehensive testing strategies for the DocuID Office Add-in, including unit testing, integration testing, manual testing procedures, and Office-specific testing considerations.

## Testing Strategy

### Testing Pyramid

```
                    ▲
                   /|\
                  / | \
                 /  |  \
                /   |   \
               /    |    \
              /     |     \
             /  E2E |      \
            /  Tests|       \
           /________|________\
          /         |         \
         /  Integration       \
        /    Tests             \
       /______________________ \
      /                         \
     /       Unit Tests          \
    /___________________________\
```

#### Unit Tests (70%)
- Component testing in isolation
- Service method testing
- Utility function testing
- Mock external dependencies

#### Integration Tests (20%)
- API integration testing
- Office.js integration testing
- Component interaction testing
- End-to-end user flows

#### E2E Tests (10%)
- Full Office Add-in workflow testing
- Cross-platform compatibility testing
- Performance and load testing

## Unit Testing

### Testing Framework Setup
Currently using manual testing. For future implementation:

```json
{
  "devDependencies": {
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/user-event": "^14.4.3",
    "jest": "^29.0.0",
    "jest-environment-jsdom": "^29.0.0",
    "@types/jest": "^29.0.0"
  }
}
```

### Component Testing Examples

#### Testing LoginForm Component
```typescript
// LoginForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '../components/LoginForm';
import { AuthService } from '../services/AuthService';

// Mock AuthService
jest.mock('../services/AuthService');

describe('LoginForm', () => {
  const mockOnLogin = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders phone number input', () => {
    render(<LoginForm onLogin={mockOnLogin} isLoading={false} />);
    
    const phoneInput = screen.getByLabelText(/phone number/i);
    expect(phoneInput).toBeInTheDocument();
  });

  test('validates phone number format', async () => {
    const user = userEvent.setup();
    render(<LoginForm onLogin={mockOnLogin} isLoading={false} />);
    
    const phoneInput = screen.getByLabelText(/phone number/i);
    const submitButton = screen.getByRole('button', { name: /login/i });
    
    // Test invalid phone number
    await user.type(phoneInput, 'invalid-phone');
    await user.click(submitButton);
    
    expect(screen.getByText(/invalid phone number format/i)).toBeInTheDocument();
    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  test('calls onLogin with valid phone number', async () => {
    const user = userEvent.setup();
    render(<LoginForm onLogin={mockOnLogin} isLoading={false} />);
    
    const phoneInput = screen.getByLabelText(/phone number/i);
    const submitButton = screen.getByRole('button', { name: /login/i });
    
    await user.type(phoneInput, '+1234567890');
    await user.click(submitButton);
    
    expect(mockOnLogin).toHaveBeenCalledWith('+1234567890');
  });

  test('shows loading state', () => {
    render(<LoginForm onLogin={mockOnLogin} isLoading={true} />);
    
    const submitButton = screen.getByRole('button', { name: /logging in/i });
    expect(submitButton).toBeDisabled();
  });
});
```

#### Testing AuthService
```typescript
// AuthService.test.tsx
import { AuthService } from '../services/AuthService';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    test('stores authentication data on successful login', async () => {
      const phoneNumber = '+1234567890';
      
      await AuthService.login(phoneNumber);
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'docuid_auth',
        expect.stringContaining(phoneNumber)
      );
    });

    test('throws error for invalid phone number', async () => {
      const invalidPhone = '+1234567invalid';
      
      await expect(AuthService.login(invalidPhone)).rejects.toThrow(
        'Invalid phone number'
      );
    });

    test('handles server error scenarios', async () => {
      const errorPhone = '+1234567error';
      
      await expect(AuthService.login(errorPhone)).rejects.toThrow(
        'Server error occurred'
      );
    });
  });

  describe('getStoredAuth', () => {
    test('returns null when no auth data stored', () => {
      localStorage.getItem.mockReturnValue(null);
      
      const result = AuthService.getStoredAuth();
      
      expect(result).toBeNull();
    });

    test('returns stored auth data when valid', () => {
      const mockAuthData = {
        phone: '+1234567890',
        sessionToken: 'mock_token',
        expiresAt: Date.now() + 1000000
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(mockAuthData));
      
      const result = AuthService.getStoredAuth();
      
      expect(result).toEqual(mockAuthData);
    });

    test('removes expired auth data', () => {
      const expiredAuthData = {
        phone: '+1234567890',
        sessionToken: 'mock_token',
        expiresAt: Date.now() - 1000 // Expired
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(expiredAuthData));
      
      const result = AuthService.getStoredAuth();
      
      expect(result).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('docuid_auth');
    });
  });

  describe('isAuthenticated', () => {
    test('returns true when valid auth data exists', () => {
      const mockAuthData = {
        phone: '+1234567890',
        sessionToken: 'mock_token',
        expiresAt: Date.now() + 1000000
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(mockAuthData));
      
      expect(AuthService.isAuthenticated()).toBe(true);
    });

    test('returns false when no auth data exists', () => {
      localStorage.getItem.mockReturnValue(null);
      
      expect(AuthService.isAuthenticated()).toBe(false);
    });
  });
});
```

### DocumentService Testing
```typescript
// DocumentService.test.tsx
import { DocumentService } from '../services/DocumentService';
import { AuthService } from '../services/AuthService';

jest.mock('../services/AuthService');

describe('DocumentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDocuments', () => {
    test('returns mock documents in development', async () => {
      const documents = await DocumentService.getDocuments();
      
      expect(documents).toHaveLength(5);
      expect(documents[0]).toHaveProperty('id');
      expect(documents[0]).toHaveProperty('title');
      expect(documents[0]).toHaveProperty('type');
    });

    test('documents have required properties', async () => {
      const documents = await DocumentService.getDocuments();
      
      documents.forEach(doc => {
        expect(doc).toHaveProperty('id');
        expect(doc).toHaveProperty('title');
        expect(doc).toHaveProperty('type');
        expect(doc).toHaveProperty('dateModified');
        expect(doc).toHaveProperty('size');
      });
    });
  });
});
```

## Integration Testing

### Office.js Integration Testing
```typescript
// Office.integration.test.tsx
describe('Office.js Integration', () => {
  beforeEach(() => {
    // Mock Office.js environment
    global.Office = {
      onReady: jest.fn((callback) => {
        callback({ host: 'Word', platform: 'PC' });
      }),
      context: {
        document: {},
        diagnostics: {}
      }
    };

    global.Word = {
      run: jest.fn(),
      InsertLocation: {
        start: 'Start',
        end: 'End'
      },
      BuiltInStyleName: {
        title: 'Title',
        normal: 'Normal'
      }
    };
  });

  test('initializes Office.js correctly', () => {
    require('../taskpane/index');
    
    expect(Office.onReady).toHaveBeenCalled();
  });

  test('document insertion works', async () => {
    const mockContent = {
      id: '1',
      content: 'Test content',
      contentType: 'text/plain',
      fileName: 'test.txt'
    };

    const mockContext = {
      document: {
        body: {
          insertParagraph: jest.fn(),
          clear: jest.fn()
        }
      },
      sync: jest.fn()
    };

    Word.run.mockImplementation((callback) => {
      return callback(mockContext);
    });

    await DocumentService.openDocument('1');

    expect(Word.run).toHaveBeenCalled();
    expect(mockContext.document.body.insertParagraph).toHaveBeenCalled();
  });
});
```

### API Integration Testing
```typescript
// API.integration.test.tsx
import axios from 'axios';
import { AuthService } from '../services/AuthService';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Integration', () => {
  describe('Authentication API', () => {
    test('login API call format', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          success: true,
          sessionToken: 'test_token',
          message: 'Authentication successful'
        }
      });

      // When we implement real API calls
      // await AuthService.loginWithAPI('+1234567890');

      // expect(mockedAxios.post).toHaveBeenCalledWith(
      //   'https://api.docuid.net/api/auth/login',
      //   {
      //     phoneNumber: '+1234567890',
      //     biometricRequest: true
      //   }
      // );
    });

    test('handles API errors gracefully', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network error'));

      // await expect(AuthService.loginWithAPI('+1234567890'))
      //   .rejects.toThrow('Authentication failed');
    });
  });
});
```

## Manual Testing

### Authentication Flow Testing

#### Test Cases
1. **Valid Phone Number Authentication**
   ```
   Input: +1234567890
   Expected: Successful authentication, token stored, redirect to documents
   
   Steps:
   1. Start the add-in
   2. Enter valid phone number
   3. Click "Login"
   4. Verify loading state shows
   5. Verify success state after 2 seconds
   6. Verify document list loads
   ```

2. **Invalid Phone Number Validation**
   ```
   Test Cases:
   - Empty input: ""
   - Invalid format: "123456"
   - Non-numeric: "abc123"
   - Special scenario: "+1234567invalid"
   
   Expected: Validation error message displayed
   ```

3. **Error Scenario Testing**
   ```
   Input: +1234567error
   Expected: Server error message displayed
   
   Steps:
   1. Enter phone number containing "error"
   2. Click "Login"
   3. Verify error state after timeout
   4. Verify user can retry
   ```

### Document Management Testing

#### Test Cases
1. **Document List Loading**
   ```
   Precondition: User authenticated
   Expected: List of 5 mock documents displayed
   
   Verify:
   - Document titles are visible
   - Document types are shown (pdf, docx, etc.)
   - Modified dates are displayed
   - File sizes are shown
   - "Open" buttons are present
   ```

2. **Document Opening in Word**
   ```
   Steps:
   1. Click "Open" on any document
   2. Verify loading state
   3. Verify content appears in Word document
   4. Verify proper formatting (title, content, timestamp)
   ```

3. **Search Functionality** (Future Implementation)
   ```
   Steps:
   1. Enter search term in search box
   2. Verify filtered results
   3. Clear search
   4. Verify all documents return
   ```

### Office.js Integration Testing

#### Word API Testing
```typescript
// Manual test procedures
const manualTests = {
  officeJSInitialization: {
    description: 'Verify Office.js initializes correctly',
    steps: [
      '1. Open the add-in in Word',
      '2. Check browser console for "Office.js ready" message',
      '3. Verify no Office.js errors in console',
      '4. Confirm add-in UI loads properly'
    ],
    expectedResult: 'Add-in loads without Office.js errors'
  },

  documentInsertion: {
    description: 'Test document content insertion',
    steps: [
      '1. Authenticate successfully',
      '2. Click "Open" on any document',
      '3. Verify content appears in Word',
      '4. Check formatting and styles',
      '5. Verify timestamp is added'
    ],
    expectedResult: 'Document content inserted with proper formatting'
  },

  errorHandling: {
    description: 'Test Office.js error handling',
    steps: [
      '1. Force an Office.js error (disconnect network)',
      '2. Try to open a document',
      '3. Verify graceful error handling',
      '4. Verify user-friendly error message'
    ],
    expectedResult: 'Errors handled gracefully without crashes'
  }
};
```

## Cross-Platform Testing

### Windows Testing
```
Test Environments:
- Windows 10 + Office 365
- Windows 10 + Office 2019
- Windows 11 + Office 365

Test Scenarios:
1. Add-in installation and loading
2. Authentication flow
3. Document operations
4. Performance and responsiveness
5. Security features (HTTPS, certificates)
```

### macOS Testing
```
Test Environments:
- macOS Monterey + Office 365
- macOS Big Sur + Office 2019
- macOS Ventura + Office 365

Test Scenarios:
1. Certificate trust and HTTPS
2. Keyboard shortcuts and navigation
3. Retina display rendering
4. Performance on Apple Silicon
```

## Performance Testing

### Load Testing
```typescript
// Performance test scenarios
const performanceTests = {
  addInLoadTime: {
    metric: 'Time to interactive',
    target: '< 3 seconds',
    test: 'Measure from add-in launch to UI ready'
  },

  authenticationTime: {
    metric: 'Authentication completion',
    target: '< 5 seconds',
    test: 'From login click to document list display'
  },

  documentListLoad: {
    metric: 'Document list rendering',
    target: '< 2 seconds',
    test: 'Time to display mock document list'
  },

  documentInsertion: {
    metric: 'Content insertion in Word',
    target: '< 3 seconds',
    test: 'From "Open" click to content visible in Word'
  }
};
```

### Memory Testing
```typescript
// Memory usage monitoring
const memoryTests = {
  baseline: 'Memory usage after add-in load',
  postAuth: 'Memory usage after authentication',
  postDocLoad: 'Memory usage after document operations',
  memoryLeaks: 'Check for memory leaks during extended use'
};
```

## Security Testing

### Authentication Security
```
Test Cases:
1. Token expiration handling
2. Session storage security
3. Invalid token scenarios
4. HTTPS enforcement
5. Input sanitization
```

### XSS Protection Testing
```typescript
// XSS test cases
const xssTests = [
  '<script>alert("xss")</script>',
  'javascript:alert("xss")',
  '<img src=x onerror=alert("xss")>',
  '"><script>alert("xss")</script>'
];

// Test each in phone number input and document content
```

## Accessibility Testing

### WCAG Compliance
```
Test Areas:
1. Keyboard navigation
2. Screen reader compatibility
3. Color contrast ratios
4. Focus indicators
5. ARIA labels and roles
```

### Screen Reader Testing
```
Tools:
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS)

Test Scenarios:
1. Navigation through UI elements
2. Form input announcement
3. Error message reading
4. Document content accessibility
```

## Browser Compatibility Testing

### Supported Browsers (Office Add-ins)
```
Primary:
- Microsoft Edge (Chromium)
- Internet Explorer 11 (legacy Office)

Secondary:
- Chrome (for development)
- Safari (macOS testing)
```

## Automated Testing Pipeline

### CI/CD Integration (Future Implementation)
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm run lint
      - run: pnpm run test
      - run: pnpm run build
```

## Test Data Management

### Mock Data
```typescript
// Test data for consistent testing
export const mockTestData = {
  users: [
    { phone: '+1234567890', name: 'Test User 1' },
    { phone: '+1234567891', name: 'Test User 2' }
  ],
  
  documents: [
    {
      id: '1',
      title: 'Test Document 1.pdf',
      type: 'pdf',
      size: '1.2 MB',
      dateModified: '2024-01-15'
    }
  ],
  
  authTokens: {
    valid: 'mock_valid_token_123',
    expired: 'mock_expired_token_456',
    invalid: 'mock_invalid_token_789'
  }
};
```

## Test Reporting

### Manual Test Results
```
Test Execution Report:
Date: ___________
Tester: ___________
Environment: ___________

Test Results:
[ ] Authentication Flow - PASS/FAIL
[ ] Document Management - PASS/FAIL  
[ ] Office.js Integration - PASS/FAIL
[ ] Cross-platform Compatibility - PASS/FAIL
[ ] Performance Benchmarks - PASS/FAIL
[ ] Security Validation - PASS/FAIL

Issues Found:
1. ___________
2. ___________

Recommendations:
1. ___________
2. ___________
```

## Best Practices

### Testing Guidelines
1. **Test Early and Often**: Run tests during development
2. **Test Real Scenarios**: Use realistic test data and scenarios
3. **Cross-Platform Testing**: Test on all supported platforms
4. **Performance Monitoring**: Monitor performance during testing
5. **Document Issues**: Clearly document bugs and reproduction steps

### Test Maintenance
1. **Keep Tests Updated**: Update tests when code changes
2. **Review Test Coverage**: Ensure adequate test coverage
3. **Automate Where Possible**: Automate repetitive tests
4. **Manual Testing**: Keep manual testing for complex scenarios

---

*This testing guide should be updated as new testing capabilities are added to the project.*