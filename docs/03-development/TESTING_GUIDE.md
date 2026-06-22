# DocuID Testing Guide

## Overview

The DocuID Office Add-in does not currently have an automated test suite. All testing is manual. This guide documents the manual testing procedures for each feature area.

If an automated framework is added in future, the recommended approach is Vitest with `@testing-library/react` for component tests, and Playwright for end-to-end flows.

---

## Testing Setup

No test runner setup is required. Testing is done by running the add-in locally and exercising features directly in Office.

**Start the local dev environment:**

```bash
bun run dev-server          # terminal 1: webpack HTTPS server
bun run dev:word            # terminal 2: sideload in Word
# or dev:excel / dev:powerpoint
```

Use the debug panel (Ctrl+Shift+D) to inspect logs during testing.

---

## Authentication Testing

### Happy path

1. Open the add-in task pane
2. Enter a registered phone number with country code (e.g., `+15551234567`)
3. Approve the biometric push on the associated iVALT mobile app
4. Verify the document list loads after successful authentication
5. Verify the JWT token is stored in localStorage under `docuid_auth`

### Validation errors

| Input          | Expected result                              |
|----------------|----------------------------------------------|
| Empty          | Validation error, submit blocked             |
| `123456`       | Validation error (no country code)           |
| Invalid format | Validation error message displayed           |

### Session persistence

1. Log in successfully
2. Close and reopen the task pane
3. Verify the user remains authenticated (no re-login required before token expiry)

### Logout

1. Click the logout button in the header
2. Verify the login form is shown
3. Verify `docuid_auth` is removed from localStorage

### Token expiry

1. Manually set `docuid_auth` in localStorage with a past `expiresAt` timestamp
2. Reload the task pane
3. Verify the user is shown the login form (expired session not accepted)

---

## Document List Testing

1. Authenticate successfully
2. Verify the document list loads with titles, types, and dates
3. Verify the search box filters results as you type
4. Clear the search — verify all documents return

---

## Document Insertion Testing

Test in each supported host.

### Word

1. Authenticate and select a document
2. Click "Open"
3. Verify content is inserted into the Word document body
4. Verify formatting (title, paragraphs) is applied correctly

### Excel

1. Load the add-in via `bun run dev:excel`
2. Authenticate and select a document
3. Click "Open"
4. Verify data is inserted into the active sheet

### PowerPoint

1. Load the add-in via `bun run dev:powerpoint`
2. Authenticate and select a document
3. Click "Open"
4. Verify content appears on the active slide

---

## Sharing and Download Testing

### Sharing

1. Open `ShareSidebar` for a document
2. Complete the share flow
3. Verify `ShareSuccessModal` appears after a successful share

### Download

1. Open `DownloadSheet` for a document
2. Verify the download flow completes and the file is accessible

---

## Profile Page Testing

1. Navigate to the profile page from the header
2. Verify personal info and account info sections load with correct data
3. Test any editable fields for save/cancel behavior

---

## Debug Panel

The debug panel surfaces all structured logs from services.

1. Press `Ctrl+Shift+D` to open
2. Reproduce the feature being tested
3. Check relevant log contexts:

| Context                   | What it tracks                              |
|---------------------------|---------------------------------------------|
| `AuthService`             | Login attempts, token lifecycle             |
| `AuthService.API`         | API call timings and HTTP status codes      |
| `AuthService.Poll`        | Biometric polling attempts and results      |
| `AuthService.Storage`     | Token read/write to localStorage            |
| `DocumentService`         | Document fetch and insertion actions        |
| `DocumentService.Office`  | Office.js API calls and errors              |
| `App`                     | Component lifecycle and state changes       |

To export logs for reporting: click "Export" in the debug panel to download as JSON.

---

## Cross-Platform Testing

Test on both platforms before any AppSource submission.

### Windows

- Office 365 (latest)
- Office 2019 or 2021

### macOS

- Office 365 (latest)
- Verify certificate trust is working (`npx office-addin-dev-certs install`)
- Test Retina display rendering

### Office hosts to cover

- Microsoft Word
- Microsoft Excel
- Microsoft PowerPoint

---

## Security Testing

| Scenario                          | Expected result                              |
|-----------------------------------|----------------------------------------------|
| Expired JWT in localStorage       | Redirected to login, token cleared           |
| Modified/invalid JWT              | API calls fail, user redirected to login     |
| XSS in phone number input         | Input sanitized, no script execution         |
| Direct navigation without auth    | Document list not accessible                 |

---

## Performance Benchmarks

| Metric                       | Target         |
|------------------------------|----------------|
| Add-in task pane load        | Under 3 seconds|
| Authentication completion    | Under 10 seconds (includes biometric push)|
| Document list render         | Under 2 seconds|
| Document insertion (Word)    | Under 3 seconds|

---

## Pre-Release Checklist

Before submitting an AppSource update:

- [ ] Authentication flow tested on Windows and macOS
- [ ] Document insertion tested in Word, Excel, and PowerPoint
- [ ] Sharing and download flows verified
- [ ] Profile page loads correctly
- [ ] Debug panel shows no unexpected errors during normal use
- [ ] Production manifests validated: `bun run validate:word`, `validate:excel`, `validate:powerpoint`, `validate:prod`
- [ ] Production build succeeds: `bun run build`
- [ ] Version number incremented in all production manifests
- [ ] Screenshots updated if UI has changed
