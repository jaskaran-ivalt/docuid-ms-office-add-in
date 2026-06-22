# Microsoft AppSource — Submission Reference

The DocuID Office Add-in is published and live on Microsoft AppSource.

**Live listing:** [https://marketplace.microsoft.com/en-us/product/wa200010668?tab=overview](https://marketplace.microsoft.com/en-us/product/wa200010668?tab=overview)

**Current version:** 1.0.2.0

---

## Submitting an Update

Updates go through Microsoft Partner Center certification before going live. The process:

1. Increment the version in all production manifests (`manifests/manifest*.xml`, `manifests/manifest-production.xml`): `<Version>X.X.X.X</Version>`
2. Deploy updated code to production via Vercel (push to `working` branch)
3. Validate manifests locally:

   ```bash
   bun run validate:word
   bun run validate:excel
   bun run validate:powerpoint
   bun run validate:prod
   ```

4. Go to [partner.microsoft.com/dashboard](https://partner.microsoft.com/dashboard)
5. Navigate to the DocuID app listing
6. Upload the updated manifest or submit the new build
7. Complete any updated store listing fields (description, screenshots) if the UI changed
8. Submit for certification

Certification typically takes 3–7 business days. Major functional changes or new host support (e.g., adding a new Office application) may require additional review.

---

## App Listing Details

**App name:** iVALT DocuID
**Category:** Productivity
**Subcategory:** Document Management
**Supported hosts:** Word, Excel, PowerPoint (Windows and macOS desktop)
**Supported languages:** English (United States)

**Legal URLs:**
- Privacy policy: `https://www.docuid.net/privacy`
- Terms of use: `https://www.docuid.net/terms`
- Support: `https://www.docuid.net/support`

---

## Manifest Requirements for Store

The production manifest (`manifests/manifest-production.xml`) is used for the store submission. Key requirements Microsoft enforces:

- All URLs must use HTTPS
- Icons must exist at the declared URLs in the required sizes (16, 32, 64, 80, 128 px)
- `<Version>` must be incremented for every update submission
- `<ProviderName>` must match the Partner Center account
- `<SupportUrl>` is required

Validate before every submission:

```bash
bun run validate:prod
```

---

## Icon Requirements

PNG icons with transparent backgrounds, all present in `assets/`:

| File          | Size       |
|---------------|------------|
| icon-16.png   | 16x16 px   |
| icon-32.png   | 32x32 px   |
| icon-64.png   | 64x64 px   |
| icon-80.png   | 80x80 px   |
| icon-128.png  | 128x128 px |

---

## Screenshot Requirements

- Minimum 1366x768 px, PNG or JPEG
- Must show the actual current UI (screenshots that do not match the live add-in are a common rejection reason)
- Recommended: 3–5 screenshots covering login, document list, and document insertion

Screenshots are stored in `screenshots/` in the repo.

---

## Common Certification Rejection Reasons

1. Screenshots do not match the actual UI
2. Broken or unreachable URLs in the manifest or store listing
3. Version number not incremented from the previous submission
4. Privacy policy or terms of use URL returns 404
5. Add-in crashes or fails to load during Microsoft's functional testing
6. Icons missing or wrong dimensions

---

## Certification Notes for Microsoft Reviewers

When submitting, provide testing instructions in the Partner Center certification notes field:

```
To test this add-in:
1. Open Word, Excel, or PowerPoint
2. Open the DocuID task pane from the Home ribbon
3. Enter a registered iVALT DocuID phone number (include country code)
4. Approve the biometric push on the associated mobile device
5. Browse the document list and click Open on any document
6. Confirm document content is inserted into the active document

Note: A registered iVALT DocuID account is required for authentication.
Contact support@docuid.net to arrange test credentials for review.
```

---

## Resources

- [Microsoft Partner Center](https://partner.microsoft.com)
- [Office Add-in Store Policies](https://docs.microsoft.com/en-us/legal/marketplace/certification-policies)
- [AppSource Submission FAQ](https://docs.microsoft.com/en-us/office/dev/store/faq)
- [Office Add-in Design Guidelines](https://docs.microsoft.com/en-us/office/dev/add-ins/design/add-in-design)
