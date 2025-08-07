# Google Drive Integration Setup Guide

This guide will help you set up Google Drive integration for file uploads in your Key Club Hub web application.

## Prerequisites

1. Google Cloud Console account
2. Google Drive API enabled
3. OAuth 2.0 credentials configured
4. Your Google Drive folder ID (already provided)

## Step 1: Google Cloud Console Setup

### 1.1 Create/Select Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable billing (required for API usage)

### 1.2 Enable Google Drive API
1. Go to **APIs & Services > Library**
2. Search for "Google Drive API"
3. Click on it and press **Enable**

### 1.3 Configure OAuth Consent Screen
1. Go to **APIs & Services > OAuth consent screen**
2. Choose **External** user type
3. Fill in the required information:
   - App name: "Key Club Hub"
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes:
   - `https://www.googleapis.com/auth/drive.file`
5. Add test users (your email)
6. Save and continue

### 1.4 Create OAuth 2.0 Credentials
1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Add authorized redirect URIs:
   - `http://localhost:8000/auth/callback.html` (for development)
   - `https://your-domain.com/auth/callback.html` (for production)
5. Save the credentials
6. Note down the **Client ID** and **Client Secret**

## Step 2: Update Configuration

Your Google Drive credentials are already configured in `js/config.js`:

```javascript
GOOGLE_API_KEY: 'AIzaSyCcX-uLOzgPYhJMkp5JC22fhPqU359u_kY',
GOOGLE_CLIENT_ID: '28895447434-n468oke316vaeo8hcguue7222vijorfr.apps.googleusercontent.com',
GOOGLE_CLIENT_SECRET: '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',
GOOGLE_DRIVE_FOLDER_ID: '17Z64oFj5nolu4sQPYAcrdv7KvKKw967l',
```

## Step 3: Set Up Google Drive Folder

1. Go to [Google Drive](https://drive.google.com/)
2. Create a new folder for Key Club Hub files
3. Right-click the folder and select **Share**
4. Set permissions to **Anyone with the link can view**
5. Copy the folder ID from the URL (the long string after `/folders/`)

## Step 4: Test the Integration

1. Start your web application: `http://localhost:8000`
2. Log in as an admin
3. Try to create an announcement with an image
4. The first time you upload a file, you'll be prompted to authenticate with Google Drive
5. Complete the OAuth flow
6. The file should be uploaded to your Google Drive folder

## Step 5: File Upload Features

### Supported File Types
- Images: JPEG, PNG, GIF, WebP
- Documents: PDF, DOC, DOCX
- Maximum file size: 5MB

### Upload Locations
- **Announcements**: `announcements/` folder
- **Hour Requests**: `hour-requests/` folder
- **General Files**: `general/` folder

### File Naming Convention
Files are automatically named with timestamps:
```
folder/1234567890_filename.jpg
```

## Step 6: OAuth Flow

The application uses a popup-based OAuth flow:

1. **First Upload**: User clicks upload, OAuth popup opens
2. **Authentication**: User grants permissions to the app
3. **Callback**: OAuth callback page handles the response
4. **Token Storage**: Access and refresh tokens are stored securely
5. **Upload**: File is uploaded to Google Drive
6. **Success**: User receives confirmation and file link

## Step 7: Security Considerations

### Token Management
- Access tokens are stored in localStorage (encrypted in production)
- Refresh tokens are used to get new access tokens
- Tokens are automatically refreshed when needed

### File Permissions
- Files are uploaded to a specific Google Drive folder
- Folder permissions control who can access files
- Files are organized by type and date

### OAuth Scopes
The application requests minimal permissions:
- `https://www.googleapis.com/auth/drive.file` - Access to files created by the app

## Step 8: Troubleshooting

### Common Issues

1. **OAuth Popup Blocked**
   - Allow popups for your domain
   - Check browser settings

2. **Authentication Failed**
   - Verify OAuth credentials
   - Check redirect URIs
   - Ensure API is enabled

3. **Upload Failed**
   - Check file size (max 5MB)
   - Verify file type is supported
   - Check network connection

4. **Token Expired**
   - Tokens are automatically refreshed
   - If refresh fails, user needs to re-authenticate

### Debug Information
Check the browser console for detailed error messages:
```javascript
// Check Google Drive status
console.log(GoogleDrive.getAuthStatus());

// Check if authenticated
console.log(GoogleDrive.isAuthenticated);
```

## Step 9: Production Deployment

### Update Redirect URIs
1. Go to Google Cloud Console
2. Update OAuth 2.0 credentials
3. Add your production domain to authorized redirect URIs
4. Remove localhost URIs

### Environment Variables
For production, consider using environment variables:
```javascript
GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
```

### HTTPS Required
Google OAuth requires HTTPS in production:
- Use a valid SSL certificate
- Update redirect URIs to use HTTPS

## Step 10: Monitoring and Usage

### Google Cloud Console
- Monitor API usage in **APIs & Services > Dashboard**
- Check quotas and limits
- Review OAuth consent screen analytics

### File Management
- Files are automatically organized in Google Drive
- Use Google Drive interface to manage files
- Set up automated backups if needed

## Step 11: Advanced Features

### Custom File Metadata
You can add custom metadata to uploaded files:
```javascript
const metadata = {
    description: 'Key Club event photo',
    studentName: 'John Doe',
    eventName: 'Community Service Day'
};

await API.uploadFile(file, 'announcements', metadata);
```

### File Organization
Files are organized by:
- **Type**: announcements, hour-requests, general
- **Date**: Timestamp prefix for chronological ordering
- **Original Name**: Preserved for easy identification

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify Google Cloud Console settings
3. Test OAuth flow manually
4. Check file permissions in Google Drive
5. Review API quotas and limits

Your Google Drive integration is now ready to use! 🎉

## Next Steps

1. Test file uploads with different file types
2. Set up automated backups if needed
3. Monitor usage and adjust quotas
4. Train users on the upload process
5. Set up file management procedures 