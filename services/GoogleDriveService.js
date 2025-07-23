// services/GoogleDriveService.js
// Google Drive upload service using OAuth2 authentication

import { Platform } from 'react-native';
import GoogleOAuthService from './GoogleOAuthService';

// Conditionally import expo-file-system only on native platforms
let FileSystem = null;
if (Platform.OS !== 'web') {
  try {
    FileSystem = require('expo-file-system');
  } catch (error) {
    console.warn('expo-file-system not available:', error);
  }
}

class GoogleDriveService {
  // Configuration
  static FOLDER_ID = process.env.EXPO_PUBLIC_GOOGLE_DRIVE_FOLDER_ID || '17Z64oFj5nolu4sQPYAcrdv7KvKKw967l';
  static MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
  static UPLOAD_TIMEOUT = 60000; // 60 seconds

  /**
   * Ensure user is authenticated for Drive access
   */
  static async ensureAuthenticated() {
    try {
      const authStatus = await GoogleOAuthService.getAuthStatus();
      
      if (!authStatus.isAuthenticated) {
        console.log('🔐 User not authenticated, starting OAuth flow...');
        const authResult = await GoogleOAuthService.authenticate();
        
        if (!authResult.success) {
          throw new Error(`Authentication failed: ${authResult.error}`);
        }
        
        return authResult.user;
      }
      
      // Test if current tokens work
      const testResult = await GoogleOAuthService.testAuthentication();
      
      if (!testResult.success && testResult.requiresAuth) {
        console.log('🔄 Re-authentication required...');
        const authResult = await GoogleOAuthService.authenticate();
        
        if (!authResult.success) {
          throw new Error(`Re-authentication failed: ${authResult.error}`);
        }
        
        return authResult.user;
      }
      
      if (!testResult.success) {
        throw new Error(`Drive access test failed: ${testResult.error}`);
      }
      
      return authStatus.user || testResult.user;
    } catch (error) {
      console.error('❌ Authentication check failed:', error);
      throw error;
    }
  }

  /**
   * Validate file before upload
   */
  static async validateFile(imageUri) {
    try {
      if (Platform.OS === 'web') {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        
        if (blob.size > this.MAX_FILE_SIZE) {
          throw new Error(`File size (${Math.round(blob.size / 1024 / 1024)}MB) exceeds limit (${Math.round(this.MAX_FILE_SIZE / 1024 / 1024)}MB)`);
        }
        
        return { size: blob.size, type: blob.type };
      } else {
        if (!FileSystem) {
          return { size: 0, type: 'image/jpeg' };
        }
        
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        
        if (!fileInfo.exists) {
          throw new Error('File does not exist');
        }
        
        if (fileInfo.size > this.MAX_FILE_SIZE) {
          throw new Error(`File size (${Math.round(fileInfo.size / 1024 / 1024)}MB) exceeds limit (${Math.round(this.MAX_FILE_SIZE / 1024 / 1024)}MB)`);
        }
        
        return { size: fileInfo.size, type: 'image/jpeg' };
      }
    } catch (error) {
      console.error('File validation error:', error);
      throw error;
    }
  }

  /**
   * Convert image to base64
   */
  static async imageToBase64(imageUri) {
    try {
      if (Platform.OS === 'web') {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        if (!FileSystem) {
          throw new Error('FileSystem not available');
        }
        
        return await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }
    } catch (error) {
      console.error('Base64 conversion error:', error);
      throw error;
    }
  }

