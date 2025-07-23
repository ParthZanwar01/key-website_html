
// services/GoogleDriveService.js
// Simplified Google Drive service using Google Apps Script - NO OAuth2!

import * as FileSystem from 'expo-file-system';

class GoogleDriveService {
  // Replace this with your deployed Google Apps Script web app URL
  static APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxBZbYyor6Fo8MmhHivyAkkgui7Z8_pTQp6qTw_QSCpM576tjAitsWWFu7tk3wCV8Lm5w/exec';
  
  static async uploadImage(imageUri, studentNumber, eventName = 'hour_request') {
    try {
      console.log('🚀 Starting Google Apps Script upload...');
      console.log('Image URI:', imageUri.substring(0, 50) + '...');
      console.log('Student:', studentNumber);
      console.log('Event:', eventName);
      
      // Check if we have the Apps Script URL configured
      if (this.APPS_SCRIPT_URL.includes('YOUR_SCRIPT_ID_HERE')) {
        throw new Error('Google Apps Script URL not configured. Please update APPS_SCRIPT_URL in GoogleDriveService.js');
      }
      
      // Read the image file and convert to base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log('📁 Image converted to base64, size:', base64.length);
      
      // Create filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${studentNumber}_${eventName}_${timestamp}.jpg`;
      
      // Prepare the payload
      const payload = {
        imageData: base64,
        fileName: fileName,
        studentNumber: studentNumber,
        eventName: eventName
      };
      
      console.log('📤 Sending to Google Apps Script...');
      
      // Send to Google Apps Script
      const response = await fetch(this.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      console.log('📨 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Upload result:', result);
      
      if (result.success) {
        return {
          success: true,
          storage: 'google_drive',
          fileId: result.fileId,
          fileName: result.fileName,
          fileUrl: result.fileUrl,
          downloadUrl: result.downloadUrl,
          thumbnailUrl: result.thumbnailUrl,
          uploadedAt: result.uploadedAt,
          studentFolder: result.studentFolder,
          uploadedBy: `Student ${studentNumber}`,
          message: result.message
        };
      } else {
        throw new Error(result.error || 'Unknown upload error');
      }
      
    } catch (error) {
      console.error('❌ Upload failed:', error);
      
      // Return error info for handling in the UI
      return {
        success: false,
        storage: 'local',
        error: error.message,
        localUri: imageUri,
        fileName: `${studentNumber}_${eventName}_${Date.now()}.jpg`,
        uploadStatus: 'failed',
        retryable: true,
        requiresAuth: false
      };
    }
  }
  
  // Test the connection to Google Apps Script
  static async testConnection() {
    try {
      console.log('🧪 Testing Google Apps Script connection...');
      
      // Check if URL is configured
      if (this.APPS_SCRIPT_URL.includes('YOUR_SCRIPT_ID_HERE')) {
        return {
          success: false,
          error: 'Google Apps Script URL not configured',
          diagnostic: 'url_not_configured'
        };
      }
      
      // Try a simple GET request to see if the endpoint exists
      const response = await fetch(this.APPS_SCRIPT_URL, {
        method: 'GET',
      });
      
      if (response.ok || response.status === 405) { // 405 is fine, means POST is expected
        return {
          success: true,
          folderName: 'Key Club Photos',
          message: 'Google Apps Script is connected and ready'
        };
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          diagnostic: 'apps_script_unreachable'
        };
      }
      
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return {
        success: false,
        error: error.message,
        diagnostic: 'network_error'
      };
    }
  }
  
  // No authentication needed for this approach
  static async reAuthenticate() {
    console.log('ℹ️ No authentication required for Google Apps Script approach');
    return Promise.resolve();
  }
}

export default GoogleDriveService;