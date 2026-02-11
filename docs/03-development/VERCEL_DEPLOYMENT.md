# Vercel Deployment Guide

This guide explains how to deploy the DocuID Office Add-in to Vercel.

## Prerequisites

- A [Vercel](https://vercel.com) account
- Git repository (GitHub, GitLab, or Bitbucket)
- Vercel CLI (optional): `npm i -g vercel`

## Quick Deploy

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push to Git Repository**
   ```bash
   git add .
   git commit -m "Add Vercel deployment configuration"
   git push origin main
   ```

2. **Import Project in Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select your Git repository
   - Vercel will auto-detect the configuration from `vercel.json`

3. **Configure Environment Variables** (Optional)
   - In Vercel Dashboard → Project → Settings → Environment Variables
   - Add `PRODUCTION_URL` if using a custom domain

4. **Deploy**
   - Click "Deploy" and wait for the build to complete

### Option 2: Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

## Configuration Files

### vercel.json
The main Vercel configuration file that:
- Sets the build command to `npm run build`
- Outputs to the `dist` directory
- Configures API rewrites for backend proxy
- Sets CORS headers

### manifest-production.xml
Production manifest with Vercel URLs. After deployment:
1. Download `manifest-production.xml` from your deployed site
2. Update URLs if using a custom domain
3. Share with users to install the add-in

## Custom Domain Setup

1. **Add Domain in Vercel**
   - Go to Project → Settings → Domains
   - Add your custom domain (e.g., `addon.docuid.net`)

2. **Update Manifest URLs**
   - Replace `https://docuid-ms-office-add-in.vercel.app/` with your domain in `manifest-production.xml`
   - Or set `PRODUCTION_URL` environment variable in Vercel

3. **Update vercel.json** (if needed)
   - No changes needed if using Vercel's automatic URL detection

## API Proxy Configuration

The `vercel.json` configures API rewrites to proxy requests to the DocuID backend:

| Frontend Path | Backend Destination |
|--------------|---------------------|
| `/api/docuid/biometric/*` | `https://dev.docuid.net/api/biometric/*` |
| `/api/docuid/documents/{id}/download` | `https://dev.docuid.net/api/documents/{id}/download` |
| `/api/docuid/documents/{id}/content` | `https://dev.docuid.net/api/documents/{id}/content` |
| `/api/docuid/documents/*` | `https://dev.docuid.net/api/dashboard/documents/*` |
| `/api/docuid/shares/*` | `https://dev.docuid.net/api/dashboard/shares/*` |

### Changing the Backend URL

To use a different backend, update the `rewrites` section in `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/docuid/biometric/:path*",
      "destination": "https://your-backend.com/api/biometric/:path*"
    }
  ]
}
```

## Environment Variables

Set these in Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PRODUCTION_URL` | Custom production URL with trailing slash | `https://docuid-ms-office-add-in.vercel.app/` |
| `VERCEL_URL` | Auto-set by Vercel (don't set manually) | - |

## Installing the Production Add-in

After deployment, users can install the add-in:

### Method 1: Sideload Manifest
1. Download `https://your-domain.vercel.app/manifest-production.xml`
2. In Word, go to Insert → Add-ins → My Add-ins → Upload My Add-in
3. Select the downloaded manifest file

### Method 2: Shared Folder (Enterprise)
1. Place the manifest on a network share
2. Configure Office to trust the share location
3. Users can install from the shared folder

### Method 3: Office Store (Future)
For public distribution, submit to Microsoft AppSource.

## Troubleshooting

### Build Fails
- Check build logs in Vercel Dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Add-in Not Loading
- Verify HTTPS is working (automatic on Vercel)
- Check manifest URLs match deployment URL
- Validate manifest: `npm run validate:prod`

### API Requests Failing
- Check CORS headers in `vercel.json`
- Verify backend URL in rewrites configuration
- Test API endpoints directly

### CORS Errors
The `vercel.json` includes CORS headers. If still seeing errors:
1. Check browser console for specific blocked URLs
2. Add the origin to CORS headers
3. Verify the API proxy rewrites are working

## Build Output

The production build outputs to `dist/`:
```
dist/
├── taskpane.html          # Main add-in page
├── commands.html          # Ribbon commands
├── manifest.xml           # Development manifest
├── manifest-production.xml # Production manifest
├── assets/                # Static assets
│   ├── icon-16.png
│   ├── icon-32.png
│   └── ...
└── *.js, *.css           # Bundled files
```

## Monitoring & Logs

- **Build Logs**: Vercel Dashboard → Project → Deployments
- **Runtime Logs**: Vercel Dashboard → Project → Logs
- **Analytics**: Vercel Dashboard → Project → Analytics

## Rollback

To rollback to a previous deployment:
1. Go to Vercel Dashboard → Project → Deployments
2. Find the stable deployment
3. Click "..." → "Promote to Production"

## Cost

Vercel offers:
- **Hobby**: Free for personal projects
- **Pro**: $20/month per member for teams
- **Enterprise**: Custom pricing

The Office Add-in should work fine on the Hobby tier for development/testing.

## Next Steps

1. Deploy to Vercel
2. Test the add-in with production manifest
3. Configure custom domain (optional)
4. Set up team access in Vercel
5. Share manifest with users