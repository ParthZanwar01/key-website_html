// Main application module for Key Club Hub Web App

const App = {
    // Application state
    isInitialized: false,
    currentUser: null,

    // Initialize the application
    init: async function() {
        try {
            console.log('🚀 Initializing Key Club Hub...');
            
            // Show loading screen
            this.showLoadingScreen();
            
            // Initialize modules
            await this.initializeModules();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize authentication
            await Auth.init();
            
            // Hide loading screen and show appropriate content
            this.hideLoadingScreen();
            
            // Show splash screen if first time
            if (!Utils.storage.get('app_initialized')) {
                this.showSplashScreen();
            } else {
                this.showMainContent();
            }
            
            this.isInitialized = true;
            console.log('✅ Key Club Hub initialized successfully');
            
        } catch (error) {
            console.error('❌ Error initializing app:', error);
            this.showErrorScreen();
        }
    },

    // Initialize all modules
    initializeModules: async function() {
        // Initialize navigation
        Navigation.init();
        
        // Set up network listeners
        this.setupNetworkListeners();
        
        // Set up form handlers
        this.setupFormHandlers();
    },

    // Set up event listeners
    setupEventListeners: function() {
        // Handle window resize
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleResize();
        }, 250));

        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // Handle beforeunload
        window.addEventListener('beforeunload', () => {
            this.handleBeforeUnload();
        });

        // Handle Google Drive OAuth callbacks
        window.addEventListener('message', (event) => {
            if (event.origin !== window.location.origin) return;
            
            if (event.data.type === 'GOOGLE_OAUTH_CALLBACK') {
                this.handleGoogleOAuthCallback(event.data);
            }
        });
    },

    // Set up network listeners
    setupNetworkListeners: function() {
        Utils.network.addOnlineListener(() => {
            UI.showToast('Connection restored', 'success');
        });

        Utils.network.addOfflineListener(() => {
            UI.showToast('Connection lost', 'warning');
        });
    },

    // Set up form handlers
    setupFormHandlers: function() {
        // Student login form
        const studentLoginForm = document.getElementById('studentLoginForm');
        if (studentLoginForm) {
            studentLoginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleStudentLogin();
            });
        }

        // Admin login form
        const adminLoginForm = document.getElementById('adminLoginForm');
        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleAdminLogin();
            });
        }

        // Student registration form
        const studentRegistrationForm = document.getElementById('studentRegistrationForm');
        if (studentRegistrationForm) {
            studentRegistrationForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleStudentRegistration();
            });
        }

        // Forgot password form
        const forgotPasswordForm = document.getElementById('forgotPasswordForm');
        if (forgotPasswordForm) {
            forgotPasswordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handlePasswordReset();
            });
        }

                            // Event creation form
                    const eventCreationForm = document.getElementById('eventCreationForm');
                    if (eventCreationForm) {
                        eventCreationForm.addEventListener('submit', async (e) => {
                            e.preventDefault();
                            await this.handleEventCreation();
                        });
                    }

                    // Attendance code form
                    const attendanceCodeForm = document.getElementById('attendanceCodeForm');
                    if (attendanceCodeForm) {
                        attendanceCodeForm.addEventListener('submit', async (e) => {
                            e.preventDefault();
                            await window.submitAttendanceCode();
                        });
                    }

                    // Create announcement form
                    const createAnnouncementForm = document.getElementById('createAnnouncementForm');
                    if (createAnnouncementForm) {
                        createAnnouncementForm.addEventListener('submit', async (e) => {
                            e.preventDefault();
                            await window.submitAnnouncement();
                        });
                    }
    },

    // Handle student login
    handleStudentLogin: async function() {
        const form = document.getElementById('studentLoginForm');
        if (!form) {
            console.error('Student login form not found');
            return;
        }

        try {
            const formData = new FormData(form);
            const sNumber = formData.get('sNumber');
            const password = formData.get('password');

            if (!sNumber || !password) {
                UI.showToast('Please fill in all fields', 'error');
                return;
            }

            const result = await Auth.loginStudent(sNumber, password);
            
            if (result.success) {
                UI.showToast('Login successful!', 'success');
                Navigation.navigateTo('home');
                form.reset();
            }
        } catch (error) {
            console.error('❌ Student login error:', error);
            UI.showToast(error.message || 'Login failed', 'error');
        }
    },

    // Handle admin login
    handleAdminLogin: async function() {
        try {
            const form = document.getElementById('adminLoginForm');
            const formData = new FormData(form);
            
            const email = formData.get('email');
            const password = formData.get('password');

            // Validate inputs
            if (!Utils.validation.isValidEmail(email)) {
                UI.showToast(CONFIG.ERROR_MESSAGES.EMAIL_INVALID, 'error');
                return;
            }

            if (!Utils.validation.isValidPassword(password)) {
                UI.showToast(CONFIG.ERROR_MESSAGES.PASSWORD_TOO_SHORT, 'error');
                return;
            }

            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
            submitBtn.disabled = true;

            // Attempt login
            const result = await Auth.loginAdmin(email, password);
            
            if (result.success) {
                UI.showToast(CONFIG.SUCCESS_MESSAGES.LOGIN_SUCCESS, 'success');
                
                // Navigate to home
                setTimeout(() => {
                    Navigation.navigateTo('home');
                }, 1000);
            }

        } catch (error) {
            console.error('❌ Admin login error:', error);
            UI.showToast(error.message || CONFIG.ERROR_MESSAGES.INVALID_CREDENTIALS, 'error');
        } finally {
            // Reset button state
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login as Admin';
            submitBtn.disabled = false;
        }
    },

    // Handle student registration
    handleStudentRegistration: async function() {
        try {
            const form = document.getElementById('studentRegistrationForm');
            const formData = new FormData(form);
            
            const sNumber = formData.get('sNumber');
            const name = formData.get('name');
            const password = formData.get('password');
            const confirmPassword = formData.get('confirmPassword');

            // Validate inputs
            if (!Utils.validation.isValidSNumber(sNumber)) {
                UI.showToast(CONFIG.ERROR_MESSAGES.INVALID_S_NUMBER, 'error');
                return;
            }

            if (!Utils.validation.isValidName(name)) {
                UI.showToast(CONFIG.ERROR_MESSAGES.VALIDATION_ERROR, 'error');
                return;
            }

            if (!Utils.validation.isValidPassword(password)) {
                UI.showToast(CONFIG.ERROR_MESSAGES.PASSWORD_TOO_SHORT, 'error');
                return;
            }

            if (password !== confirmPassword) {
                UI.showToast(CONFIG.ERROR_MESSAGES.PASSWORDS_DONT_MATCH, 'error');
                return;
            }

            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
            submitBtn.disabled = true;

            // Attempt registration
            const result = await Auth.registerStudent(sNumber, password, name);
            
            if (result.success) {
                UI.showToast(CONFIG.SUCCESS_MESSAGES.REGISTRATION_SUCCESS, 'success');
                
                // Navigate to student login
                setTimeout(() => {
                    Navigation.showScreen('studentLoginScreen');
                }, 2000);
            }

        } catch (error) {
            console.error('❌ Student registration error:', error);
            UI.showToast(error.message || 'Registration failed', 'error');
        } finally {
            // Reset button state
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
            submitBtn.disabled = false;
        }
    },

    // Handle password reset
    handlePasswordReset: async function() {
        try {
            const form = document.getElementById('forgotPasswordForm');
            const formData = new FormData(form);
            
            const sNumber = formData.get('sNumber');
            const newPassword = formData.get('newPassword');
            const confirmNewPassword = formData.get('confirmNewPassword');

            // Validate inputs
            if (!Utils.validation.isValidSNumber(sNumber)) {
                UI.showToast(CONFIG.ERROR_MESSAGES.INVALID_S_NUMBER, 'error');
                return;
            }

            if (!Utils.validation.isValidPassword(newPassword)) {
                UI.showToast(CONFIG.ERROR_MESSAGES.PASSWORD_TOO_SHORT, 'error');
                return;
            }

            if (newPassword !== confirmNewPassword) {
                UI.showToast(CONFIG.ERROR_MESSAGES.PASSWORDS_DONT_MATCH, 'error');
                return;
            }

            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting Password...';
            submitBtn.disabled = true;

            // Attempt password reset
            const result = await Auth.resetPassword(sNumber, newPassword);
            
            if (result.success) {
                UI.showToast(CONFIG.SUCCESS_MESSAGES.PASSWORD_RESET, 'success');
                
                // Navigate to student login
                setTimeout(() => {
                    Navigation.showScreen('studentLoginScreen');
                }, 2000);
            }

        } catch (error) {
            console.error('❌ Password reset error:', error);
            UI.showToast(error.message || 'Password reset failed', 'error');
        } finally {
            // Reset button state
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-key"></i> Reset Password';
            submitBtn.disabled = false;
        }
    },

    // Handle event creation
    handleEventCreation: async function() {
        try {
            const form = document.getElementById('eventCreationForm');
            const formData = new FormData(form);
            
            const eventData = {
                title: formData.get('title'),
                description: formData.get('description'),
                date: formData.get('date'),
                time: formData.get('time'),
                location: formData.get('location'),
                capacity: parseInt(formData.get('capacity')),
                color: CONFIG.EVENT_COLORS[Math.floor(Math.random() * CONFIG.EVENT_COLORS.length)]
            };

            // Validate inputs
            const validation = Utils.validation.validateForm(eventData, {
                title: { required: true, minLength: 3 },
                description: { required: true, minLength: 10 },
                date: { required: true },
                time: { required: true },
                location: { required: true, minLength: 3 },
                capacity: { required: true, custom: (value) => {
                    if (value <= 0) return 'Capacity must be greater than 0';
                    if (value > 1000) return 'Capacity cannot exceed 1000';
                    return null;
                }}
            });

            if (!validation.isValid) {
                const firstError = Object.values(validation.errors)[0];
                UI.showToast(firstError, 'error');
                return;
            }

            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Event...';
            submitBtn.disabled = true;

            // Create event
            await API.events.create(eventData);
            
            UI.showToast(CONFIG.SUCCESS_MESSAGES.EVENT_CREATED, 'success');
            
            // Navigate back to calendar
            setTimeout(() => {
                Navigation.navigateTo('calendar');
            }, 1000);

        } catch (error) {
            console.error('❌ Event creation error:', error);
            UI.showToast('Error creating event', 'error');
        } finally {
            // Reset button state
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Create Event';
            submitBtn.disabled = false;
        }
    },

    // Show loading screen
    showLoadingScreen: function() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            Utils.dom.showElement(loadingScreen);
        }
    },

    // Hide loading screen
    hideLoadingScreen: function() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            Utils.dom.hideElement(loadingScreen);
        }
    },

    // Show splash screen
    showSplashScreen: function() {
        const splashScreen = document.getElementById('splashScreen');
        if (splashScreen) {
            Utils.dom.showElement(splashScreen);
            
            // Hide splash screen after duration
            setTimeout(() => {
                Utils.dom.hideElement(splashScreen);
                this.showMainContent();
                
                // Mark app as initialized
                Utils.storage.set('app_initialized', true);
            }, CONFIG.SPLASH_DURATION);
        }
    },

    // Show main content
    showMainContent: function() {
        if (Auth.isAuthenticated) {
            // Show main app
            const mainApp = document.getElementById('mainApp');
            if (mainApp) {
                Utils.dom.showElement(mainApp);
            }
        } else {
            // Show auth container
            const authContainer = document.getElementById('authContainer');
            if (authContainer) {
                Utils.dom.showElement(authContainer);
            }
        }
    },

    // Show error screen
    showErrorScreen: function() {
        this.hideLoadingScreen();
        
        const errorContent = `
            <div class="error-screen">
                <i class="fas fa-exclamation-triangle"></i>
                <h2>Something went wrong</h2>
                <p>We encountered an error while loading the application. Please refresh the page and try again.</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="fas fa-redo"></i>
                    Refresh Page
                </button>
            </div>
        `;
        
        document.body.innerHTML = errorContent;
    },

    // Handle window resize
    handleResize: function() {
        // Close sidebar on mobile when screen gets larger
        if (window.innerWidth > 768) {
            Navigation.closeSidebar();
        }
    },

    // Handle visibility change
    handleVisibilityChange: function() {
        if (document.hidden) {
            console.log('App hidden');
        } else {
            console.log('App visible');
            // Refresh data when app becomes visible
            if (Auth.isAuthenticated) {
                Auth.refreshUserData();
            }
        }
    },

    // Handle before unload
    handleBeforeUnload: function() {
        // Save any unsaved data
        console.log('App unloading');
    },

    // Get app version
    getVersion: function() {
        return CONFIG.APP_VERSION;
    },

    // Get app name
    getName: function() {
        return CONFIG.APP_NAME;
    },

    // Check if app is initialized
    isAppInitialized: function() {
        return this.isInitialized;
    },

    // Handle Google Drive OAuth callback
    handleGoogleOAuthCallback: async function(data) {
        try {
            console.log('🔄 Handling Google OAuth callback...');
            
            // Handle the OAuth callback
            const result = await GoogleDrive.handleCallback(data.code, data.state);
            
            if (result.success) {
                UI.showToast('Google Drive connected successfully!', 'success');
                console.log('✅ Google Drive OAuth completed successfully');
            } else {
                UI.showToast('Google Drive authentication failed', 'error');
                console.error('❌ Google Drive OAuth failed:', result.error);
            }
        } catch (error) {
            console.error('❌ Error handling Google OAuth callback:', error);
            UI.showToast('Google Drive authentication error', 'error');
        }
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { App };
} else {
    window.App = App;
} 