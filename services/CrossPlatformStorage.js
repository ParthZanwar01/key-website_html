// services/CrossPlatformStorage.js
// Universal storage solution that works on all platforms

import { Platform } from 'react-native-web';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Conditionally import SecureStore only on native platforms
let SecureStore = null;
if (Platform.OS !== 'web') {
  try {
    SecureStore = require('expo-secure-store');
  } catch (error) {
    console.warn('expo-secure-store not available:', error);
  }
}

class CrossPlatformStorage {
  
  /**
   * Store data securely (uses SecureStore on mobile, AsyncStorage on web)
   */
  static async setItem(key, value) {
    try {
      if (Platform.OS === 'web' || !SecureStore) {
        // Web or SecureStore not available - use AsyncStorage
        console.log('📱 Using AsyncStorage for:', key);
        await AsyncStorage.setItem(key, value);
      } else {
        // Native platform with SecureStore available
        console.log('🔐 Using SecureStore for:', key);
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error('❌ Failed to store item:', key, error);
      throw error;
    }
  }

  /**
   * Retrieve data securely
   */
  static async getItem(key) {
    try {
      if (Platform.OS === 'web' || !SecureStore) {
        // Web or SecureStore not available - use AsyncStorage
        console.log('📱 Reading from AsyncStorage:', key);
        return await AsyncStorage.getItem(key);
      } else {
        // Native platform with SecureStore available
        console.log('🔐 Reading from SecureStore:', key);
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.error('❌ Failed to retrieve item:', key, error);
      return null;
    }
  }

  /**
   * Remove data securely
   */
  static async removeItem(key) {
    try {
      if (Platform.OS === 'web' || !SecureStore) {
        // Web or SecureStore not available - use AsyncStorage
        console.log('📱 Removing from AsyncStorage:', key);
        await AsyncStorage.removeItem(key);
      } else {
        // Native platform with SecureStore available
        console.log('🔐 Removing from SecureStore:', key);
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error('❌ Failed to remove item:', key, error);
      throw error;
    }
  }

  /**
   * Check if an item exists
   */
  static async hasItem(key) {
    try {
      const value = await this.getItem(key);
      return value !== null;
    } catch (error) {
      console.error('❌ Failed to check item existence:', key, error);
      return false;
    }
  }

  /**
   * Store object as JSON
   */
  static async setObject(key, object) {
    try {
      const jsonString = JSON.stringify(object);
      await this.setItem(key, jsonString);
    } catch (error) {
      console.error('❌ Failed to store object:', key, error);
      throw error;
    }
  }

  /**
   * Retrieve object from JSON
   */
  static async getObject(key) {
    try {
      const jsonString = await this.getItem(key);
      if (!jsonString) {
        return null;
      }
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('❌ Failed to retrieve object:', key, error);
      return null;
    }
  }

  /**
   * Get storage type being used
   */
  static getStorageType() {
    if (Platform.OS === 'web' || !SecureStore) {
      return 'AsyncStorage';
    } else {
      return 'SecureStore';
    }
  }

  /**
   * Clear all stored data (use with caution!)
   */
  static async clearAll() {
    try {
      console.log('🧹 Clearing all stored data...');
      
      if (Platform.OS === 'web' || !SecureStore) {
        // Clear AsyncStorage
        await AsyncStorage.clear();
      } else {
        // For SecureStore, we need to remove items individually
        // This is a simplified version - in practice you'd track your keys
        const keys = [
          'google_drive_access_token',
          'google_drive_refresh_token', 
          'google_drive_token_expiry',
          'google_drive_user_info'
        ];
        
        for (const key of keys) {
          try {
            await SecureStore.deleteItemAsync(key);
          } catch (error) {
            // Ignore errors for non-existent keys
            console.log('Key not found:', key);
          }
        }
      }
      
      console.log('✅ All data cleared');
    } catch (error) {
      console.error('❌ Failed to clear data:', error);
      throw error;
    }
  }

  /**
   * Get storage information
   */
  static async getStorageInfo() {
    try {
      const storageType = this.getStorageType();
      const platform = Platform.OS;
      
      let hasSecureStore = false;
      let hasAsyncStorage = false;
      
      try {
        await AsyncStorage.getItem('test');
        hasAsyncStorage = true;
      } catch (error) {
        console.warn('AsyncStorage not available');
      }
      
      if (SecureStore) {
        try {
          await SecureStore.getItemAsync('test');
          hasSecureStore = true;
        } catch (error) {
          console.warn('SecureStore not available');
        }
      }
      
      return {
        platform: platform,
        storageType: storageType,
        hasSecureStore: hasSecureStore,
        hasAsyncStorage: hasAsyncStorage,
        isSecure: storageType === 'SecureStore'
      };
    } catch (error) {
      console.error('❌ Failed to get storage info:', error);
      return {
        platform: Platform.OS,
        storageType: 'unknown',
        hasSecureStore: false,
        hasAsyncStorage: false,
        isSecure: false,
        error: error.message
      };
    }
  }

  /**
   * Test storage functionality
   */
  static async testStorage() {
    try {
      console.log('🧪 Testing storage functionality...');
      
      const testKey = 'storage_test_key';
      const testValue = 'storage_test_value';
      const testObject = { test: true, timestamp: Date.now() };
      
      // Test string storage
      await this.setItem(testKey, testValue);
      const retrievedValue = await this.getItem(testKey);
      
      if (retrievedValue !== testValue) {
        throw new Error('String storage test failed');
      }
      
      // Test object storage
      await this.setObject(testKey + '_obj', testObject);
      const retrievedObject = await this.getObject(testKey + '_obj');
      
      if (!retrievedObject || retrievedObject.test !== testObject.test) {
        throw new Error('Object storage test failed');
      }
      
      // Test removal
      await this.removeItem(testKey);
      await this.removeItem(testKey + '_obj');
      
      const removedValue = await this.getItem(testKey);
      if (removedValue !== null) {
        throw new Error('Removal test failed');
      }
      
      const storageInfo = await this.getStorageInfo();
      
      console.log('✅ Storage test passed');
      
      return {
        success: true,
        message: 'Storage functionality working correctly',
        storageInfo: storageInfo
      };
    } catch (error) {
      console.error('❌ Storage test failed:', error);
      return {
        success: false,
        error: error.message,
        storageInfo: await this.getStorageInfo()
      };
    }
  }
}

export default CrossPlatformStorage;