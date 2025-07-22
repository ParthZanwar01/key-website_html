// services/SimpleDriveService.js
// Enhanced Google Drive upload service with better error handling and configuration

import { Platform } from 'react-native';

// Conditionally import expo-file-system only on native platforms
let FileSystem = null;
if (Platform.OS !== 'web') {
  try {
    FileSystem = require('expo-file-system');
  } catch (error) {
    console.warn('expo-file-system not available:', error);
  }
}

class SimpleDriveService {
  // Configuration from environment variables
  static FOLDER_ID = process.env.EXPO_PUBLIC_GOOGLE_DRIVE_FOLDER_ID || '17Z64oFj5nolu4sQPYAcrdv7KvKKw967l';
  static API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
  
  // Upload configuration
  static MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
  static ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
  static UPLOAD_TIMEOUT = 60000; // 60 seconds

  /**
   * Validate configuration
   */
  static validateConfig() {
    const issues = [];
    
    if (!this.API_KEY) {
      issues.push('EXPO_PUBLIC_GOOGLE_API_KEY environment variable is missing');
    }
    
    if (!this.FOLDER_ID) {
      issues.push('EXPO_PUBLIC_GOOGLE_DRIVE_FOLDER_ID environment variable is missing');
    }
    
    if (issues.length > 0) {
      const errorMessage = 'Google Drive configuration issues:\n' + issues.join('\n');
      console.error('❌', errorMessage);
      throw new Error(errorMessage);
    }
    
    console.log('✅ Google Drive configuration valid');
    return true;
  }

