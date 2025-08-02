import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import GoogleOAuthService from '../services/GoogleOAuthService';
import SimpleDriveService from '../services/SimpleDriveService';
import CrossPlatformStorage from '../services/CrossPlatformStorage';

const GoogleDriveAuthTest = () => {
  const [authStatus, setAuthStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState({});

  const runDiagnostics = async () => {
    setIsLoading(true);
    const results = {};

    try {
      // Check environment variables
      results.envVars = {
        clientId: !!process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
        clientSecret: !!process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET,
        folderId: !!process.env.EXPO_PUBLIC_GOOGLE_DRIVE_FOLDER_ID
      };

      // Check storage
      results.storage = await CrossPlatformStorage.getStorageInfo();

      // Check OAuth status
      results.oauth = await GoogleOAuthService.getAuthStatus();

      // Check Drive connection
      results.drive = await SimpleDriveService.testConnection();

      // Check stored tokens
      const accessToken = await CrossPlatformStorage.getItem('google_drive_access_token');
      const refreshToken = await CrossPlatformStorage.getItem('google_drive_refresh_token');
      const tokenExpiry = await CrossPlatformStorage.getItem('google_drive_token_expiry');

      results.tokens = {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hasExpiry: !!tokenExpiry,
        isExpired: tokenExpiry ? Date.now() >= parseInt(tokenExpiry) : true
      };

      setDiagnostics(results);
    } catch (error) {
      console.error('Diagnostic error:', error);
      Alert.alert('Diagnostic Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuth = async () => {
    try {
      await GoogleOAuthService.signOut();
      await runDiagnostics();
      Alert.alert('Success', 'Authentication cleared successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear authentication: ' + error.message);
    }
  };

  const testAuth = async () => {
    try {
      setIsLoading(true);
      const result = await GoogleOAuthService.authenticate();
      
      if (result.success) {
        Alert.alert('Success', 'Authentication successful!');
        await runDiagnostics();
      } else {
        Alert.alert('Authentication Failed', result.error || 'Unknown error');
      }
    } catch (error) {
      Alert.alert('Error', 'Authentication error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const renderDiagnosticItem = (label, value, isError = false) => (
    <View style={styles.diagnosticItem}>
      <Text style={[styles.diagnosticLabel, isError && styles.errorText]}>
        {label}:
      </Text>
      <Text style={[styles.diagnosticValue, isError && styles.errorText]}>
        {typeof value === 'boolean' ? (value ? '✅' : '❌') : String(value)}
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔍 Google Drive Authentication Test</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={runDiagnostics}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Running...' : '🔄 Run Diagnostics'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.authButton]} 
          onPress={testAuth}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Authenticating...' : '🔐 Test Authentication'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={clearAuth}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>🧹 Clear Authentication</Text>
        </TouchableOpacity>
      </View>

      {Object.keys(diagnostics).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diagnostics Results</Text>
          
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Environment Variables</Text>
            {diagnostics.envVars && (
              <>
                {renderDiagnosticItem('Client ID', diagnostics.envVars.clientId)}
                {renderDiagnosticItem('Client Secret', diagnostics.envVars.clientSecret)}
                {renderDiagnosticItem('Folder ID', diagnostics.envVars.folderId)}
              </>
            )}
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Storage</Text>
            {diagnostics.storage && (
              <>
                {renderDiagnosticItem('Platform', diagnostics.storage.platform)}
                {renderDiagnosticItem('Storage Type', diagnostics.storage.storageType)}
                {renderDiagnosticItem('Secure Storage', diagnostics.storage.isSecure)}
              </>
            )}
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>OAuth Status</Text>
            {diagnostics.oauth && (
              <>
                {renderDiagnosticItem('Authenticated', diagnostics.oauth.isAuthenticated)}
                {renderDiagnosticItem('User', diagnostics.oauth.user?.email || 'None')}
              </>
            )}
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Tokens</Text>
            {diagnostics.tokens && (
              <>
                {renderDiagnosticItem('Access Token', diagnostics.tokens.hasAccessToken)}
                {renderDiagnosticItem('Refresh Token', diagnostics.tokens.hasRefreshToken)}
                {renderDiagnosticItem('Token Expired', diagnostics.tokens.isExpired)}
              </>
            )}
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Drive Connection</Text>
            {diagnostics.drive && (
              <>
                {renderDiagnosticItem('Connection', diagnostics.drive.success)}
                {diagnostics.drive.error && (
                  <Text style={styles.errorText}>Error: {diagnostics.drive.error}</Text>
                )}
                {diagnostics.drive.diagnostic && (
                  <Text style={styles.errorText}>Diagnostic: {diagnostics.drive.diagnostic}</Text>
                )}
              </>
            )}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Troubleshooting</Text>
        <Text style={styles.helpText}>
          • If authentication fails, try clearing authentication and starting fresh{'\n'}
          • Make sure popups are allowed for this site{'\n'}
          • Check that your Google Cloud Console OAuth2 credentials are correct{'\n'}
          • Ensure the Google Drive API is enabled in your Google Cloud project{'\n'}
          • Verify redirect URIs include your domain
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  subsection: {
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#555',
  },
  button: {
    backgroundColor: '#4285F4',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  authButton: {
    backgroundColor: '#34A853',
  },
  clearButton: {
    backgroundColor: '#EA4335',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  diagnosticItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  diagnosticLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  diagnosticValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  errorText: {
    color: '#EA4335',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default GoogleDriveAuthTest; 