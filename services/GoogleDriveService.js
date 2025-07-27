// Google Drive Service for direct file uploads
const GOOGLE_CLIENT_ID = '28895447434-4erojjje07c8essjdjr2br01860cp5f5.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';
const DRIVE_FOLDER_ID = '17Z64oFj5nolu4sQPYAcrdv7KvKKw967l';

class GoogleDriveService {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
  }

  // Initialize OAuth flow
  async initializeAuth() {
    try {
      console.log('🔐 Initializing Google Drive OAuth...');
      
      // For React Native, we'll use a web-based OAuth flow
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent('https://your-app-domain.netlify.app/auth/callback')}&` +
        `scope=${encodeURIComponent('https://www.googleapis.com/auth/drive.file')}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `prompt=consent`;

      console.log('🌐 Auth URL:', authUrl);
      
      // For now, we'll use a simplified approach
      // In a real app, you'd open this URL in a WebView
      return {
        success: true,
        authUrl: authUrl,
        message: 'Please complete OAuth flow in browser'
      };
    } catch (error) {
      console.error('❌ OAuth initialization failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Handle OAuth callback and get access token
  async handleAuthCallback(authCode) {
    try {
      console.log('🔄 Exchanging auth code for tokens...');
      
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          code: authCode,
          grant_type: 'authorization_code',
          redirect_uri: 'https://your-app-domain.netlify.app/auth/callback'
        })
      });

      const tokenData = await tokenResponse.json();
      
      if (tokenData.access_token) {
        this.accessToken = tokenData.access_token;
        this.refreshToken = tokenData.refresh_token;
        
        console.log('✅ OAuth tokens obtained');
        return { success: true };
      } else {
        throw new Error('Failed to get access token');
      }
    } catch (error) {
      console.error('❌ Token exchange failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Upload file to Google Drive
  async uploadFile(fileName, fileData, studentName, eventName) {
    try {
      if (!this.accessToken) {
        throw new Error('Not authenticated. Please complete OAuth flow first.');
      }

      console.log('📤 Uploading file to Google Drive...');
      console.log('📝 File:', fileName);
      console.log('👤 Student:', studentName);
      console.log('🎯 Event:', eventName);

      // Create file metadata
      const metadata = {
        name: fileName,
        parents: [DRIVE_FOLDER_ID],
        description: `Student: ${studentName}\nEvent: ${eventName}\nUploaded: ${new Date().toISOString()}`
      };

      // Convert base64 to blob
      const base64Data = fileData.replace(/^data:image\/[a-z]+;base64,/, '');
      const binaryData = atob(base64Data);
      const bytes = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i);
      }

      // Create multipart request
      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: image/jpeg\r\n' +
        'Content-Transfer-Encoding: base64\r\n\r\n' +
        base64Data +
        close_delim;

      // Upload to Google Drive
      const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': multipartRequestBody.length.toString()
        },
        body: multipartRequestBody
      });

      if (uploadResponse.ok) {
        const result = await uploadResponse.json();
        console.log('✅ File uploaded successfully:', result);
        return {
          success: true,
          fileId: result.id,
          fileName: result.name,
          webViewLink: result.webViewLink
        };
      } else {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
      }

    } catch (error) {
      console.error('❌ File upload failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Refresh access token if needed
  async refreshAccessToken() {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token'
        })
      });

      const tokenData = await response.json();
      
      if (tokenData.access_token) {
        this.accessToken = tokenData.access_token;
        console.log('✅ Access token refreshed');
        return true;
      } else {
        throw new Error('Failed to refresh access token');
      }
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      return false;
    }
  }

  // Check if authenticated
  isAuthenticated() {
    return !!this.accessToken;
  }

  // Get authentication status
  getAuthStatus() {
    return {
      isAuthenticated: this.isAuthenticated(),
      hasRefreshToken: !!this.refreshToken
    };
  }
}

export default new GoogleDriveService();
