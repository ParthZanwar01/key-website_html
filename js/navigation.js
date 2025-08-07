// Navigation module for Key Club Hub Web App

const Navigation = {
    // Current screen state
    currentScreen: 'landingScreen',
    screenHistory: [],
    maxHistoryLength: 10,

    // Initialize navigation
    init: function() {
        console.log('🧭 Initializing navigation...');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize sidebar
        this.initSidebar();
        
        console.log('✅ Navigation initialized');
    },

    // Set up event listeners
    setupEventListeners: function() {
        // Menu toggle
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await Auth.logout();
            });
        }

        // Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            const menuToggle = document.getElementById('menuToggle');
            
            if (sidebar && sidebar.classList.contains('open') && 
                !sidebar.contains(e.target) && 
                !menuToggle.contains(e.target)) {
                this.closeSidebar();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSidebar();
                this.closeModal();
            }
        });
    },

    // Initialize sidebar
    initSidebar: function() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            // Add transition class after a small delay to prevent initial animation
            setTimeout(() => {
                sidebar.classList.add('sidebar-initialized');
            }, 100);
        }
    },

    // Toggle sidebar
    toggleSidebar: function() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content');
        if (sidebar) {
            sidebar.classList.toggle('open');
            if (mainContent) {
                mainContent.classList.toggle('sidebar-open');
            }
        }
    },

    // Open sidebar
    openSidebar: function() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content');
        if (sidebar) {
            sidebar.classList.add('open');
            if (mainContent) {
                mainContent.classList.add('sidebar-open');
            }
        }
    },

    // Close sidebar
    closeSidebar: function() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content');
        if (sidebar) {
            sidebar.classList.remove('open');
            if (mainContent) {
                mainContent.classList.remove('sidebar-open');
            }
        }
    },

    // Show screen
    showScreen: function(screenId) {
        try {
            console.log('🖥️ Showing screen:', screenId);
            
            // Hide all screens
            this.hideAllScreens();
            
            // Show target screen
            const targetScreen = document.getElementById(screenId);
            if (targetScreen) {
                targetScreen.classList.add('active');
                this.currentScreen = screenId;
                
                // Add to history
                this.addToHistory(screenId);
                
                // Update page title
                this.updatePageTitle(screenId);
                
                // Trigger screen-specific initialization
                this.initializeScreen(screenId);
                
                console.log('✅ Screen shown:', screenId);
            } else {
                console.error('❌ Screen not found:', screenId);
            }
        } catch (error) {
            console.error('❌ Error showing screen:', error);
        }
    },

    // Hide all screens
    hideAllScreens: function() {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
        });
    },

    // Add screen to history
    addToHistory: function(screenId) {
        // Don't add if it's the same as current
        if (this.screenHistory[this.screenHistory.length - 1] === screenId) {
            return;
        }
        
        this.screenHistory.push(screenId);
        
        // Keep history within limit
        if (this.screenHistory.length > this.maxHistoryLength) {
            this.screenHistory.shift();
        }
    },

    // Go back
    goBack: function() {
        if (this.screenHistory.length > 1) {
            // Remove current screen
            this.screenHistory.pop();
            
            // Show previous screen
            const previousScreen = this.screenHistory[this.screenHistory.length - 1];
            this.showScreen(previousScreen);
        } else {
            // If no history, go to home
            this.navigateTo('home');
        }
    },

    // Navigate to route
    navigateTo: function(route) {
        try {
            console.log('🧭 Navigating to route:', route);
            
            // Check if user can access this route
            if (!Auth.canAccessRoute(route)) {
                console.warn('⚠️ User cannot access route:', route);
                UI.showToast('You do not have permission to access this page.', 'error');
                return;
            }
            
            // Map route to screen
            const screenMap = {
                'home': 'homeScreen',
                'calendar': 'calendarScreen',
                'events': 'calendarScreen',
                'hourRequest': 'hourRequestScreen',
                'adminHourManagement': 'adminHourManagementScreen',
                'announcements': 'announcementsScreen',
                'officers': 'officersScreen',
                'contact': 'contactScreen',
                'publicEvents': 'publicEventsScreen',
                'studentLogin': 'studentLoginScreen',
                'adminLogin': 'adminLoginScreen',
                'studentRegistration': 'studentRegistrationScreen',
                'forgotPassword': 'forgotPasswordScreen'
            };
            
            const screenId = screenMap[route];
            if (screenId) {
                this.showScreen(screenId);
            } else {
                console.error('❌ Unknown route:', route);
            }
        } catch (error) {
            console.error('❌ Navigation error:', error);
        }
    },

    // Update page title
    updatePageTitle: function(screenId) {
        const titleMap = {
            'homeScreen': 'Home - Key Club Hub',
            'calendarScreen': 'Events - Key Club Hub',
            'hourRequestScreen': 'Request Hours - Key Club Hub',
            'adminHourManagementScreen': 'Hour Management - Key Club Hub',
            'announcementsScreen': 'Announcements - Key Club Hub',
            'officersScreen': 'Officers - Key Club Hub',
            'contactScreen': 'Contact - Key Club Hub',
            'publicEventsScreen': 'Public Events - Key Club Hub'
        };
        
        const title = titleMap[screenId] || 'Key Club Hub';
        document.title = title;
        
        // Update header title
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            const headerTitle = title.split(' - ')[0];
            pageTitle.textContent = headerTitle;
        }
    },

    // Initialize screen-specific functionality
    initializeScreen: function(screenId) {
        switch (screenId) {
            case 'homeScreen':
                this.initHomeScreen();
                break;
            case 'calendarScreen':
                this.initCalendarScreen();
                break;
            case 'hourRequestScreen':
                this.initHourRequestScreen();
                break;
            case 'adminHourManagementScreen':
                this.initAdminHourManagementScreen();
                break;
            case 'announcementsScreen':
                this.initAnnouncementsScreen();
                break;
            case 'officersScreen':
                this.initOfficersScreen();
                break;
            case 'contactScreen':
                this.initContactScreen();
                break;
            case 'publicEventsScreen':
                this.initPublicEventsScreen();
                break;
        }
    },

    // Initialize home screen
    initHomeScreen: async function() {
        try {
            // Load user hours if student
            if (Auth.isAuthenticated && !Auth.isAdmin) {
                const hours = await Auth.getUserHours();
                this.updateHoursDisplay(hours);
            }
        } catch (error) {
            console.error('❌ Error initializing home screen:', error);
        }
    },

    // Initialize calendar screen
    initCalendarScreen: async function() {
        try {
            await window.loadEvents();
        } catch (error) {
            console.error('❌ Error initializing calendar screen:', error);
        }
    },

    // Initialize hour request screen
    initHourRequestScreen: function() {
        try {
            // Set up form validation
            const form = document.getElementById('hourRequestForm');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await window.submitHourRequest();
                });
            }
        } catch (error) {
            console.error('❌ Error initializing hour request screen:', error);
        }
    },

    // Initialize admin hour management screen
    initAdminHourManagementScreen: async function() {
        try {
            await window.loadHourRequests();
        } catch (error) {
            console.error('❌ Error initializing admin hour management screen:', error);
        }
    },

    // Initialize announcements screen
    initAnnouncementsScreen: async function() {
        try {
            await window.loadAnnouncements();
        } catch (error) {
            console.error('❌ Error initializing announcements screen:', error);
        }
    },

    // Initialize officers screen
    initOfficersScreen: function() {
        try {
            window.loadOfficers();
        } catch (error) {
            console.error('❌ Error initializing officers screen:', error);
        }
    },

    // Initialize contact screen
    initContactScreen: function() {
        try {
            const form = document.getElementById('contactForm');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await window.submitContactForm();
                });
            }
        } catch (error) {
            console.error('❌ Error initializing contact screen:', error);
        }
    },

    // Initialize public events screen
    initPublicEventsScreen: async function() {
        try {
            await window.loadPublicEvents();
        } catch (error) {
            console.error('❌ Error initializing public events screen:', error);
        }
    },

    // Update hours display
    updateHoursDisplay: function(hours) {
        const hoursValue = document.getElementById('hoursValue');
        const progressPercentage = document.getElementById('progressPercentage');
        const progressHours = document.getElementById('progressHours');
        const progressCircle = document.getElementById('progressCircle');
        
        if (hoursValue) {
            hoursValue.textContent = `${hours.toFixed(1)} / ${CONFIG.TARGET_HOURS} hours`;
        }
        
        if (progressPercentage) {
            const percentage = Math.round((hours / CONFIG.TARGET_HOURS) * 100);
            progressPercentage.textContent = `${percentage}%`;
        }
        
        if (progressHours) {
            progressHours.textContent = `${hours.toFixed(1)} / ${CONFIG.TARGET_HOURS} hours`;
        }
        
        if (progressCircle) {
            const percentage = Math.min(hours / CONFIG.TARGET_HOURS, 1);
            const circumference = 2 * Math.PI * 45; // r = 45
            const offset = circumference - (percentage * circumference);
            progressCircle.style.strokeDashoffset = offset;
        }
    },

    // Show modal
    showModal: function(title, content) {
        const modalOverlay = document.getElementById('modalOverlay');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        if (modalOverlay && modalTitle && modalBody) {
            modalTitle.textContent = title;
            modalBody.innerHTML = content;
            
            Utils.dom.showElement(modalOverlay);
            
            // Focus trap for accessibility
            this.setupModalFocusTrap(modalOverlay);
        }
    },

    // Close modal
    closeModal: function() {
        const modalOverlay = document.getElementById('modalOverlay');
        if (modalOverlay) {
            Utils.dom.hideElement(modalOverlay);
        }
    },

    // Setup modal focus trap
    setupModalFocusTrap: function(modalElement) {
        const focusableElements = modalElement.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        // Focus first element
        firstElement.focus();
        
        // Handle tab key
        const handleTabKey = (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        };
        
        modalElement.addEventListener('keydown', handleTabKey);
        
        // Store handler for cleanup
        modalElement._focusTrapHandler = handleTabKey;
    },

    // Remove modal focus trap
    removeModalFocusTrap: function(modalElement) {
        if (modalElement._focusTrapHandler) {
            modalElement.removeEventListener('keydown', modalElement._focusTrapHandler);
            delete modalElement._focusTrapHandler;
        }
    },

    // Get current screen
    getCurrentScreen: function() {
        return this.currentScreen;
    },

    // Get screen history
    getScreenHistory: function() {
        return [...this.screenHistory];
    },

    // Clear screen history
    clearScreenHistory: function() {
        this.screenHistory = [];
    },

    // Check if screen is active
    isScreenActive: function(screenId) {
        return this.currentScreen === screenId;
    },

    // Refresh current screen
    refreshCurrentScreen: function() {
        this.initializeScreen(this.currentScreen);
    }
};

// Global navigation functions
window.showScreen = function(screenId) {
    Navigation.showScreen(screenId);
};

window.navigateTo = function(route) {
    Navigation.navigateTo(route);
};

window.goBack = function() {
    Navigation.goBack();
};

window.showModal = function(title, content) {
    Navigation.showModal(title, content);
};

window.closeModal = function() {
    Navigation.closeModal();
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Navigation;
} else {
    window.Navigation = Navigation;
} 