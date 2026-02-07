# Microsoft Office Store Submission Guide

This guide explains how to submit the DocuID Office Add-in to Microsoft AppSource (Office Store).

## Prerequisites

Before submitting, ensure you have:

1. **Microsoft Partner Center Account**
   - Register at [partner.microsoft.com](https://partner.microsoft.com)
   - Pay the one-time registration fee (~$19 USD for individuals, ~$99 for companies)

2. **Legal Requirements**
   - Privacy policy URL
   - Terms of use URL
   - Support contact information
   - Company/developer information

3. **Technical Requirements**
   - Production deployment (Vercel, Azure, or other HTTPS hosting)
   - Valid SSL certificate (automatic with Vercel)
   - Manifest XML file accessible via HTTPS

## Step 1: Prepare Your Add-in

### 1.1 Update Manifest for Store

The manifest must meet specific requirements:

```xml
<!-- In manifest-production.xml, ensure: -->

<!-- 1. Valid version number (increment for each update) -->
<Version>1.0.0.0</Version>

<!-- 2. Provider name (your company/developer name) -->
<ProviderName>Your Company Name</ProviderName>

<!-- 3. Support URL (required) -->
<SupportUrl DefaultValue="https://www.docuid.net/support"/>

<!-- 4. High-resolution icons (must be exactly these sizes) -->
<IconUrl DefaultValue="https://your-domain.com/assets/icon-32.png"/>
<HighResolutionIconUrl DefaultValue="https://your-domain.com/assets/icon-64.png"/>

<!-- 5. Valid AppDomains for external URLs -->
<AppDomains>
  <AppDomain>https://www.docuid.net</AppDomain>
  <AppDomain>https://api.docuid.net</AppDomain>
</AppDomains>
```

### 1.2 Create Required Assets

#### Icons (Required)
Create PNG icons with transparent backgrounds:
- `icon-16.png` - 16x16 pixels
- `icon-32.png` - 32x32 pixels  
- `icon-64.png` - 64x64 pixels
- `icon-80.png` - 80x80 pixels
- `icon-128.png` - 128x128 pixels (store listing)

#### Screenshots (Required for Store Listing)
- Minimum 1366x768 pixels
- PNG or JPEG format
- At least 1 screenshot, recommended 3-5
- Show the add-in in action within Word

#### Store Listing Images
- **Logo**: 300x300 pixels (for AppSource listing)
- **Hero Image**: 960x540 pixels (optional, for featured placement)
- **Promotional images**: Various sizes for marketing

### 1.3 Prepare Legal Documents

#### Privacy Policy (Required)
Create a privacy policy covering:
- What data you collect
- How you use the data
- Data storage and security
- User rights (GDPR, CCPA compliance)
- Contact information

Host at: `https://www.docuid.net/privacy`

#### Terms of Use (Required)
Include:
- License grant
- Usage restrictions
- Disclaimers
- Limitation of liability
- Termination conditions

Host at: `https://www.docuid.net/terms`

## Step 2: Validate Your Add-in

### 2.1 Run Manifest Validation

```bash
# Validate the production manifest
npm run validate:prod

# Or using office-addin-manifest directly
npx office-addin-manifest validate manifest-production.xml
```

### 2.2 Test in Production Environment

1. Deploy to production (Vercel)
2. Sideload the production manifest
3. Test all functionality:
   - Authentication flow
   - Document operations
   - Error handling
   - Different Word versions (Office 365, 2019, 2021)
   - Windows and Mac platforms

### 2.3 Use Microsoft Validation Tool

```bash
# Install the validator
npm install -g office-addin-validator

# Run validation
office-addin-validator manifest-production.xml
```

## Step 3: Submit to Partner Center

### 3.1 Access Partner Center

1. Go to [partner.microsoft.com/dashboard](https://partner.microsoft.com/dashboard)
2. Sign in with your Microsoft account
3. Navigate to **Office Apps** → **Create new app**

### 3.2 Fill in Store Listing

#### App Overview
- **App name**: DocuID
- **Category**: Productivity
- **Subcategory**: Document Management

#### Descriptions
- **Short description** (max 100 characters):
  > "Secure biometric authentication and document management for Word."

- **Long description** (max 4000 characters):
  > DocuID enables secure document access through biometric authentication directly in Microsoft Word.
  >
  > **Key Features:**
  > - 🔐 Biometric Authentication: Secure login using phone number + biometric verification
  > - 📄 Document Management: Browse and access your authorized documents
  > - 🔄 Office Integration: Seamlessly insert documents into Word
  > - 🔍 Real-time Search: Find documents quickly
  >
  > **How it works:**
  > 1. Enter your registered phone number
  > 2. Complete biometric verification on your mobile device
  > 3. Access and insert your authorized documents
  >
  > DocuID is perfect for professionals who need secure, authenticated access to sensitive documents.

#### Screenshots
Upload 3-5 screenshots showing:
1. Login screen with phone entry
2. Authentication in progress
3. Document list view
4. Document inserted in Word
5. Search functionality

#### Keywords (for searchability)
- document management
- biometric authentication
- secure documents
- document access
- identity verification

### 3.3 Provide Technical Info

#### Manifest URL
```
https://your-domain.vercel.app/manifest-production.xml
```

#### Supported Platforms
- ✅ Windows Desktop
- ✅ Mac Desktop
- ❌ Web (if not supported)
- ❌ iPad (if not supported)

#### Supported Languages
- English (United States)

### 3.4 Provide Legal Info

- **Privacy Policy URL**: `https://www.docuid.net/privacy`
- **Terms of Use URL**: `https://www.docuid.net/terms`
- **Support URL**: `https://www.docuid.net/support`
- **Support Email**: support@docuid.net

### 3.5 Certification Notes (Optional)
Provide testing instructions for Microsoft reviewers:
```
To test this add-in:
1. Enter phone number: +1234567890
2. Use test code: 123456 for verification
3. Browse sample documents
4. Click "Open" to insert document content
```

## Step 4: Certification Process

### What Microsoft Checks

1. **Manifest Validation**
   - Valid XML structure
   - Correct URLs (HTTPS only)
   - Proper icon sizes

2. **Functional Testing**
   - Add-in loads without errors
   - Core features work as described
   - No crashes or critical bugs

3. **Content Review**
   - Screenshots match actual functionality
   - Description is accurate
   - No misleading claims

4. **Security Review**
   - No malicious code
   - Proper data handling
   - Secure authentication

### Timeline

- **Initial Review**: 1-3 business days
- **Re-submission** (if issues found): 1-2 business days
- **Total Time**: Typically 3-7 business days

### Common Rejection Reasons

1. **Crashes or Bugs**: Test thoroughly before submission
2. **Missing Privacy Policy**: Required for all apps
3. **Inaccurate Screenshots**: Must match actual UI
4. **Broken Links**: All URLs must work
5. **Slow Performance**: Optimize load times
6. **Unclear Value Proposition**: Description must be clear

## Step 5: After Approval

### 5.1 Monitor Your Add-in

- Check Partner Center for user reviews
- Monitor error reports
- Track installation metrics

### 5.2 Handle Updates

For updates:
1. Increment version in manifest: `<Version>1.0.0.1</Version>`
2. Deploy updated code to production
3. Submit update in Partner Center
4. Changes go through certification again

### 5.3 Respond to Reviews

- Monitor user feedback in Partner Center
- Respond professionally to reviews
- Address issues promptly

## Checklist Before Submission

- [ ] Partner Center account created
- [ ] Production deployment verified (Vercel)
- [ ] Manifest validated (`npm run validate:prod`)
- [ ] All icons created (16, 32, 64, 80, 128 px)
- [ ] Screenshots captured (3-5 images)
- [ ] Privacy policy published
- [ ] Terms of use published
- [ ] Support page/email set up
- [ ] Tested on Windows and Mac
- [ ] Tested on Office 365 and Office 2019+
- [ ] Store listing content prepared
- [ ] Test credentials for reviewers (if needed)

## Resources

- [Microsoft Partner Center](https://partner.microsoft.com)
- [Office Add-in Store Policies](https://docs.microsoft.com/en-us/legal/marketplace/certification-policies)
- [App Source Submission FAQ](https://docs.microsoft.com/en-us/office/dev/store/faq)
- [Office Add-in Design Guidelines](https://docs.microsoft.com/en-us/office/dev/add-ins/design/add-in-design)

## Support

For submission issues:
- [Partner Center Support](https://partner.microsoft.com/support)
- [Stack Overflow - office-js tag](https://stackoverflow.com/questions/tagged/office-js)
- [Microsoft Tech Community](https://techcommunity.microsoft.com/t5/microsoft-365-developer-platform/bd-p/Microsoft365DeveloperPlatform)