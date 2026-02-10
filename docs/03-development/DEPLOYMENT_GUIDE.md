# DocuID Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the DocuID Office Add-in from development to production environments. It covers local deployment, staging, production deployment, and post-deployment monitoring.

## Deployment Architecture

### Deployment Pipeline Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │───▶│     Staging     │───▶│   Production    │
│   Environment   │    │   Environment   │    │   Environment   │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • localhost:3000│    │ • staging.*.com │    │ • prod.*.com    │
│ • Mock APIs     │    │ • Test APIs     │    │ • Live APIs     │
│ • Self-signed   │    │ • Valid SSL     │    │ • Valid SSL     │
│ • Hot reload    │    │ • Performance   │    │ • Monitoring    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Environment Configuration

### Development Environment

Already configured for local development with:

- Webpack dev server with hot reload
- Self-signed SSL certificates
- Mock authentication and document services
- Debug logging enabled

### Staging Environment

```bash
# Environment variables for staging
NODE_ENV=staging
API_BASE_URL=https://staging-dev.docuid.net
HTTPS_ENABLED=true
DEBUG_MODE=true
LOG_LEVEL=debug
```

### Production Environment

```bash
# Environment variables for production
NODE_ENV=production
API_BASE_URL=https://dev.docuid.net
HTTPS_ENABLED=true
DEBUG_MODE=false
LOG_LEVEL=error
MONITORING_ENABLED=true
```

## Pre-Deployment Checklist

### Code Quality Verification

```bash
# Run all quality checks
pnpm run lint                    # ESLint validation
pnpm run prettier               # Code formatting
pnpm run validate               # Manifest validation
pnpm run build                  # Production build test
```

### Security Checklist

- [ ] All secrets removed from code
- [ ] API endpoints configured for target environment
- [ ] SSL certificates configured
- [ ] Security headers implemented
- [ ] Input validation tested
- [ ] Authentication flow tested
- [ ] CORS policies configured

### Performance Checklist

- [ ] Bundle size optimized
- [ ] Assets compressed
- [ ] Lazy loading implemented
- [ ] CDN configuration ready
- [ ] Performance benchmarks met

## Build Process

### Production Build Configuration

#### Webpack Production Configuration

```javascript
// webpack.prod.js
const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack.config.js");

module.exports = merge(common, {
  mode: "production",
  optimization: {
    minimize: true,
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all",
        },
      },
    },
  },
  performance: {
    maxAssetSize: 250000,
    maxEntrypointSize: 250000,
  },
});
```

#### Build Scripts

```bash
# Clean previous builds
rm -rf dist/

# Create production build
NODE_ENV=production pnpm run build

# Verify build output
ls -la dist/
du -sh dist/*

# Test build locally
# Serve dist/ with HTTPS server for testing
```

### Build Output Structure

```
dist/
├── taskpane.html              # Main add-in HTML
├── commands.html              # Commands HTML
├── assets/                    # Static assets
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-64.png
│   ├── icon-80.png
│   └── icon-128.png
├── js/                        # JavaScript bundles
│   ├── polyfill.js
│   ├── taskpane.js
│   ├── commands.js
│   └── vendors.js
├── css/                       # Stylesheets
│   └── taskpane.css
└── manifest.xml               # Office Add-in manifest
```

## Hosting Requirements

### HTTPS Requirements

Office Add-ins **require** HTTPS hosting. No exceptions.

#### SSL Certificate Requirements

- Valid SSL certificate from trusted CA
- TLS 1.2 or higher
- No self-signed certificates in production
- Certificate must match domain name

#### Recommended Hosting Providers

```
Enterprise Level:
• Azure App Service
• AWS Elastic Beanstalk
• Google Cloud Run
• Microsoft 365 Developer Program

CDN Options:
• Azure CDN
• AWS CloudFront
• Cloudflare
• KeyCDN
```

### Server Configuration

#### NGINX Configuration Example

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # CORS for Office domains
    add_header Access-Control-Allow-Origin "https://office.com" always;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;

    root /var/www/docuid-addon/dist;
    index taskpane.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /js/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /css/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

#### Apache Configuration Example