  /**
   * Get file type from URI or filename
   */
  static getFileType(uri) {
    const extension = uri.split('.').pop().toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      default:
        return 'image/jpeg'; // Default fallback
    }
  }

  /**
   * Validate file before upload
   */
  static async validateFile(imageUri) {
    try {
      if (Platform.OS === 'web') {
        // Web validation using fetch
        const response = await fetch(imageUri);
        const blob = await response.blob();
        
        if (blob.size > this.MAX_FILE_SIZE) {
          throw new Error(`File size (${Math.round(blob.size / 1024 / 1024)}MB) exceeds limit (${Math.round(this.MAX_FILE_SIZE / 1024 / 1024)}MB)`);
        }
        
        if (!this.ALLOWED_TYPES.includes(blob.type)) {
          throw new Error(`File type ${blob.type} not allowed. Supported: ${this.ALLOWED_TYPES.join(', ')}`);
        }
        
        return { size: blob.size, type: blob.type };
      } else {
        // Mobile validation using expo-file-system
        if (!FileSystem) {
          console.warn('FileSystem not available, skipping file validation');
          return { size: 0, type: this.getFileType(imageUri) };
        }
        
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        
        if (!fileInfo.exists) {
          throw new Error('File does not exist');
        }
        
        if (fileInfo.size > this.MAX_FILE_SIZE) {
          throw new Error(`File size (${Math.round(fileInfo.size / 1024 / 1024)}MB) exceeds limit (${Math.round(this.MAX_FILE_SIZE / 1024 / 1024)}MB)`);
        }
        
        return { size: fileInfo.size, type: this.getFileType(imageUri) };
      }
    } catch (error) {
      console.error('File validation error:', error);
      throw error;
    }
  }

  /**
   * Convert image URI to base64 (cross-platform)
   */
  static async imageToBase64(imageUri) {
    try {
      console.log(`🔄 Converting image to base64 (${Platform.OS})...`);
      
      if (Platform.OS === 'web') {
        // Web implementation using fetch and FileReader
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
      } else {
        // Mobile implementation using expo-file-system
        if (!FileSystem) {
          throw new Error('FileSystem not available on this platform');
        }
        
        return await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }
    } catch (error) {
      console.error('Base64 conversion error:', error);
      throw new Error(`Failed to convert image to base64: ${error.message}`);
    }
  }

  /**
   * Create timeout promise for upload
   */
  static createTimeoutPromise(timeoutMs) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Upload timeout after ${timeoutMs / 1000} seconds`));
      }, timeoutMs);
    });
  }

  /**
   * Upload to Google Drive with improved error handling
   */
  static async uploadWithApiKey(imageUri, fileName, studentSNumber) {
    try {
      console.log('📤 Starting Google Drive upload...');
      console.log('Platform:', Platform.OS);
      console.log('Image URI:', imageUri.substring(0, 50) + '...');
      
      // Validate configuration
      this.validateConfig();
      
      // Validate file
      const fileInfo = await this.validateFile(imageUri);
      console.log('✅ File validation passed:', fileInfo);
      
      // Convert image to base64
      console.log('🔄 Converting to base64...');
      const base64Data = await this.imageToBase64(imageUri);
      console.log('✅ Base64 conversion successful, length:', base64Data.length);
      
      // Create unique filename with timestamp
      const timestamp = Date.now();
      const safeFileName = fileName.replace(/[^a-zA-Z0-9]/g, '_');
      const uniqueFileName = `${studentSNumber}_${timestamp}_${safeFileName}.jpg`;
      
      // Create multipart form data for upload
      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const close_delim = `\r\n--${boundary}--`;
      
      const metadata = {
        name: uniqueFileName,
        parents: [this.FOLDER_ID],
        description: `Hour request proof photo from ${studentSNumber} for ${fileName}`
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
      
      // Create upload promise with timeout
      const uploadPromise = fetch(
        `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&key=${this.API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': `multipart/related; boundary="${boundary}"`,
          },
          body: multipartRequestBody,
        }
      );
      
      // Race upload against timeout
      const response = await Promise.race([
        uploadPromise,
        this.createTimeoutPromise(this.UPLOAD_TIMEOUT)
      ]);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Drive upload error response:', errorText);
        throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ Upload successful:', result);
      
      // Make file publicly viewable (optional)
      try {
        await this.makeFilePublic(result.id);
      } catch (permissionError) {
        console.warn('Could not make file public:', permissionError);
        // Continue anyway, file is still uploaded
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
        uploadStatus: 'completed'
      };
      
    } catch (error) {
      console.error('❌ Google Drive upload failed:', error);
      throw error;
    }
  }

  /**
   * Make uploaded file publicly viewable
   */
  static async makeFilePublic(fileId) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?key=${this.API_KEY}`,
        {
          method: 'POST',
          headers: {
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
   * Main upload method with comprehensive error handling
   */
  static async uploadImage(imageUri, studentSNumber, eventName) {
    try {
      console.log('🚀 Starting upload process...');
      console.log('Platform:', Platform.OS);
      console.log('Parameters:', { studentSNumber, eventName });
      
      // Validate inputs
      if (!imageUri) {
        throw new Error('Image URI is required');
      }
      
      if (!studentSNumber) {
        throw new Error('Student S-Number is required');
      }
      
      if (!eventName) {
        throw new Error('Event name is required');
      }
      
      // Try main upload method
      return await this.uploadWithApiKey(imageUri, eventName, studentSNumber);
      
    } catch (error) {
      console.error('Google Drive upload failed, using fallback:', error);
      
      // Create detailed fallback data
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
        errorType: error.name,
        failedAt: new Date().toISOString(),
        retryable: !error.message.includes('configuration') && !error.message.includes('API key')
      };
    }
  }

  /**
   * Test connection with detailed diagnostics
   */
  static async testConnection() {
    try {
      console.log('🧪 Testing Google Drive connection...');
      console.log('Platform:', Platform.OS);
      
      // Test configuration
      try {
        this.validateConfig();
      } catch (configError) {
        return { 
          success: false, 
          error: `Configuration error: ${configError.message}`,
          diagnostic: 'check_environment_variables'
        };
      }
      
      console.log('API Key available:', !!this.API_KEY);
      console.log('Folder ID:', this.FOLDER_ID);
      
      // Test API access by getting folder info
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
          folderId: folderInfo.id,
          platform: Platform.OS,
          apiKeyValid: true,
          folderAccessible: true
        };
      } else {
        const errorText = await response.text();
        console.error('❌ Google Drive connection failed:', errorText);
        
        let diagnostic = 'unknown_error';
        if (response.status === 403) {
          diagnostic = 'api_key_invalid_or_restricted';
        } else if (response.status === 404) {
          diagnostic = 'folder_not_found_or_no_access';
        }
        
        return { 
          success: false, 
          error: `Connection failed: ${response.status} ${errorText}`,
          diagnostic: diagnostic,
          httpStatus: response.status
        };
      }
    } catch (error) {
      console.error('❌ Connection test error:', error);
      return { 
        success: false, 
        error: error.message,
        diagnostic: 'network_or_configuration_error'
      };
    }
  }

  /**
   * Retry failed upload
   */
  static async retryUpload(failedUploadData) {
    try {
      if (!failedUploadData.retryable) {
        throw new Error('Upload is not retryable due to configuration issues');
      }
      
      console.log('🔄 Retrying failed upload...');
      
      return await this.uploadImage(
        failedUploadData.localUri,
        failedUploadData.studentSNumber,
        failedUploadData.eventName
      );
    } catch (error) {
      console.error('❌ Retry upload failed:', error);
      throw error;
    }
  }

  /**
   * Get upload statistics and quota info
   */
  static async getUploadStats() {
    try {
      // This would require additional API calls to get quota information
      // For now, return basic connection status
      const connection = await this.testConnection();
      
      return {
        connectionStatus: connection.success,
        platform: Platform.OS,
        configValid: connection.success,
        lastTested: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting upload stats:', error);
      return {
        connectionStatus: false,
        error: error.message,
        lastTested: new Date().toISOString()
      };
    }
  }
}

export default SimpleDriveService;