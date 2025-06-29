# DocuID API Documentation

## Overview
This document outlines the API endpoints required for the DocuID Office Add-in to integrate with the backend services for biometric authentication and document management.

**Base URL:** `https://api.docuid.net`  
**Authentication:** Bearer Token (JWT)  
**Content-Type:** `application/json`

---

## Authentication APIs

### 1. Initiate Login
Initiates the biometric authentication process for a user.

**Endpoint:** `POST /api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "phoneNumber": "+1234567890",
  "biometricRequest": true,
  "deviceInfo": {
    "platform": "office-addin",
    "version": "1.0.0",
    "userAgent": "Microsoft Office/16.0"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Biometric verification initiated",
  "sessionId": "sess_abc123def456",
  "expiresIn": 300,
  "verificationUrl": "https://ivalt.example.com/verify/sess_abc123def456"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "INVALID_PHONE_NUMBER",
  "message": "The provided phone number is not valid"
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": "USER_NOT_FOUND",
  "message": "No user found with this phone number"
}
```

### 2. Verify Authentication
Checks the status of biometric verification and returns authentication token.

**Endpoint:** `GET /api/auth/verify/{sessionId}`

**Headers:**
```
Content-Type: application/json
```

**Response (200 OK - Verified):**
```json
{
  "success": true,
  "status": "verified",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here",
  "expiresIn": 86400,
  "user": {
    "id": "user_123",
    "phoneNumber": "+1234567890",
    "name": "John Doe",
    "permissions": ["read_documents", "download_documents"]
  }
}
```

**Response (200 OK - Pending):**
```json
{
  "success": true,
  "status": "pending",
  "message": "Biometric verification pending"
}
```

**Response (200 OK - Failed):**
```json
{
  "success": false,
  "status": "failed",
  "error": "VERIFICATION_FAILED",
  "message": "Biometric verification failed or expired"
}
```

### 3. Refresh Token
Refreshes the authentication token using a refresh token.

**Endpoint:** `POST /api/auth/refresh`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {refreshToken}
```

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "accessToken": "new_access_token_here",
  "expiresIn": 86400
}
```

### 4. Logout
Invalidates the current session and tokens.

**Endpoint:** `POST /api/auth/logout`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

---

## Document Management APIs

### 1. Get User Documents
Retrieves a list of documents accessible to the authenticated user.

**Endpoint:** `GET /api/documents`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of documents per page (default: 20, max: 100)
- `search` (optional): Search query for document titles
- `type` (optional): Filter by document type (pdf, docx, xlsx, etc.)
- `sortBy` (optional): Sort field (title, dateModified, size) (default: dateModified)
- `sortOrder` (optional): Sort order (asc, desc) (default: desc)

**Example Request:**
```
GET /api/documents?page=1&limit=10&search=report&type=pdf&sortBy=dateModified&sortOrder=desc
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "doc_123",
        "title": "Annual Report 2024.pdf",
        "type": "pdf",
        "size": 2453632,
        "sizeFormatted": "2.3 MB",
        "dateCreated": "2024-01-15T10:30:00Z",
        "dateModified": "2024-01-15T14:45:00Z",
        "dateModifiedFormatted": "2024-01-15",
        "permissions": ["read", "download"],
        "metadata": {
          "author": "John Doe",
          "category": "Financial",
          "tags": ["annual", "report", "2024"]
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1,
      "hasNext": false,
      "hasPrevious": false
    }
  }
}
```

### 2. Get Document Details
Retrieves detailed information about a specific document.

**Endpoint:** `GET /api/documents/{documentId}`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "doc_123",
    "title": "Annual Report 2024.pdf",
    "type": "pdf",
    "size": 2453632,
    "sizeFormatted": "2.3 MB",
    "dateCreated": "2024-01-15T10:30:00Z",
    "dateModified": "2024-01-15T14:45:00Z",
    "permissions": ["read", "download"],
    "metadata": {
      "author": "John Doe",
      "category": "Financial",
      "tags": ["annual", "report", "2024"],
      "description": "Annual financial report for 2024",
      "pageCount": 45
    },
    "versions": [
      {
        "version": "1.0",
        "dateCreated": "2024-01-15T10:30:00Z",
        "author": "John Doe",
        "changes": "Initial version"
      }
    ]
  }
}
```

### 3. Get Document Content
Retrieves the content of a document for viewing/editing in Office applications.

**Endpoint:** `GET /api/documents/{documentId}/content`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `format` (optional): Output format (text, html, office) (default: office)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "doc_123",
    "title": "Annual Report 2024.pdf",
    "content": "Document content here...",
    "contentType": "text/plain",
    "format": "text",
    "encoding": "utf-8",
    "metadata": {
      "wordCount": 1250,
      "characterCount": 7500
    }
  }
}
```