  /**
   * Upload file to Google Drive using OAuth2
   */
  static async uploadWithOAuth(imageUri, fileName, studentSNumber) {
    try {
      console.log('📤 Starting OAuth2 Google Drive upload...');
      
      // Ensure authentication
      const user = await this.ensureAuthenticated();
      console.log('✅ Authenticated as:', user.email || user.name);
      
      // Validate file
      const fileInfo = await this.validateFile(imageUri);
      console.log('✅ File validation passed:', fileInfo);
      
      // Get valid access token
      const accessToken = await GoogleOAuthService.getValidAccessToken();
      
      // Convert image to base64
      const base64Data = await this.imageToBase64(imageUri);
      console.log('✅ Image converted to base64, length:', base64Data.length);
      
      // Create unique filename
      const timestamp = Date.now();
      const safeFileName = fileName.replace(/[^a-zA-Z0-9]/g, '_');
      const uniqueFileName = `${studentSNumber}_${timestamp}_${safeFileName}.jpg`;
      
      // Prepare multipart upload
      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const close_delim = `\r\n--${boundary}--`;
      
      const metadata = {
        name: uniqueFileName,
        parents: [this.FOLDER_ID],
        description: `Hour request proof photo from ${studentSNumber} for ${fileName} (uploaded via ${user.email})`
      };
      
      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: image/jpeg\r\n' +
        'Content-Transfer-Encoding: base64\r\n\r\n' +
        base64Data +
        close_delim;
      
      console.log('🌐 Uploading to Google Drive with OAuth2...');
      
      // Upload with timeout
      const uploadPromise = fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary="${boundary}"`,
          },
          body: multipartRequestBody,
        }
      );
      
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Upload timeout')), this.UPLOAD_TIMEOUT)
      );
      
      const response = await Promise.race([uploadPromise, timeoutPromise]);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload error response:', errorText);
        
        // Check if it's an auth error
        if (response.status === 401) {
          throw new Error('Authentication expired. Please try again.');
        }
        
        throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ Upload successful:', result);
      
      // Make file publicly viewable
      try {
        await this.makeFilePublic(result.id, accessToken);
      } catch (permissionError) {
        console.warn('Could not make file public:', permissionError);
      }
      
      return {
        fileId: result.id,
        fileName: result.name,
        webViewLink: `https://drive.google.com/file/d/${result.id}/view`,
        downloadLink: `https://drive.google.com/uc?id=${result.id}`,
        thumbnailLink: `https://drive.google.com/thumbnail?id=${result.id}`,
        storage: 'google_drive',
        uploadedAt: new Date().toISOString(),
        fileSize: fileInfo.size,
        uploadStatus: 'completed',
        uploadMethod: 'oauth2',
        uploadedBy: user.email || user.name
      };
      
    } catch (error) {
      console.error('❌ OAuth2 upload failed:', error);
      throw error;
    }
  }

  /**
   * Make uploaded file publicly viewable
   */
  static async makeFilePublic(fileId, accessToken) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role: 'reader',
            type: 'anyone'
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to make file public: ${response.status}`);
      }
      
      console.log('✅ File made publicly viewable');
    } catch (error) {
      console.error('❌ Failed to make file public:', error);
      throw error;
    }
  }

  /**
   * Main upload method
   */
  static async uploadImage(imageUri, studentSNumber, eventName) {
    try {
      console.log('🚀 Starting upload process...');
      console.log('Platform:', Platform.OS);
      console.log('Parameters:', { studentSNumber, eventName });
      
      // Validate inputs
      if (!imageUri || !studentSNumber || !eventName) {
        throw new Error('Missing required parameters');
      }
      
      // Try OAuth2 upload
      return await this.uploadWithOAuth(imageUri, eventName, studentSNumber);
      
    } catch (error) {
      console.error('Upload failed:', error);
      
      // Create fallback data
      const timestamp = Date.now();
      const safeEventName = eventName.replace(/[^a-zA-Z0-9]/g, '_');
      
      return {
        localUri: imageUri,
        fileName: `${studentSNumber}_${timestamp}_${safeEventName}.jpg`,
        studentSNumber: studentSNumber,
        eventName: eventName,
        uploadStatus: 'failed',
        storage: 'local',
        error: error.message,
        uploadMethod: 'oauth2_failed',
        failedAt: new Date().toISOString(),
        retryable: !error.message.includes('Authentication') // Don't auto-retry auth errors
      };
    }
  }

  /**
   * Test Google Drive connection
   */
  static async testConnection() {
    try {
      console.log('🧪 Testing Google Drive OAuth2 connection...');
      
      const authTest = await GoogleOAuthService.testAuthentication();
      
      if (!authTest.success) {
        return {
          success: false,
          error: authTest.error,
          requiresAuth: authTest.requiresAuth,
          method: 'oauth2'
        };
      }
      
      // Test folder access
      const accessToken = await GoogleOAuthService.getValidAccessToken();
      
      const folderResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${this.FOLDER_ID}?fields=id,name`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      
      if (!folderResponse.ok) {
        throw new Error(`Folder access failed: ${folderResponse.status}`);
      }
      
      const folderInfo = await folderResponse.json();
      
      console.log('✅ Google Drive OAuth2 connection successful');
      
      return {
        success: true,
        message: 'Google Drive OAuth2 connection successful',
           method: 'oauth2',
        folder: folderInfo
      };
    } catch (error) {
      console.error('❌ Google Drive connection test failed:', error);
      return {
        success: false,
        error: error.message,
        method: 'oauth2',
        requiresAuth: error.message.toLowerCase().includes('auth') || error.message.toLowerCase().includes('unauthorized')
      };
    }
  }
}

export default GoogleDriveService;
