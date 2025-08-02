// Google Drive Diagnostic Script
// Run this in the browser console to check authentication status

console.log('🔍 Google Drive Diagnostic Tool');
console.log('================================');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('- EXPO_PUBLIC_GOOGLE_CLIENT_ID:', process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing');
console.log('- EXPO_PUBLIC_GOOGLE_CLIENT_SECRET:', process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
console.log('- EXPO_PUBLIC_GOOGLE_DRIVE_FOLDER_ID:', process.env.EXPO_PUBLIC_GOOGLE_DRIVE_FOLDER_ID ? '✅ Set' : '❌ Missing');

// Check localStorage for OAuth tokens
console.log('\n🔐 OAuth Token Status:');
const accessToken = localStorage.getItem('google_drive_access_token');
const refreshToken = localStorage.getItem('google_drive_refresh_token');
const tokenExpiry = localStorage.getItem('google_drive_token_expiry');
const userInfo = localStorage.getItem('google_drive_user_info');

console.log('- Access Token:', accessToken ? '✅ Present' : '❌ Missing');
console.log('- Refresh Token:', refreshToken ? '✅ Present' : '❌ Missing');
console.log('- Token Expiry:', tokenExpiry ? `✅ ${new Date(parseInt(tokenExpiry)).toLocaleString()}` : '❌ Missing');
console.log('- User Info:', userInfo ? '✅ Present' : '❌ Missing');

// Check if token is expired
if (tokenExpiry) {
  const now = Date.now();
  const expiry = parseInt(tokenExpiry);
  const isExpired = now >= expiry;
  console.log('- Token Status:', isExpired ? '❌ Expired' : '✅ Valid');
}

// Check OAuth callback data
console.log('\n🔄 OAuth Callback Data:');
const oauthCode = localStorage.getItem('oauth_code');
const oauthCodeVerifier = localStorage.getItem('oauth_code_verifier');
const oauthState = localStorage.getItem('oauth_state');

console.log('- OAuth Code:', oauthCode ? '✅ Present' : '❌ Missing');
console.log('- Code Verifier:', oauthCodeVerifier ? '✅ Present' : '❌ Missing');
console.log('- OAuth State:', oauthState ? '✅ Present' : '❌ Missing');

// Recommendations
console.log('\n💡 Recommendations:');
if (!accessToken || !refreshToken) {
  console.log('1. ❌ You need to authenticate with Google Drive first');
  console.log('   - Click the "Connect Google Drive" button in the admin panel');
  console.log('   - Complete the OAuth flow in the popup window');
  console.log('   - Make sure to allow all requested permissions');
} else if (tokenExpiry && Date.now() >= parseInt(tokenExpiry)) {
  console.log('1. ⚠️ Your access token has expired');
  console.log('   - Try refreshing the page and re-authenticating');
  console.log('   - Or click "Connect Google Drive" again');
} else {
  console.log('1. ✅ Authentication appears to be set up correctly');
  console.log('   - Try uploading a photo to test the connection');
}

console.log('2. 🔧 If authentication fails:');
console.log('   - Clear browser cache and cookies');
console.log('   - Try in an incognito/private window');
console.log('   - Check that popups are allowed for this site');

console.log('3. 🌐 Check your Google Cloud Console:');
console.log('   - Verify OAuth2 credentials are correct');
console.log('   - Ensure Google Drive API is enabled');
console.log('   - Check that redirect URIs include your domain');

console.log('\n🔧 To clear authentication and start fresh:');
console.log('localStorage.removeItem("google_drive_access_token");');
console.log('localStorage.removeItem("google_drive_refresh_token");');
console.log('localStorage.removeItem("google_drive_token_expiry");');
console.log('localStorage.removeItem("google_drive_user_info");');
console.log('localStorage.removeItem("oauth_code");');
console.log('localStorage.removeItem("oauth_code_verifier");');
console.log('localStorage.removeItem("oauth_state");');

console.log('\n✅ Diagnostic complete!'); 