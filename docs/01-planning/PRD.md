# Product Requirements Document (PRD) for DocuID Office Add-in

**Version:** 1.1
**Date:** 18 June 2025

## 1. Overview

**Goal:**
To build a Microsoft Office Add-in named **DocuID** that allows users to securely authenticate via the **iVALT biometric system** (through the DocuID backend) and access a personalized panel displaying documents they are authorized to view or open.

**Target Applications:**

*   Microsoft Word


**Platform Support:**

*   Windows
*   macOS

---

## 2. Core Features

### 🔐 Authentication

*   User logs in using their **mobile number with country code**.
*   Authentication is handled via **Docuid.net**, which integrates with **iVALT** for biometric verification on the user's registered device.
*   The backend verifies if the user exists or needs to be created.
*   Response includes a session token and user profile.

### 📁 Document Access Panel

*   After authentication, the user sees a panel inside the Office Add-in.
*   The panel fetches and displays a **list of documents** available to the user from the backend.
*   Each document entry includes:
    *   Title
    *   Type (e.g., PDF, DOCX)
    *   Last modified date
    *   Open/View button

### 📥 Document Opening

*   Clicking "Open" loads the document either:
    *   Directly into the Office app (if supported),
    *   Or triggers a download,
    *   Or opens in an embedded viewer.

---

## 3. User Flow

The user flow is detailed in the diagram below.

[See User Flow Diagram](../04-diagrams/user_flow.mermaid)

---

## 4. System Architecture

A high-level overview of the system architecture.

[See System Architecture Diagram](../04-diagrams/system_architecture.mermaid)

---

## 5. Technical Requirements

### Frontend (Office Add-in)

*   **Scaffolding:** `yo office` (Office Add-in generator)
*   **Framework:** React.js
*   **API:** Office.js (Office JavaScript API) for integration with Host applications.
*   **Styling:** HTML, CSS.
*   **Hosting:** Hosted on a public HTTPS server.

### Backend

*   **Service:** `Docuid.net`
*   **Functionality:** Provides REST APIs for:
    *   User authentication (integrating with iVALT).
    *   Fetching the document list for authenticated users.
    *   Retrieving document content or a secure URL for viewing/downloading.

### Authentication

*   The add-in communicates with `Docuid.net` for authentication.
*   `Docuid.net` handles the iVALT integration for biometric verification.
*   Session management is token-based.

### Storage

*  Cloud storage for user-specific document access (e.g., AWS S3 API), managed by the backend.

---

## 6. Milestones & Timeline

| Milestone | Description | ETA | Status |
| --- | --- | --- | --- |
| M1 | Project scaffolding with `yo office` & UI design | Week 1 | ✅ **Complete** |
| M2 | Backend integration for login via `Docuid.net` | Week 2 | 🔄 Ready to Start |
| M3 | Backend API for document fetching and access | Week 3 | ⏳ Pending |
| M4 | Full add-in integration and testing in Office apps | Week 4 | ⏳ Pending |
| M5 | Final testing, optimization and deployment | Week 5 | ⏳ Pending |

---

## 7. Current Implementation Status

### ✅ Phase 1 Complete (M1)
- **React-based Office Add-in** with TypeScript
- **Authentication UI** with phone number input and validation
- **Document Management UI** with list display and search capabilities
- **Office.js Integration** for document insertion into Word
- **Mock Services** for development and testing
- **Comprehensive Documentation** including architecture, security, and deployment guides

### 🔄 Ready for Phase 2 (M2)
- **API Client Setup** for docuid.net integration
- **Real Authentication Flow** replacing mock implementation
- **Production Error Handling** for network and API failures
- **Security Enhancements** for production deployment

For detailed technical specifications, see:
- [Technical Architecture](../02-technical/ARCHITECTURE.md)
- [API Documentation](../02-technical/API_DOCUMENTATION.md)
- [Security Documentation](../02-technical/SECURITY.md)
- [Development Guide](../03-development/DEVELOPMENT_GUIDE.md) 