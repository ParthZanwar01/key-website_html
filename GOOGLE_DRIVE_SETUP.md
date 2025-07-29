# Google Drive Setup Guide

## Environment Variables

To enable the "Save to Drive" functionality in the admin hour management screen, you need to set up the following environment variables:

### Required Variables

1. **EXPO_PUBLIC_GOOGLE_CLIENT_ID**
   - Google OAuth client ID (required for authentication)
   - This is used for OAuth2 authentication with Google Drive API

2. **EXPO_PUBLIC_GOOGLE_CLIENT_SECRET**
   - Google OAuth client secret (required for web platform)
   - This is used for token exchange in the OAuth2 flow

3. **EXPO_PUBLIC_GOOGLE_DRIVE_FOLDER_ID**
   - Google Drive folder ID where photos will be saved
   - Default: `17Z64oFj5nolu4sQPYAcrdv7KvKKw967l`

### Optional Variables

4. **EXPO_PUBLIC_NETLIFY_URL**
   - Your Netlify app URL (e.g., `https://crhskeyclubwebsite.netlify.app/`)
   - This is used to call the Netlify function that handles Google Drive uploads (fallback method)

## Setup Instructions

1. **Set up Google Cloud Console OAuth2 credentials**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the Google Drive API
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
   - Set application type to "Web application"
   - Add authorized redirect URIs:
     - `https://your-app-domain.netlify.app/auth/callback`
     - `http://localhost:19006` (for development)
   - Copy the Client ID and Client Secret

2. **Create a `.env` file** in your project root with the OAuth2 credentials:
   ```
   EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
   EXPO_PUBLIC_GOOGLE_CLIENT_SECRET=your_client_secret_here
   EXPO_PUBLIC_GOOGLE_DRIVE_FOLDER_ID=your_folder_id_here
   ```

   **Note:** The `EXPO_PUBLIC_GOOGLE_API_KEY` is no longer needed since we switched to OAuth2 authentication.

3. **Deploy your app to Netlify** to get the Netlify URL

4. **Update the redirect URI** in Google Cloud Console with your actual Netlify URL

## How It Works

The "Save to Drive" button now uses OAuth2 authentication:

1. **Primary Method**: OAuth2 → Google Drive API (direct upload)
2. **Fallback Method**: Netlify Function → Google Apps Script → Google Drive

The app will prompt users to authenticate with Google when they first try to save a photo to Drive.

## Troubleshooting

- Check the console logs for detailed error messages
- Ensure your OAuth2 credentials are correctly set in the `.env` file
- Verify your Google Cloud Console project has the Drive API enabled
- Make sure the Google Drive folder ID is correct and accessible
- Check that your redirect URIs in Google Cloud Console match your app URLs
- If you get "401 Unauthorized" errors, try re-authenticating by signing out and back in 