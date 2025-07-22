// services/SimpleDriveService.js
// Frontend-only Google Drive upload without backend (Web + Mobile compatible)

import { Platform } from 'react-native';

// Conditionally import expo-file-system only on native platforms
let FileSystem = null;
if (Platform.OS !== 'web') {
  FileSystem = require('expo-file-system');
}

class SimpleDriveService {
  // Your Google Drive folder ID
  static FOLDER_ID = '17Z64oFj5nolu4sQPYAcrdv7KvKKw967l';
  
  // You'll need to get an API key from Google Cloud Console
  static API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
  
  // For OAuth (you'll need to implement this)
  static ACCESS_TOKEN = null;

  /**
   * Convert image URI to base64 (cross-platform)
   */
  static async imageToBase64(imageUri) {
    if (Platform.OS === 'web') {
      // Web implementation using fetch and FileReader
      try {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('Web base64 conversion error:', error);
        throw new Error('Failed to convert image to base64 on web');
      }
    } else {
      // Mobile implementation using expo-file-system
      if (!FileSystem) {
        throw new Error('FileSystem not available on this platform');
      }
      
      try {
        return await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } catch (error) {
        console.error('Mobile base64 conversion error:', error);
        throw new Error('Failed to convert image to base64 on mobile');
      }
    }
  }

  /**
   * Simple upload using API key (public uploads)
   * This method uploads files as publicly readable
   */
  static async uploadWithApiKey(imageUri, fileName, studentSNumber) {
    try {
      console.log('📤 Starting cross-platform Google Drive upload...');
      console.log('Platform:', Platform.OS);
      console.log('Image URI:', imageUri);

      if (!this.API_KEY) {
        throw new Error('Google API key not found. Add EXPO_PUBLIC_GOOGLE_API_KEY to your .env file');
      }

      // Convert image to base64 (cross-platform)
      console.log('🔄 Converting image to base64...');
      const base64Data = await this.imageToBase64(imageUri);
      console.log('✅ Base64 conversion successful, length:', base64Data.length);

      // Create a unique filename
      const timestamp = Date.now();
      const uniqueFileName = `${studentSNumber}_${timestamp}_${fileName}.jpg`;

      // Create multipart form data for upload
      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const close_delim = `\r\n--${boundary}--`;

      const metadata = {
        name: uniqueFileName,
        parents: [this.FOLDER_ID],
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

      console.log('🌐 Uploading to Google Drive...');
      const response = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&key=${this.API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': `multipart/related; boundary="${boundary}"`,
          },
          body: multipartRequestBody,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Drive upload error:', errorText);
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Upload successful:', result);

      return {
        fileId: result.id,
        fileName: result.name,
        webViewLink: `https://drive.google.com/file/d/${result.id}/view`,
        downloadLink: `https://drive.google.com/uc?id=${result.id}`,
        storage: 'google_drive'
      };

    } catch (error) {
      console.error('❌ Google Drive upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload using OAuth token (more secure, requires user login)
   * You would need to implement Google OAuth flow for this
   */
  static async uploadWithOAuth(imageUri, fileName, studentSNumber) {
    try {
      if (!this.ACCESS_TOKEN) {
        // You would need to implement OAuth flow here
        throw new Error('OAuth not implemented. Use API key method or implement OAuth.');
      }

      // Similar to above but uses Authorization header instead of API key
      // ... implementation would be similar to uploadWithApiKey
      
    } catch (error) {
      console.error('OAuth upload failed:', error);
      throw error;
    }
  }

  /**
   * Main upload method with fallback
   */
  static async uploadImage(imageUri, studentSNumber, eventName) {
    try {
      console.log('🚀 Starting upload process...');
      console.log('Platform:', Platform.OS);
      console.log('Parameters:', { studentSNumber, eventName });
      
      // Try API key upload first (simplest method)
      return await this.uploadWithApiKey(imageUri, eventName, studentSNumber);
      
    } catch (error) {
      console.error('Google Drive upload failed, using fallback:', error);
      
      // Fallback: Save locally with metadata for later sync
      return {
        localUri: imageUri,
        fileName: `${studentSNumber}_${Date.now()}_${eventName}.jpg`,
        studentSNumber: studentSNumber,
        eventName: eventName,
        uploadStatus: 'failed',
        storage: 'local',
        error: error.message
      };
    }
  }

  /**
   * Check if we can upload to Google Drive
   */
  static async testConnection() {
    try {
      console.log('🧪 Testing Google Drive connection...');
      console.log('Platform:', Platform.OS);
      console.log('API Key available:', !!this.API_KEY);
      
      if (!this.API_KEY) {
        return { success: false, error: 'No API key configured' };
      }

      // Test by trying to get folder info
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${this.FOLDER_ID}?key=${this.API_KEY}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (response.ok) {
        const folderInfo = await response.json();
        console.log('✅ Google Drive connection successful');
        return { 
          success: true, 
          message: 'Google Drive connection successful',
          folderName: folderInfo.name,
          platform: Platform.OS
        };
      } else {
        const errorText = await response.text();
        console.error('❌ Google Drive connection failed:', errorText);
        return { 
          success: false, 
          error: `Connection failed: ${response.status} ${errorText}` 
        };
      }
    } catch (error) {
      console.error('❌ Connection test error:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Alternative web-only upload using FormData (if the above doesn't work)
   */
  static async uploadWithFormData(imageUri, fileName, studentSNumber) {
    try {
      if (Platform.OS !== 'web') {
        throw new Error('FormData upload is web-only');
      }

      console.log('📤 Using FormData upload method for web...');

      // Convert image to blob for web
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Create unique filename
      const timestamp = Date.now();
      const uniqueFileName = `${studentSNumber}_${timestamp}_${fileName}.jpg`;

      // Create form data
      const formData = new FormData();
      formData.append('metadata', JSON.stringify({
        name: uniqueFileName,
        parents: [this.FOLDER_ID]
      }));
      formData.append('file', blob, uniqueFileName);

      const uploadResponse = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&key=${this.API_KEY}`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`FormData upload failed: ${uploadResponse.status} ${errorText}`);
      }

      const result = await uploadResponse.json();
      console.log('✅ FormData upload successful:', result);

      return {
        fileId: result.id,
        fileName: result.name,
        webViewLink: `https://drive.google.com/file/d/${result.id}/view`,
        downloadLink: `https://drive.google.com/uc?id=${result.id}`,
        storage: 'google_drive',
        method: 'formdata'
      };

    } catch (error) {
      console.error('❌ FormData upload failed:', error);
      throw error;
    }
  }
}

export default SimpleDriveService;