```apache
<VirtualHost *:443>
    ServerName your-domain.com
    DocumentRoot /var/www/docuid-addon/dist

    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key
    SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
    SSLCipherSuite ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384

    # Security headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "DENY"
    Header always set X-XSS-Protection "1; mode=block"

    # CORS headers
    Header always set Access-Control-Allow-Origin "https://office.com"
    Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header always set Access-Control-Allow-Headers "Authorization, Content-Type"

    # Cache configuration
    <LocationMatch "\.(css|js|png|jpg|gif|ico)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
    </LocationMatch>
</VirtualHost>

<VirtualHost *:80>
    ServerName your-domain.com
    Redirect permanent / https://your-domain.com/
</VirtualHost>
```

## Manifest Configuration for Production

### Update Manifest URLs

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<OfficeApp xmlns="http://schemas.microsoft.com/office/appforoffice/1.1"
           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
           xmlns:bt="http://schemas.microsoft.com/office/officeappbasictypes/1.0"
           xmlns:ov="http://schemas.microsoft.com/office/taskpaneappversionoverrides"
           xsi:type="TaskPaneApp">

  <Id>c42a66ec-73b7-459d-af77-4324c5454a40</Id>
  <Version>1.0.0.0</Version>
  <ProviderName>Your Company Name</ProviderName>
  <DefaultLocale>en-US</DefaultLocale>
  <DisplayName DefaultValue="DocuID"/>
  <Description DefaultValue="Secure biometric authentication and document access for Office"/>

  <!-- Update all URLs to production domain -->
  <IconUrl DefaultValue="https://your-domain.com/assets/icon-32.png"/>
  <HighResolutionIconUrl DefaultValue="https://your-domain.com/assets/icon-64.png"/>
  <SupportUrl DefaultValue="https://your-domain.com/support"/>

  <AppDomains>
    <AppDomain>https://your-domain.com</AppDomain>
    <AppDomain>https://dev.docuid.net</AppDomain>
  </AppDomains>

  <Hosts>
    <Host Name="Document"/>
  </Hosts>

  <DefaultSettings>
    <SourceLocation DefaultValue="https://your-domain.com/taskpane.html"/>
  </DefaultSettings>

  <Permissions>ReadWriteDocument</Permissions>

  <VersionOverrides xmlns="http://schemas.microsoft.com/office/taskpaneappversionoverrides" xsi:type="VersionOverridesV1_0">
    <Hosts>
      <Host xsi:type="Document">
        <DesktopFormFactor>
          <FunctionFile resid="Commands.Url"/>
          <!-- Additional configuration -->
        </DesktopFormFactor>
      </Host>
    </Hosts>

    <Resources>
      <bt:Images>
        <bt:Image id="Icon.16x16" DefaultValue="https://your-domain.com/assets/icon-16.png"/>
        <bt:Image id="Icon.32x32" DefaultValue="https://your-domain.com/assets/icon-32.png"/>
        <bt:Image id="Icon.80x80" DefaultValue="https://your-domain.com/assets/icon-80.png"/>
      </bt:Images>
      <bt:Urls>
        <bt:Url id="Commands.Url" DefaultValue="https://your-domain.com/commands.html"/>
        <bt:Url id="Taskpane.Url" DefaultValue="https://your-domain.com/taskpane.html"/>
      </bt:Urls>
      <!-- String resources -->
    </Resources>
  </VersionOverrides>
</OfficeApp>
```

### Automated URL Replacement

```javascript
// deployment/update-manifest.js
const fs = require("fs");
const path = require("path");

function updateManifestUrls(environment) {
  const manifestPath = path.join(__dirname, "../dist/manifest.xml");
  let manifest = fs.readFileSync(manifestPath, "utf8");

  const urls = {
    development: "https://localhost:3000",
    staging: "https://staging-your-domain.com",
    production: "https://your-domain.com",
  };

  const targetUrl = urls[environment];
  if (!targetUrl) {
    throw new Error(`Unknown environment: ${environment}`);
  }

  // Replace localhost URLs with target URL
  manifest = manifest.replace(/https:\/\/localhost:3000/g, targetUrl);

  fs.writeFileSync(manifestPath, manifest);
  console.log(`Updated manifest URLs for ${environment} environment`);
}

