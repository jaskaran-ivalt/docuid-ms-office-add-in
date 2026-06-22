# Product Requirements Document (PRD) for DocuID Office Add-in

**Version:** 1.2
**Date:** 22 June 2026
**Status:** Shipped — live on Microsoft AppSource

---

## 1. Overview

**Goal:**
A Microsoft Office Add-in named **DocuID** that allows users to securely authenticate via the **iVALT biometric system** (through the DocuID backend) and access a personalized panel displaying documents they are authorized to view or insert.

**Target Applications:**

- Microsoft Word
- Microsoft Excel
- Microsoft PowerPoint

**Platform Support:**

- Windows (Microsoft 365, Office 2019+)
- macOS (Microsoft 365, Office 2019+)

**Live listing:** [Microsoft AppSource](https://marketplace.microsoft.com/en-us/product/wa200010668?tab=overview)

---

## 2. Core Features

### Authentication

- User logs in using their mobile number with country code
- Authentication is handled via DocuID.net, which integrates with iVALT for biometric push verification on the user's registered device
- The backend verifies the user and returns a session token and user profile
- JWT token is stored in localStorage with expiration tracking
- All API calls send `Authorization: Bearer <token>`

### Document Access Panel

- After authentication, the user sees a panel inside the Office Add-in
- The panel fetches and displays a list of documents available to the user from the backend
- Each document entry includes title, type, last modified date, and an Open/Insert button
- Real-time search filters the document list

### Document Insertion

- Clicking "Open" inserts document content directly into the active Office application
- Word: inserts via `Word.run()` with paragraph insertion
- Excel: inserts via `Excel.run()` with range/cell operations
- PowerPoint: inserts via `PowerPoint.run()` with slide shape insertion

### Sharing and Download

- Users can share documents via `ShareSidebar`
- Download flow handled by `DownloadSheet`
- QR code generation available for document links

### Profile

- Authenticated users can view and manage their profile (personal info, account info)

---

## 3. User Flow

1. User opens the DocuID task pane in Word, Excel, or PowerPoint
2. User enters their registered phone number with country code
3. iVALT biometric verification push is sent to the user's mobile device
4. On successful verification, the user sees their authorized document list
5. User browses or searches for a document and clicks "Open"
6. Document content is inserted into the current Office document

---

## 4. System Architecture

The add-in is a React + TypeScript single-page application served from `https://addon.docuid.net` (Vercel). It communicates with `DocuID.net` REST APIs for authentication and document operations.

See [Technical Architecture](../02-technical/ARCHITECTURE.md) for detail.

---

## 5. Technical Requirements

### Frontend (Office Add-in)

- **Framework:** React 19 with TypeScript, ES5 target for Office compatibility
- **Build:** Webpack 5 with Babel transpilation
- **Linter/Formatter:** Biome
- **Package Manager:** Bun (enforced)
- **Office Integration:** Office.js API for Word, Excel, and PowerPoint
- **Hosting:** Vercel (`https://addon.docuid.net`)

### Backend

- **Service:** DocuID.net
- **APIs:** REST endpoints for authentication, document listing, document content, sharing, and download
- **Auth:** iVALT biometric verification integrated into docuid.net

### Authentication

- Token-based (JWT), stored in localStorage with expiration
- Biometric push to registered mobile device via iVALT
- Session cleared on logout or token expiry

### Storage

- Document content served via DocuID.net (backed by cloud storage managed by the backend)

---

## 6. Milestones — Completed

| Milestone | Description | Status |
|-----------|-------------|--------|
| M1 | Project scaffolding, React architecture, UI design | Complete |
| M2 | Real API integration — login via DocuID.net + iVALT biometric | Complete |
| M3 | Document listing, search, insertion into Word | Complete |
| M4 | Excel and PowerPoint host support | Complete |
| M5 | Sharing, download, QR codes, profile page | Complete |
| M6 | AppSource submission, certification, and publication | Complete |

---

## 7. Current Implementation Status

The add-in is fully built and published. All milestones are complete.

**What is live:**

- Biometric authentication via phone number and iVALT push
- Document listing and real-time search
- Document insertion in Word, Excel, and PowerPoint
- Document sharing and download flows
- User profile page
- Debug panel for development and support (Ctrl+Shift+D)
- Windows installer for enterprise distribution

**Current version:** 1.0.2.0

**Live URL:** [https://marketplace.microsoft.com/en-us/product/wa200010668?tab=overview](https://marketplace.microsoft.com/en-us/product/wa200010668?tab=overview)

---

## 8. References

- [Technical Architecture](../02-technical/ARCHITECTURE.md)
- [API Documentation](../02-technical/API_DOCUMENTATION.md)
- [Security Documentation](../02-technical/SECURITY.md)
- [Development Guide](../03-development/DEVELOPMENT_GUIDE.md)
- [Deployment Guide](../03-development/DEPLOYMENT_GUIDE.md)
