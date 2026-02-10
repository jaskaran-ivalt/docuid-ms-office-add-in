# DocuID API - Requests & Responses

## Base URL

```
https://dev.docuid.net
```

---

## 🔐 Standard Login

### POST `/api/dashboard/auth/login`

**Request:**

```bash
curl -X POST https://dev.docuid.net/api/dashboard/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "yourpassword"}' \
  -c cookies.txt
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response (200):**

```json
{
  "success": true,
  "user": {
    "userId": 123,
    "name": "John Doe",
    "email": "user@example.com",
    "accountType": "free",
    "status": "active"
  }
}
```

**Response (401):**

```json
{
  "error": "Invalid credentials"
}
```

---

## 🔐 Biometric Authentication

### POST `/api/biometric/auth-request`

**Request:**

```bash
curl -X POST https://dev.docuid.net/api/biometric/auth-request \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"mobile": "+1234567890", "requestFrom": "DocuID"}' \
  -c cookies.txt
```

**Request Body:**

```json
{
  "mobile": "+1234567890",
  "requestFrom": "DocuID"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Authentication request sent"
}
```

**Response (404):**

```json
{
  "error": {
    "detail": "The mobile number provided (+1234567890) was not found."
  }
}
```

### POST `/api/biometric/auth-result`

**Request:**

```bash
curl -X POST https://dev.docuid.net/api/biometric/auth-result \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"mobile": "+1234567890"}' \
  -b cookies.txt
```

**Request Body:**

```json
{
  "mobile": "+1234567890"
}
```

**Response (200):**

```json
{
  "data": {
    "details": {
      "id": 123,
      "name": "John Doe",
      "email": "user@example.com",
      "mobile": "+1234567890",
      "country_code": "+1",
      "address": "123 Main St"
    }
  }
}
```

**Response (401):**

```json
{
  "error": {
    "detail": "Denied - User denied biometric authentication."
  }
}
```

**Response (404):**

```json
{
  "error": {
    "detail": "User not found"
  }
}
```

**Response (422):**

```json
{
  "error": {
    "detail": "Authentication pending"
  }
}
```

---

## 🔐 Session Management

### GET `/api/auth/me`

**Request:**

```bash
curl -X GET https://dev.docuid.net/api/auth/me \
  -b cookies.txt
```

**Response (200):**

```json
{
  "userId": 123,
  "name": "John Doe",
  "email": "user@example.com",
  "accountType": "free",
  "status": "active"
}
```

**Response (401):**

```json
{
  "error": "Not authenticated",
  "debug": {
    "hasToken": false,
    "tokenLength": 0
  }
}
```

### GET `/api/auth/token-info`

**Request:**

```bash
curl -X GET https://dev.docuid.net/api/auth/token-info \
  -b cookies.txt
```

**Response (200):**

```json
{
  "userId": 123,
  "email": "user@example.com",
  "accountType": "free",
  "iat": 1640995200,
  "exp": 1641081600,
  "timeUntilExpiry": 86400000,
  "isValid": true
}
```

**Response (401):**

```json
{
  "error": "Token expired",
  "expired": true
}
```

### POST `/api/auth/set-session`

**Request:**

```bash
curl -X POST https://dev.docuid.net/api/auth/set-session \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 123,
    "email": "user@example.com",
    "name": "John Doe",
    "accountType": "free"
  }' \
  -c cookies.txt
```

**Request Body:**

```json
{
  "userId": 123,
  "email": "user@example.com",
  "name": "John Doe",
  "accountType": "free"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Session cookies set successfully"
}
```

**Response (400):**

```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "invalid_type",
      "expected": "number",
      "received": "string",
      "path": ["userId"],
      "message": "Expected number, received string"
    }
  ]
}
```

### POST `/api/auth/logout`

**Request:**

```bash
curl -X POST https://dev.docuid.net/api/auth/logout \
  -b cookies.txt \
  -c cookies.txt
```

**Response (200):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Response (500):**

```json
{
  "error": "Internal Server Error"
}
```

---

## 🔐 Status Codes

| Code  | Description           |
| ----- | --------------------- |
| `200` | Success               |
| `400` | Bad Request           |
| `401` | Unauthorized          |
| `403` | Forbidden             |
| `404` | Not Found             |
| `422` | Unprocessable Entity  |
| `500` | Internal Server Error |

---

## 🔐 Cookie Configuration

| Cookie         | Purpose       | Expiry   |
| -------------- | ------------- | -------- |
| `token`        | Access token  | 24 hours |
| `refreshToken` | Refresh token | 7 days   |

**Cookie Settings:**

- Domain: `.docuid.net`
- Secure: `true`
- SameSite: `none`
- HttpOnly: `true`
- Path: `/`