// Usage: node update-manifest.js production
const environment = process.argv[2] || "production";
updateManifestUrls(environment);
```

## Deployment Procedures

### Manual Deployment

#### Step 1: Prepare Build

```bash
# Clean and build
rm -rf dist/
NODE_ENV=production pnpm run build

# Update manifest for production
node deployment/update-manifest.js production

# Verify build
ls -la dist/
```

#### Step 2: Upload to Server

```bash
# Using SCP
scp -r dist/* user@your-server:/var/www/docuid-addon/

# Using rsync
rsync -avz --delete dist/ user@your-server:/var/www/docuid-addon/

# Using FTP/SFTP
# Upload contents of dist/ folder to web root
```

#### Step 3: Update Server Configuration

```bash
# Restart web server
sudo systemctl restart nginx
# or
sudo systemctl restart apache2

# Verify SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Test HTTPS access
curl -I https://your-domain.com/taskpane.html
```

### Automated Deployment (CI/CD)

#### GitHub Actions Deployment

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm run test

      - name: Build for production
        run: |
          NODE_ENV=production pnpm run build
          node deployment/update-manifest.js production

      - name: Deploy to server
        uses: appleboy/scp-action@v0.1.4
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          source: "dist/*"
          target: "/var/www/docuid-addon/"

      - name: Restart web server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: sudo systemctl restart nginx
```

#### Azure DevOps Pipeline

```yaml
# azure-pipelines.yml
trigger:
  - main

pool:
  vmImage: "ubuntu-latest"

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: "18.x"
    displayName: "Install Node.js"

  - script: |
      npm install -g pnpm
      pnpm install
    displayName: "Install dependencies"

  - script: |
      pnpm run lint
      pnpm run test
    displayName: "Run quality checks"

  - script: |
      NODE_ENV=production pnpm run build
      node deployment/update-manifest.js production
    displayName: "Build for production"

  - task: AzureWebApp@1
    inputs:
      azureSubscription: "Azure-Connection"
      appType: "webApp"
      appName: "docuid-addon"
      package: "dist"
    displayName: "Deploy to Azure"
```

## Office Add-in Store Deployment

### Store Submission Requirements

#### App Package Preparation

```bash
# Create Office Add-in package
zip -r DocuID-AddIn.zip dist/

# Package contents should include:
# - manifest.xml
# - All HTML, CSS, JS files
# - All assets (icons, images)
# - Documentation
```

#### Store Validation Checklist

- [ ] Valid manifest.xml with no errors
- [ ] All URLs use HTTPS
- [ ] Icons in all required sizes (16x16, 32x32, 64x64, 80x80, 128x128)
- [ ] Privacy policy URL
- [ ] Terms of service URL
- [ ] Support URL
- [ ] Detailed app description
- [ ] Screenshots for store listing
- [ ] Testing notes for Microsoft reviewers

#### Submission Process

1. **Partner Center**: Create app listing in Microsoft Partner Center
2. **Upload Package**: Upload the add-in package
3. **Store Listing**: Complete store listing information
4. **Testing Notes**: Provide detailed testing instructions
5. **Submit for Review**: Submit for Microsoft certification
6. **Certification**: Address any certification feedback
7. **Publication**: Approve publication once certified

### Private Distribution (Enterprise)

#### Office 365 Admin Center Deployment

```bash
# For enterprise deployment without public store

1. Upload manifest.xml to Office 365 Admin Center
2. Configure add-in for specific users/groups
3. Set deployment preferences
4. Monitor add-in usage and health
```

#### SharePoint App Catalog Deployment

```bash
# For SharePoint-based organizations

1. Upload add-in package to SharePoint App Catalog
2. Configure permissions and access
3. Deploy to specific sites/users
4. Manage updates through catalog
```

## Post-Deployment Verification

### Functionality Testing

```bash
# Test checklist after deployment

1. Add-in Loading
   - Load add-in in Word
   - Verify UI renders correctly
   - Check for console errors

2. Authentication Flow
   - Test login with valid credentials
   - Verify error handling
   - Check session persistence

3. Document Operations
   - List documents successfully
   - Open documents in Word
   - Verify formatting and content

4. Performance Testing
   - Measure load times
   - Test responsiveness
   - Monitor memory usage
```

### SSL/HTTPS Verification

```bash
# SSL certificate verification
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# SSL Labs test
# Visit: https://www.ssllabs.com/ssltest/
# Test: your-domain.com

# Certificate expiration check
echo | openssl s_client -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates
```

### Security Headers Verification

```bash
# Check security headers
curl -I https://your-domain.com/taskpane.html

# Expected headers:
# Strict-Transport-Security: max-age=31536000; includeSubDomains
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
```

## Monitoring and Maintenance

### Application Monitoring

#### Health Check Endpoint

```typescript
// health-check.ts
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION,
    environment: process.env.NODE_ENV,
  });
});
```

#### Log Monitoring

```bash
# Monitor application logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Set up log rotation
# Configure logrotate for log management
```

#### Performance Monitoring

```javascript
// Basic performance monitoring
const performanceMonitor = {
  trackPageLoad: () => {
    window.addEventListener("load", () => {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      console.log(`Page load time: ${loadTime}ms`);

      // Send to monitoring service
      if (window.analytics) {
        window.analytics.track("page_load_time", { duration: loadTime });
      }
    });
  },

  trackAPIResponse: (endpoint, responseTime) => {
    console.log(`API ${endpoint} response time: ${responseTime}ms`);

    // Send to monitoring service
    if (window.analytics) {
      window.analytics.track("api_response_time", {
        endpoint,
        duration: responseTime,
      });
    }
  },
};
```

### Update Procedures

#### Rolling Updates

```bash
# Zero-downtime deployment strategy

1. Deploy to secondary server
2. Test new version
3. Switch load balancer to new version
4. Monitor for issues
5. Keep old version as backup
```

#### Rollback Procedures

```bash
# Rollback steps if issues occur

1. Identify issue severity
2. Switch load balancer back to previous version
3. Investigate and fix issues
4. Test fix in staging
5. Redeploy when ready
```

## Troubleshooting

### Common Deployment Issues

#### Certificate Issues

```bash
# Problem: SSL certificate not trusted
# Solution:
1. Verify certificate chain is complete
2. Check certificate matches domain
3. Ensure intermediate certificates are included
4. Test with SSL verification tools
```

#### Manifest Loading Issues

```bash
# Problem: Add-in doesn't load
# Solutions:
1. Validate manifest.xml syntax
2. Verify all URLs are HTTPS
3. Check CORS headers
4. Ensure all referenced files exist
```

#### Performance Issues

```bash
# Problem: Slow loading times
# Solutions:
1. Enable gzip compression
2. Optimize image sizes
3. Implement CDN
4. Minimize JavaScript bundles
5. Use browser caching
```

### Emergency Procedures

#### Service Outage Response

```bash
1. Immediate Response (0-15 minutes)
   - Identify scope of outage
   - Check server status
   - Verify DNS resolution
   - Check SSL certificate status

2. Short-term Response (15-60 minutes)
   - Implement temporary fixes
   - Communicate with users
   - Document issues found
   - Monitor service restoration

3. Long-term Response (1+ hours)
   - Root cause analysis
   - Implement permanent fixes
   - Post-mortem review
   - Update procedures
```

## Backup and Recovery

### Backup Strategy

```bash
# Application backup
tar -czf docuid-addon-backup-$(date +%Y%m%d).tar.gz /var/www/docuid-addon/

# Database backup (if applicable)
# mysqldump or equivalent

# Configuration backup
cp -r /etc/nginx/sites-available/ nginx-config-backup/
```

### Recovery Procedures

```bash
# Application recovery
tar -xzf docuid-addon-backup-YYYYMMDD.tar.gz -C /var/www/

# Service restart
sudo systemctl restart nginx

# Verification
curl -I https://your-domain.com/health
```

---

_This deployment guide should be customized for your specific hosting environment and organizational requirements._
