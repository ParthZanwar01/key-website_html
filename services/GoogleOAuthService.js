// services/GoogleOAuthService.js
// OAuth2 implementation for Google Drive uploads with cross-platform storage

import { Platform } from 'react-native-web';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import CrossPlatformStorage from './CrossPlatformStorage';

class GoogleOAuthService {
  // OAuth2 Configuration
  static CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  static CLIENT_SECRET = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET; // Only needed for web
  
  // OAuth2 endpoints
  static AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
  static TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
  static REVOKE_ENDPOINT = 'https://oauth2.googleapis.com/revoke';
  
  // Scopes
  static SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.email'
  ];
  
  // Storage keys
  static ACCESS_TOKEN_KEY = 'google_drive_access_token';
  static REFRESH_TOKEN_KEY = 'google_drive_refresh_token';
  static TOKEN_EXPIRY_KEY = 'google_drive_token_expiry';
  static USER_INFO_KEY = 'google_drive_user_info';

  /**
   * Validate OAuth2 configuration
   */
  static validateConfig() {
    if (!this.CLIENT_ID) {
      throw new Error('EXPO_PUBLIC_GOOGLE_CLIENT_ID is required. Check your .env file.');
    }
    
    if (Platform.OS === 'web' && !this.CLIENT_SECRET) {
      console.warn('CLIENT_SECRET recommended for web platform');
    }
    
    console.log('✅ OAuth2 configuration valid');
    return true;
  }

  /**
   * Create authorization request
   */
  static createAuthRequest() {
    this.validateConfig();
    
    // For web platform, use a proper redirect URI
    let redirectUri;
    if (Platform.OS === 'web') {
      // Use the current domain with a callback path
      const currentOrigin = window.location.origin;
      redirectUri = `${currentOrigin}/auth/callback`;
    } else {
      redirectUri = AuthSession.makeRedirectUri({
        useProxy: true, // Use Expo's auth proxy for development
      });
    }
    
    console.log('OAuth redirect URI:', redirectUri);
    
    const request = new AuthSession.AuthRequest({
      clientId: this.CLIENT_ID,
      scopes: this.SCOPES,
      responseType: AuthSession.ResponseType.Code,
      redirectUri: redirectUri,
      additionalParameters: {
        access_type: 'offline', // Get refresh token
        prompt: 'consent', // Force consent screen
      },
    });
    
    return { request, redirectUri };
  }

  /**
   * Start OAuth2 authentication flow
   */
  static async authenticate() {
    try {
      console.log('🚀 Starting Google OAuth2 flow...');
      
      const { request, redirectUri } = this.createAuthRequest();
      
      const discovery = {
        authorizationEndpoint: this.AUTH_ENDPOINT,
        tokenEndpoint: this.TOKEN_ENDPOINT,
        revocationEndpoint: this.REVOKE_ENDPOINT,
      };
      
            // For web platform, use direct redirect to avoid popup blocking
      if (Platform.OS === 'web') {
        console.log('🌐 Using direct redirect for web OAuth...');
        
        // Create the authorization URL - handle the Promise properly
        const authUrl = await request.makeAuthUrlAsync(discovery);
        
        // Store the current state to handle the callback
        localStorage.setItem('oauth_state', JSON.stringify({
          timestamp: Date.now(),
          returnUrl: window.location.href
        }));
        
        console.log('🔗 Redirecting to:', authUrl);
        
        // Redirect to Google OAuth
        window.location.href = authUrl;
        
        return {
          success: false,
          error: 'Redirecting to Google for authentication...',
          redirectUrl: authUrl,
          requiresRedirect: true
        };
      } else {
        // Mobile platform - use standard approach
        const result = await request.promptAsync(discovery);
        
        if (result.type === 'success') {
          console.log('✅ OAuth2 authorization successful');
          
          // Exchange authorization code for tokens
          const tokens = await this.exchangeCodeForTokens(result.params.code, redirectUri);
          
          // Store tokens securely
          await this.storeTokens(tokens);
          
          // Get user info
          const userInfo = await this.getUserInfo(tokens.access_token);
          await this.storeUserInfo(userInfo);
          
          console.log('✅ Authentication complete for user:', userInfo.email);
          
          return {
            success: true,
            user: userInfo,
            tokens: tokens
          };
        } else {
          console.log('❌ OAuth2 authorization failed:', result);
          return {
            success: false,
            error: result.type === 'cancel' ? 'User cancelled' : 'Authorization failed',
            details: result
          };
        }
      }
    } catch (error) {
      console.error('❌ OAuth2 authentication error:', error);
      return {
        success: false,
        error: error.message,
        details: error
      };
    }
  }

  /**
   * Exchange authorization code for access/refresh tokens
   */
  static async exchangeCodeForTokens(code, redirectUri) {
    try {
      console.log('🔄 Exchanging code for tokens...');
      
      const body = new URLSearchParams({
        client_id: this.CLIENT_ID,
        client_secret: this.CLIENT_SECRET || '', // Empty for mobile
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      });
      
      const response = await fetch(this.TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Token exchange failed: ${response.status} ${errorData}`);
      }
      
      const tokens = await response.json();
      
      if (tokens.error) {
        throw new Error(`Token exchange error: ${tokens.error_description || tokens.error}`);
      }
      
      // Calculate expiry time
      const expiryTime = Date.now() + (tokens.expires_in * 1000);
      
      console.log('✅ Token exchange successful');
      
      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
        expires_at: expiryTime,
        token_type: tokens.token_type || 'Bearer'
      };
    } catch (error) {
      console.error('❌ Token exchange failed:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken() {
    try {
      console.log('🔄 Refreshing access token...');
      
      const refreshToken = await CrossPlatformStorage.getItem(this.REFRESH_TOKEN_KEY);
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const body = new URLSearchParams({
        client_id: this.CLIENT_ID,
        client_secret: this.CLIENT_SECRET || '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      });
      
      const response = await fetch(this.TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Token refresh failed: ${response.status} ${errorData}`);
      }
      
      const tokens = await response.json();
      
      if (tokens.error) {
        throw new Error(`Token refresh error: ${tokens.error_description || tokens.error}`);
      }
      
      // Calculate new expiry time
      const expiryTime = Date.now() + (tokens.expires_in * 1000);
      
      // Store new access token
      await CrossPlatformStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.access_token);
      await CrossPlatformStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
      
      // Update refresh token if provided
      if (tokens.refresh_token) {
        await CrossPlatformStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refresh_token);
      }
      
      console.log('✅ Token refresh successful');
      
      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || refreshToken,
        expires_in: tokens.expires_in,
        expires_at: expiryTime,
        token_type: tokens.token_type || 'Bearer'
      };
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  static async getValidAccessToken() {
    try {
      const accessToken = await CrossPlatformStorage.getItem(this.ACCESS_TOKEN_KEY);
      const expiryTime = await CrossPlatformStorage.getItem(this.TOKEN_EXPIRY_KEY);
      
      if (!accessToken) {
        throw new Error('No access token found. Please authenticate first.');
      }
      
      // Check if token is expired (with 5 minute buffer)
      const now = Date.now();
      const expiry = parseInt(expiryTime) || 0;
      const bufferTime = 5 * 60 * 1000; // 5 minutes
      
      if (expiry > 0 && now >= (expiry - bufferTime)) {
        console.log('🔄 Access token expired, refreshing...');
        const refreshedTokens = await this.refreshAccessToken();
        return refreshedTokens.access_token;
      }
      
      return accessToken;
    } catch (error) {
      console.error('❌ Failed to get valid access token:', error);
      throw error;
    }
  }

  /**
   * Get user information
   */
  static async getUserInfo(accessToken) {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get user info: ${response.status}`);
      }
      
      const userInfo = await response.json();
      return userInfo;
    } catch (error) {
      console.error('❌ Failed to get user info:', error);
      throw error;
    }
  }

  /**
   * Store tokens securely
   */
  static async storeTokens(tokens) {
    try {
      await CrossPlatformStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.access_token);
      
      if (tokens.refresh_token) {
        await CrossPlatformStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refresh_token);
      }
      
      if (tokens.expires_at) {
        await CrossPlatformStorage.setItem(this.TOKEN_EXPIRY_KEY, tokens.expires_at.toString());
      }
      
      console.log('✅ Tokens stored securely');
    } catch (error) {
      console.error('❌ Failed to store tokens:', error);
      throw error;
    }
  }

  /**
   * Store user information
   */
  static async storeUserInfo(userInfo) {
    try {
      await CrossPlatformStorage.setObject(this.USER_INFO_KEY, userInfo);
      console.log('✅ User info stored');
    } catch (error) {
      console.error('❌ Failed to store user info:', error);
    }
  }

  /**
   * Get stored user information
   */
  static async getStoredUserInfo() {
    try {
      return await CrossPlatformStorage.getObject(this.USER_INFO_KEY);
    } catch (error) {
      console.error('❌ Failed to get stored user info:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated() {
    try {
      const accessToken = await CrossPlatformStorage.getItem(this.ACCESS_TOKEN_KEY);
      const refreshToken = await CrossPlatformStorage.getItem(this.REFRESH_TOKEN_KEY);
      
      return !!(accessToken || refreshToken);
    } catch (error) {
      console.error('❌ Failed to check authentication status:', error);
      return false;
    }
  }

  /**
   * Sign out and clear stored tokens
   */
  static async signOut() {
    try {
      console.log('🚪 Signing out...');
      
      // Get access token for revocation
      const accessToken = await CrossPlatformStorage.getItem(this.ACCESS_TOKEN_KEY);
      
      // Revoke token on Google's end
      if (accessToken) {
        try {
          await fetch(`${this.REVOKE_ENDPOINT}?token=${accessToken}`, {
            method: 'POST',
          });
          console.log('✅ Token revoked on Google');
        } catch (revokeError) {
          console.warn('⚠️ Failed to revoke token on Google:', revokeError);
        }
      }
      
      // Clear stored tokens
      await CrossPlatformStorage.removeItem(this.ACCESS_TOKEN_KEY);
      await CrossPlatformStorage.removeItem(this.REFRESH_TOKEN_KEY);
      await CrossPlatformStorage.removeItem(this.TOKEN_EXPIRY_KEY);
      await CrossPlatformStorage.removeItem(this.USER_INFO_KEY);
      
      console.log('✅ Sign out complete');
      return true;
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      return false;
    }
  }

  /**
   * Test authentication and Drive access
   */
  static async testAuthentication() {
    try {
      console.log('🧪 Testing Google Drive authentication...');
      
      const accessToken = await this.getValidAccessToken();
      
      // Test Drive API access
      const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Drive API test failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('✅ Google Drive authentication test successful');
      
      return {
        success: true,
        user: data.user,
        message: 'Google Drive access confirmed'
      };
    } catch (error) {
      console.error('❌ Authentication test failed:', error);
      return {
        success: false,
        error: error.message,
        requiresAuth: error.message.includes('No access token') || error.message.includes('401')
      };
    }
  }

  /**
   * Handle OAuth callback from popup
   */
  static async handleCallback() {
    try {
      const code = localStorage.getItem('oauth_code');
      const timestamp = localStorage.getItem('oauth_timestamp');
      
      if (!code) {
        return { success: false, error: 'No OAuth code found' };
      }
      
      // Clear the stored code
      localStorage.removeItem('oauth_code');
      localStorage.removeItem('oauth_timestamp');
      
      // Check if code is recent (within 10 minutes)
      const codeAge = Date.now() - parseInt(timestamp);
      if (codeAge > 10 * 60 * 1000) {
        return { success: false, error: 'OAuth code expired' };
      }
      
      // Exchange code for tokens
      const { request, redirectUri } = this.createAuthRequest();
      const tokens = await this.exchangeCodeForTokens(code, redirectUri);
      
      // Store tokens securely
      await this.storeTokens(tokens);
      
      // Get user info
      const userInfo = await this.getUserInfo(tokens.access_token);
      await this.storeUserInfo(userInfo);
      
      console.log('✅ OAuth callback handled successfully for user:', userInfo.email);
      
      return {
        success: true,
        user: userInfo,
        tokens: tokens
      };
    } catch (error) {
      console.error('❌ OAuth callback handling failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get authentication status and user info
   */
  static async getAuthStatus() {
    try {
      const isAuth = await this.isAuthenticated();
      const userInfo = await this.getStoredUserInfo();
      
      return {
        isAuthenticated: isAuth,
        user: userInfo,
        platform: Platform.OS
      };
    } catch (error) {
      console.error('❌ Failed to get auth status:', error);
      return {
        isAuthenticated: false,
        user: null,
        error: error.message
      };
    }
  }
}

export default GoogleOAuthService;