### 4. Download Document
Downloads the original document file.

**Endpoint:** `GET /api/documents/{documentId}/download`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
- Returns the file as binary data
- Content-Type: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, etc.
- Content-Disposition: `attachment; filename="Annual Report 2024.pdf"`

### 5. Search Documents
Advanced search functionality for documents.

**Endpoint:** `POST /api/documents/search`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "query": "financial report",
  "filters": {
    "type": ["pdf", "docx"],
    "dateRange": {
      "from": "2024-01-01",
      "to": "2024-12-31"
    },
    "author": "John Doe",
    "category": "Financial",
    "tags": ["report", "2024"]
  },
  "sortBy": "relevance",
  "sortOrder": "desc",
  "page": 1,
  "limit": 10
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "documents": [...],
    "pagination": {...},
    "searchMetadata": {
      "query": "financial report",
      "totalMatches": 5,
      "searchTime": 0.045
    }
  }
}
```

---

## Error Handling

### Standard Error Response Format
All API endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    "field": "Additional error details if applicable"
  },
  "timestamp": "2024-01-15T14:45:00Z",
  "requestId": "req_abc123"
}
```

### Error Codes

#### Authentication Errors
- `INVALID_PHONE_NUMBER` - The phone number format is invalid
- `USER_NOT_FOUND` - No user exists with the provided phone number
- `VERIFICATION_FAILED` - Biometric verification failed
- `VERIFICATION_EXPIRED` - Verification session expired
- `INVALID_TOKEN` - The provided token is invalid or expired
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions

#### Document Errors
- `DOCUMENT_NOT_FOUND` - Document does not exist or user lacks access
- `DOCUMENT_ACCESS_DENIED` - User does not have permission to access document
- `DOCUMENT_PROCESSING_ERROR` - Error occurred while processing document
- `DOCUMENT_TOO_LARGE` - Document exceeds size limits
- `UNSUPPORTED_FORMAT` - Document format is not supported

#### General Errors
- `INTERNAL_SERVER_ERROR` - Unexpected server error
- `RATE_LIMIT_EXCEEDED` - Too many requests from client
- `SERVICE_UNAVAILABLE` - Service temporarily unavailable
- `VALIDATION_ERROR` - Request validation failed

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authentication endpoints:** 5 requests per minute
- **Document list/search:** 60 requests per minute
- **Document content/download:** 30 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1642234567
```

---

## Security Considerations

1. **HTTPS Only:** All API calls must use HTTPS
2. **Token Security:** Store tokens securely, never in plain text
3. **Token Expiration:** Implement proper token refresh logic
4. **Input Validation:** Validate all input data
5. **CORS:** Proper CORS configuration for Office Add-in domains

---

## Integration Examples

### JavaScript/TypeScript Example
```typescript
import axios from 'axios';

class DocuIDAPI {
  private baseURL = 'https://api.docuid.net';
  private accessToken: string | null = null;

  async login(phoneNumber: string): Promise<void> {
    const response = await axios.post(`${this.baseURL}/api/auth/login`, {
      phoneNumber,
      biometricRequest: true,
      deviceInfo: {
        platform: 'office-addin',
        version: '1.0.0'
      }
    });

    const { sessionId } = response.data;
    
    // Poll for verification
    const authResult = await this.pollForVerification(sessionId);
    this.accessToken = authResult.accessToken;
  }

  private async pollForVerification(sessionId: string): Promise<any> {
    const maxAttempts = 60; // 5 minutes
    let attempts = 0;

    while (attempts < maxAttempts) {
      const response = await axios.get(`${this.baseURL}/api/auth/verify/${sessionId}`);
      
      if (response.data.status === 'verified') {
        return response.data;
      } else if (response.data.status === 'failed') {
        throw new Error('Verification failed');
      }

      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      attempts++;
    }

    throw new Error('Verification timeout');
  }

  async getDocuments(): Promise<any[]> {
    const response = await axios.get(`${this.baseURL}/api/documents`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    return response.data.data.documents;
  }
}
```

---

## Testing

### Postman Collection
A Postman collection is available for testing all API endpoints:
- Import the collection from: `https://api.docuid.net/postman/collection.json`
- Set up environment variables for base URL and tokens

### Test Accounts
Development environment test accounts:
- Phone: `+1234567890` (auto-approves biometric verification)
- Phone: `+1234567891` (auto-rejects biometric verification)
- Phone: `+1234567892` (times out biometric verification)

---

## Changelog

### Version 1.0.0 (2024-01-15)
- Initial API specification
- Authentication endpoints
- Document management endpoints
- Error handling specifications 