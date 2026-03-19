# Windows Executable Distribution (Demo)

This guide explains how to package and distribute DocuID as a Windows installer so users can use the add-in in Microsoft Word before Store publication.

## What this installer does

- Installs machine-wide (requires administrator rights).
- Copies the production manifest to `C:\ProgramData\DocuID\OfficeAddin\manifest.xml`.
- Registers an Active Setup bootstrap so each Windows user gets add-in registration on first login.
- Pre-provisions existing local user profiles by copying the manifest into Office sideload locations.
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

- `dist\installer\DocuID-WordAddin-Installer.exe`

If build fails with `ISCC.exe not found`, install Inno Setup 6 and rerun.

## Install on demo machine

1. Copy `DocuID-WordAddin-Installer.exe` to the target machine.
2. Right-click and select **Run as administrator**.
3. Complete setup.
4. Close all Word processes and open Word again.

## Verify in Word

1. Open Word.
2. Go to **Home** tab and look for the **DocuID** ribbon button.
3. Click it and verify task pane opens from `addon.docuid.net`.

If not visible immediately:

1. Fully close Word (`WIN + R` -> `taskkill /IM WINWORD.EXE /F`).
2. Open Word again.
3. Check **Insert > My Add-ins** and verify DocuID appears.

## Uninstall behavior

Uninstalling from Windows Apps/Programs performs cleanup:

- Removes Active Setup registration key for DocuID.
- Removes per-user sideload manifest file `DocuID-c42a66ec-73b7-459d-af77-4324c5454a40.xml`.
- Removes `C:\ProgramData\DocuID\OfficeAddin`.

## Troubleshooting

### Installer runs but add-in does not appear

- Confirm Word desktop is installed (Office 2016+ / Microsoft 365).
- Confirm user has local profile under `C:\Users`.
- Confirm file exists for current user:
  - `%LOCALAPPDATA%\Microsoft\Office\16.0\Wef\DocuID-c42a66ec-73b7-459d-af77-4324c5454a40.xml`
- Restart Word after install.

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
