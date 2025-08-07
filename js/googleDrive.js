// Google Drive Service for Web Application
// Handles OAuth authentication and file uploads to Google Drive

const GoogleDrive = {
    // OAuth state
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,

    // Initialize Google Drive service
    init: function() {
        console.log('🔐 Initializing Google Drive service...');
        
        // Check for stored tokens
        const storedTokens = Utils.storage.get('google_drive_tokens');
        if (storedTokens) {
            this.accessToken = storedTokens.accessToken;
            this.refreshToken = storedTokens.refreshToken;
            this.isAuthenticated = true;
            console.log('✅ Google Drive tokens restored from storage');
        }
    },

    // Start OAuth flow
    authenticate: function() {
        return new Promise((resolve, reject) => {
            try {
                console.log('🔐 Starting Google Drive OAuth...');
                
                // Create OAuth URL
                const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
                    `client_id=${CONFIG.GOOGLE_CLIENT_ID}&` +
                    `redirect_uri=${encodeURIComponent(window.location.origin + '/auth/callback.html')}&` +
                    `scope=${encodeURIComponent('https://www.googleapis.com/auth/drive.file')}&` +
                    `response_type=code&` +
                    `access_type=offline&` +
                    `prompt=consent&` +
                    `state=${this.generateState()}`;

                // Store state for verification
                Utils.storage.set('google_oauth_state', this.generateState());
                
                // Open OAuth popup
                const popup = window.open(
                    authUrl,
                    'google_oauth',
                    'width=500,height=600,scrollbars=yes,resizable=yes'
                );

                // Listen for OAuth callback
                const checkClosed = setInterval(() => {
                    if (popup.closed) {
                        clearInterval(checkClosed);
                        this.checkAuthResult().then(resolve).catch(reject);
                    }
                }, 1000);

            } catch (error) {
                console.error('❌ OAuth initialization failed:', error);
                reject(error);
            }
        });
    },

    // Handle OAuth callback
    handleCallback: async function(authCode, state) {
        try {
            console.log('🔄 Exchanging auth code for tokens...');
            
            // Verify state
            const storedState = Utils.storage.get('google_oauth_state');
            if (state !== storedState) {
                throw new Error('Invalid OAuth state');
            }

            // Exchange code for tokens
            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: CONFIG.GOOGLE_CLIENT_ID,
                    client_secret: CONFIG.GOOGLE_CLIENT_SECRET,
                    code: authCode,
                    grant_type: 'authorization_code',
                    redirect_uri: window.location.origin + '/auth/callback.html'
                })
            });

            const tokenData = await tokenResponse.json();
            
            if (tokenData.access_token) {
                this.accessToken = tokenData.access_token;
                this.refreshToken = tokenData.refresh_token;
                this.isAuthenticated = true;
                
                // Store tokens
                Utils.storage.set('google_drive_tokens', {
                    accessToken: this.accessToken,
                    refreshToken: this.refreshToken
                });
                
                console.log('✅ Google Drive authentication successful');
                return { success: true };
            } else {
                throw new Error('Failed to get access token');
            }
        } catch (error) {
            console.error('❌ Token exchange failed:', error);
            throw error;
        }
    },

    // Upload file to Google Drive
    uploadFile: async function(file, folder = 'general', metadata = {}) {
        try {
            if (!this.isAuthenticated) {
                throw new Error('Not authenticated. Please authenticate with Google Drive first.');
            }

            console.log('📤 Uploading file to Google Drive...');
            console.log('📝 File:', file.name);
            console.log('📁 Folder:', folder);

            // Ensure access token is valid
            await this.ensureValidToken();

            // Create file metadata
            const fileMetadata = {
                name: `${folder}/${Date.now()}_${file.name}`,
                parents: [CONFIG.GOOGLE_DRIVE_FOLDER_ID],
                description: `Uploaded via Key Club Hub\n${metadata.description || ''}\nUploaded: ${new Date().toISOString()}`
            };

            // Convert file to base64
            const base64Data = await this.fileToBase64(file);

            // Create multipart request
            const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";

            const multipartRequestBody =
                delimiter +
                'Content-Type: application/json\r\n\r\n' +
                JSON.stringify(fileMetadata) +
                delimiter +
                `Content-Type: ${file.type}\r\n` +
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
                    webViewLink: result.webViewLink,
                    downloadUrl: `https://drive.google.com/uc?id=${result.id}`,
                    filename: result.name
                };
            } else {
                const errorText = await uploadResponse.text();
                throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
            }

        } catch (error) {
            console.error('❌ File upload failed:', error);
            throw error;
        }
    },

    // Refresh access token if needed
    refreshAccessToken: async function() {
        try {
            if (!this.refreshToken) {
                throw new Error('No refresh token available');
            }

            console.log('🔄 Refreshing access token...');

            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: CONFIG.GOOGLE_CLIENT_ID,
                    client_secret: CONFIG.GOOGLE_CLIENT_SECRET,
                    refresh_token: this.refreshToken,
                    grant_type: 'refresh_token'
                })
            });

            const tokenData = await response.json();
            
            if (tokenData.access_token) {
                this.accessToken = tokenData.access_token;
                
                // Update stored tokens
                Utils.storage.set('google_drive_tokens', {
                    accessToken: this.accessToken,
                    refreshToken: this.refreshToken
                });
                
                console.log('✅ Access token refreshed');
                return true;
            } else {
                throw new Error('Failed to refresh access token');
            }
        } catch (error) {
            console.error('❌ Token refresh failed:', error);
            return false;
        }
    },

    // Ensure access token is valid
    ensureValidToken: async function() {
        if (!this.accessToken) {
            throw new Error('No access token available');
        }

        // Try to use the token, if it fails, refresh it
        try {
            const testResponse = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!testResponse.ok) {
                await this.refreshAccessToken();
            }
        } catch (error) {
            await this.refreshAccessToken();
        }
    },

    // Convert file to base64
    fileToBase64: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    },

    // Generate random state for OAuth
    generateState: function() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    },

    // Check authentication result
    checkAuthResult: async function() {
        // This would be called after OAuth popup closes
        // In a real implementation, you might use postMessage or check localStorage
        return new Promise((resolve) => {
            setTimeout(() => {
                if (this.isAuthenticated) {
                    resolve({ success: true });
                } else {
                    resolve({ success: false, error: 'Authentication failed' });
                }
            }, 1000);
        });
    },

    // Get authentication status
    getAuthStatus: function() {
        return {
            isAuthenticated: this.isAuthenticated,
            hasRefreshToken: !!this.refreshToken
        };
    },

    // Logout
    logout: function() {
        this.accessToken = null;
        this.refreshToken = null;
        this.isAuthenticated = false;
        
        // Clear stored tokens
        Utils.storage.remove('google_drive_tokens');
        Utils.storage.remove('google_oauth_state');
        
        console.log('🚪 Google Drive logged out');
    },

    // Initialize when module loads
    initialize: function() {
        this.init();
    }
};

// Initialize Google Drive service
GoogleDrive.initialize();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoogleDrive;
} else {
    window.GoogleDrive = GoogleDrive;
} 