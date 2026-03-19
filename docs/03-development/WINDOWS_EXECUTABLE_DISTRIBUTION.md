# Windows Executable Distribution (Demo)

This guide explains how to package and distribute the iVALT Docuid add-in as a Windows installer so users can use it in Microsoft Word before Store publication.

## What this installer does

- Installs machine-wide (requires administrator rights).
- Copies the production manifest to `C:\ProgramData\DocuID\OfficeAddin\manifest.xml`.
- Registers an Active Setup bootstrap so each Windows user gets add-in registration on first login.
- Pre-provisions existing local user profiles by copying the manifest into Office **15.0** and **16.0** Wef folders.
- Active Setup (and the per-user helper script) also writes **`HKCU\Software\Microsoft\Office\<ver>\WEF\Developer`** so Word can discover the add-in (file copy alone is often not enough on current Office builds).
- Cleans up machine and user artifacts on uninstall.

## Prerequisites (build machine)

- Windows 10/11
- `pnpm` installed
- Inno Setup 6 installed (provides `ISCC.exe`)

## Build the installer

From project root:

```powershell
pnpm install
pnpm run installer:package
```

Output installer:

- `dist\installer\iVALT-Docuid-WordAddin-Installer.exe`

If build fails with `ISCC.exe not found`, install Inno Setup 6 and rerun.

## Install on demo machine

1. Copy `iVALT-Docuid-WordAddin-Installer.exe` to the target machine.
2. Right-click and select **Run as administrator**.
3. Complete setup.
4. **Sign out of Windows and sign back in** once (so Active Setup runs for your profile), **or** run the per-user script below.
5. Close all Word processes and open Word again.

## Verify in Word

1. Open Word.
2. Go to **Home** tab and look for the **iVALT Docuid** ribbon button.
3. Click it and verify task pane opens from `addon.docuid.net`.

If not visible immediately:

1. As the **same Windows user that uses Word**, run (no admin):  
   `powershell -NoProfile -ExecutionPolicy Bypass -File "%ProgramData%\DocuID\OfficeAddin\Register-ForCurrentUser.ps1"`
2. Fully close Word (`WIN + R` -> `taskkill /IM WINWORD.EXE /F`).
3. Open Word again.
4. Check **Insert > My Add-ins** and verify **iVALT Docuid** appears.

## Uninstall behavior

Uninstalling from Windows Apps/Programs performs cleanup:

- Removes Active Setup registration key for DocuID.
- Removes per-user sideload manifest file `DocuID-c42a66ec-73b7-459d-af77-4324c5454a40.xml`.
- Removes `C:\ProgramData\DocuID\OfficeAddin`.

## Troubleshooting

### Installer runs but add-in does not appear

- Confirm Word desktop is installed (Office 2013+ uses `15.0`; Office 2016 / Microsoft 365 uses `16.0` under `%LOCALAPPDATA%\Microsoft\Office\`).
- Run **`Register-ForCurrentUser.ps1`** as the Word user (see above).
- Confirm the manifest file exists:
  - `%LOCALAPPDATA%\Microsoft\Office\16.0\Wef\DocuID-c42a66ec-73b7-459d-af77-4324c5454a40.xml` (or the `15.0` path for older Office).
- In **Registry Editor** (that same user), confirm a string value named `c42a66ec-73b7-459d-af77-4324c5454a40` exists under `HKEY_CURRENT_USER\Software\Microsoft\Office\16.0\WEF\Developer` (Data = full path to that XML). If it is missing, run `Register-ForCurrentUser.ps1`.
- **Trust Center**: File > Options > Trust Center > Trust Center Settings > Trusted Add-ins: ensure your org is not blocking **Marketplace** / web add-ins via policy.
- Restart Word after any fix.

### Add-in UI opens but fails to load content

- Validate internet access to:
  - `https://addon.docuid.net/taskpane.html`
  - `https://addon.docuid.net/commands.html`
  - `https://addon.docuid.net/assets/icon-32.png`
- Confirm TLS inspection/proxy policy is not blocking these domains.

### Re-deploy updated add-in

1. Update `manifest-production.xml` version if needed.
2. Build new installer (`pnpm run installer:package`).
3. Uninstall old installer on demo machines.
4. Install new executable as admin.
