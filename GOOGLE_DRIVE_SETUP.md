# Google Drive Setup Guide

## Environment Variables

To enable the "Save to Drive" functionality in the admin hour management screen, you need to set up the following environment variables:

### Required Variables

1. **EXPO_PUBLIC_NETLIFY_URL**
   - Your Netlify app URL (e.g., `https://crhskeyclubwebsite.netlify.app/`)
   - This is used to call the Netlify function that handles Google Drive uploads

2. **EXPO_PUBLIC_GOOGLE_API_KEY** (for fallback method)
   - Google API key with Drive API enabled
   - Used by SimpleDriveService as a fallback method

3. **EXPO_PUBLIC_GOOGLE_DRIVE_FOLDER_ID**
   - Google Drive folder ID where photos will be saved
   - Default: `17Z64oFj5nolu4sQPYAcrdv7KvKKw967l`

### Optional Variables

4. **EXPO_PUBLIC_GOOGLE_CLIENT_ID**
   - Google OAuth client ID (for advanced features)

5. **EXPO_PUBLIC_GOOGLE_CLIENT_SECRET**
   - Google OAuth client secret (for advanced features)

## Setup Instructions

1. **Create a `.env` file** in your project root with the above variables
2. **Deploy your app to Netlify** to get the Netlify URL
3. **Set up Google Drive API** in Google Cloud Console
4. **Configure the Netlify function** (`netlify/functions/gasProxy.js`)

## How It Works

The "Save to Drive" button uses a two-tier approach:

1. **Primary Method**: Netlify Function → Google Apps Script → Google Drive
2. **Fallback Method**: SimpleDriveService → Google Drive API (direct)

If the Netlify function fails, it automatically tries the SimpleDriveService method.

## Troubleshooting

- Check the console logs for detailed error messages
- Ensure your Netlify function is deployed and accessible
- Verify your Google API key has Drive API permissions
- Make sure the Google Drive folder ID is correct and accessible 