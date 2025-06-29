# DocuID Office Add-in

A Microsoft Office Add-in that enables secure biometric authentication and document access through the iVALT system. Built with React, TypeScript, and Office.js.

## 🚀 Features

- **Biometric Authentication**: Secure login using phone number + biometric verification
- **Document Management**: Browse and access authorized documents
- **Office Integration**: Seamlessly insert documents into Word
- **Modern UI**: Clean, responsive interface with Office Fluent design
- **Real-time Search**: Search through available documents
- **Cross-Platform**: Works on Windows and macOS

## 📋 Prerequisites

- Node.js (LTS version)
- Microsoft Word (Office 365 or Office 2019)
- Office Add-ins development certificates

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd DocuID
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build:dev
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

This will automatically:
- Start the HTTPS development server on port 3000
- Launch Microsoft Word
- Sideload the add-in for testing

## 🏗️ Project Structure

```
DocuID/
├── src/
│   ├── taskpane/
│   │   ├── components/          # React components
│   │   │   ├── Header.tsx       # App header with branding
│   │   │   ├── LoginForm.tsx    # Authentication form
│   │   │   └── DocumentList.tsx # Document listing
│   │   ├── services/            # API services
│   │   │   ├── AuthService.ts   # Authentication logic
│   │   │   └── DocumentService.ts # Document management
│   │   ├── App.tsx             # Main React application
│   │   ├── index.tsx           # Entry point
│   │   ├── taskpane.css        # Styles
│   │   └── taskpane.html       # HTML template
│   └── commands/               # Office commands
├── assets/                     # Static assets
├── manifest.xml               # Add-in manifest
└── package.json              # Dependencies and scripts
```

## 🎯 Usage

### Authentication Flow

1. **Enter Phone Number**: Input your registered mobile number with country code
2. **Biometric Verification**: Complete biometric authentication on your device
3. **Access Documents**: Browse your authorized documents once authenticated

### Document Management

- **Browse**: View all available documents with metadata
- **Search**: Use the search bar to find specific documents
- **Open**: Click "Open" to insert document content into Word
- **Logout**: Use the logout button to clear session

## 🔧 Development

### Available Scripts

- `npm start` - Start development server and sideload add-in
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run dev-server` - Start development server only
- `npm run lint` - Run ESLint
- `npm run validate` - Validate manifest file

### API Integration

The add-in integrates with backend APIs for authentication and document management. See the [API Documentation](../docs/API_DOCUMENTATION.md) for complete endpoint specifications.

**Current Implementation**: 
- Development mode uses mock data and simulated authentication
- Production mode will integrate with actual docuid.net APIs

### Key Components

#### AuthService
Handles biometric authentication flow:
- Login initiation
- Session management
- Token storage and refresh

#### DocumentService
Manages document operations:
- Fetching document lists
- Retrieving document content
- Office.js integration for inserting content

#### React Components
- **Header**: Branding and user info display
- **LoginForm**: Phone number input and authentication
- **DocumentList**: Document browsing and search

## 🎨 UI/UX Design

The interface follows Microsoft Office design principles:

- **Office Fluent Design**: Consistent with Office UI
- **Responsive Layout**: Adapts to different panel sizes
- **Modern Typography**: Clean, readable fonts
- **Intuitive Navigation**: Clear user flow
- **Loading States**: Visual feedback for all operations
- **Error Handling**: Graceful error messages

## 🔒 Security Features

- **HTTPS Only**: All communications use HTTPS
- **Token-based Auth**: Secure JWT token management
- **Session Expiration**: Automatic logout on token expiry
- **Input Validation**: Phone number format validation
- **Secure Storage**: Safe token storage in localStorage

## 📱 Supported Platforms

- **Windows**: Office 365, Office 2019+
- **macOS**: Office 365, Office 2019+
- **Browsers**: Modern browsers for development

## 🚀 Deployment

### Development Deployment
Already configured for local development with HTTPS certificates.

### Production Deployment
1. Update `webpack.config.js` with production URL
2. Build production bundle: `npm run build`
3. Deploy to HTTPS-enabled hosting
4. Update manifest.xml with production URLs
5. Submit to Office Store (optional)

## 🧪 Testing

### Manual Testing
1. Start development server: `npm start`
2. Test authentication flow with mock data
3. Verify document list functionality
4. Test document insertion into Word

### Test Scenarios
- Valid phone number authentication
- Invalid phone number handling
- Document search functionality
- Office.js integration
- Error state handling

## 🔧 Configuration

### Environment Variables
```bash
# Development server port
npm_package_config_dev_server_port=3000

# Target Office application
npm_package_config_app_to_debug=word
```

### Manifest Configuration
Key settings in `manifest.xml`:
- Add-in ID and version
- Supported Office hosts
- Required permissions
- HTTPS endpoints

## 📚 API Documentation

Comprehensive API documentation is available at [API_DOCUMENTATION.md](../docs/API_DOCUMENTATION.md), including:

- Authentication endpoints
- Document management APIs
- Error handling
- Rate limiting
- Security considerations
- Integration examples

## 🐛 Troubleshooting

### Common Issues

**Add-in not loading**
- Ensure development server is running on HTTPS
- Check certificate installation
- Verify manifest.xml syntax

**Authentication fails**
- Check mock authentication logic
- Verify phone number format
- Ensure localStorage is accessible

**Document insertion fails**
- Verify Office.js API compatibility
- Check Word version support
- Review console errors

### Debug Mode
Enable debug logging by setting:
```javascript
localStorage.setItem('docuid_debug', 'true');
```

## 🤝 Contributing

1. Create feature branch from `phase-1-foundation`
2. Follow existing code style and patterns
3. Test thoroughly on both Windows and macOS
4. Update documentation as needed
5. Submit pull request with detailed description

## 📄 License

[License information to be added]

## 📞 Support

For support and questions:
- Check the [API Documentation](../docs/API_DOCUMENTATION.md)
- Review the [Project Plan](../docs/PROJECT_PLAN.md)
- Contact the development team

---

**Phase 1 Status**: ✅ Complete
- Environment setup ✅
- Project scaffolding ✅
- Basic UI implementation ✅
- Mock authentication ✅
- Document list functionality ✅
- Office.js integration ✅ 