// Authentication module for Key Club Hub Web App

const Auth = {
    // Current user state
    currentUser: null,
    isAuthenticated: false,
    isAdmin: false,
    loading: true,

    // Initialize authentication
    init: async function() {
        try {
            console.log('🔐 Initializing authentication...');
            
            // Check for stored user data
            const storedUser = Utils.storage.get(CONFIG.STORAGE_KEYS.USER);
            
            if (storedUser) {
                console.log('👤 Found stored user:', storedUser);
                
                // Validate stored user data
                if (this.validateStoredUser(storedUser)) {
                    this.currentUser = storedUser;
                    this.isAuthenticated = true;
                    this.isAdmin = storedUser.sNumber === 'admin' || storedUser.role === 'admin';
                    
                    console.log('✅ User session restored');
                } else {
                    console.log('❌ Invalid stored user data, clearing...');
                    this.clearAuth();
                }
            } else {
                console.log('ℹ️ No stored user found');
            }
        } catch (error) {
            console.error('❌ Error initializing auth:', error);
            this.clearAuth();
        } finally {
            this.loading = false;
        }
    },

    // Validate stored user data
    validateStoredUser: function(user) {
        if (!user) return false;
        
        // Check if user has required fields
        if (!user.sNumber && !user.role) return false;
        
        // Check if admin user
        if (user.sNumber === 'admin' || user.role === 'admin') return true;
        
        // Check if student user has valid S-number
        if (user.sNumber && user.sNumber.startsWith('s')) return true;
        
        return false;
    },

    // Student login
    loginStudent: async function(sNumber, password) {
        try {
            console.log('🔐 Attempting student login:', sNumber);
            
            // Call real Supabase API
            const result = await API.auth.studentLogin(sNumber, password);
            
            if (result.error) {
                throw new Error(result.error.message || 'Login failed');
            }
            
            const user = result;
            
            // Store user data
            this.setCurrentUser(user);
            
            console.log('✅ Student login successful');
            return { success: true, user };
            
        } catch (error) {
            console.error('❌ Student login error:', error);
            throw error;
        }
    },

    // Admin login
    loginAdmin: async function(email, password) {
        try {
            console.log('🔐 Attempting admin login:', email);
            
            // Call real Supabase API
            const user = await API.auth.adminLogin(email, password);
            
            // Store user data
            this.setCurrentUser(user);
            
            console.log('✅ Admin login successful');
            return { success: true, user };
            
        } catch (error) {
            console.error('❌ Admin login error:', error);
            throw error;
        }
    },

    // Student registration
    registerStudent: async function(sNumber, password, name) {
        try {
            console.log('📝 Attempting student registration:', sNumber);
            
            // Validate inputs
            if (!Utils.validation.isValidSNumber(sNumber)) {
                throw new Error(CONFIG.ERROR_MESSAGES.INVALID_S_NUMBER);
            }
            
            if (!Utils.validation.isValidPassword(password)) {
                throw new Error(CONFIG.ERROR_MESSAGES.PASSWORD_TOO_SHORT);
            }
            
            if (!Utils.validation.isValidName(name)) {
                throw new Error(CONFIG.ERROR_MESSAGES.VALIDATION_ERROR);
            }
            
            // Call real Supabase API
            const user = await API.auth.registerStudent({
                sNumber: sNumber.toLowerCase(),
                password: password,
                name: name,
                email: `${sNumber}@student.edu` // Generate email from S-number
            });
            
            console.log('✅ Student registration successful');
            return { success: true, user };
            
        } catch (error) {
            console.error('❌ Student registration error:', error);
            throw error;
        }
    },

    // Reset password
    resetPassword: async function(sNumber, newPassword) {
        try {
            console.log('🔑 Attempting password reset:', sNumber);
            
            // Validate inputs
            if (!Utils.validation.isValidSNumber(sNumber)) {
                throw new Error(CONFIG.ERROR_MESSAGES.INVALID_S_NUMBER);
            }
            
            if (!Utils.validation.isValidPassword(newPassword)) {
                throw new Error(CONFIG.ERROR_MESSAGES.PASSWORD_TOO_SHORT);
            }
            
            // For demo purposes, we'll simulate a successful password reset
            // In a real app, this would call your Supabase API
            console.log('✅ Password reset successful');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Password reset error:', error);
            throw error;
        }
    },

    // Set current user
    setCurrentUser: function(user) {
        this.currentUser = user;
        this.isAuthenticated = true;
        this.isAdmin = user.sNumber === 'admin' || user.role === 'admin';
        
        // Store in localStorage
        Utils.storage.set(CONFIG.STORAGE_KEYS.USER, user);
        
        // Update UI
        this.updateUI();
    },

    // Get current user
    getCurrentUser: function() {
        return this.currentUser;
    },

    // Check if user is authenticated
    isUserAuthenticated: function() {
        return this.isAuthenticated;
    },

    // Check if user is admin
    isUserAdmin: function() {
        return this.isAdmin;
    },

    // Logout
    logout: async function() {
        try {
            console.log('🚪 Logging out user');
            
            this.clearAuth();
            
            // Show success message
            UI.showToast(CONFIG.SUCCESS_MESSAGES.LOGOUT_SUCCESS, 'success');
            
            console.log('✅ Logout successful');
            return true;
            
        } catch (error) {
            console.error('❌ Logout error:', error);
            // Still clear auth even if there's an error
            this.clearAuth();
            return false;
        }
    },

    // Clear authentication data
    clearAuth: function() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.isAdmin = false;
        
        // Clear from localStorage
        Utils.storage.remove(CONFIG.STORAGE_KEYS.USER);
        Utils.storage.remove(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        
        // Update UI
        this.updateUI();
    },

    // Update UI based on authentication state
    updateUI: function() {
        const authContainer = document.getElementById('authContainer');
        const mainApp = document.getElementById('mainApp');
        const userName = document.getElementById('userName');
        const userRole = document.getElementById('userRole');
        const welcomeMessage = document.getElementById('welcomeMessage');
        const homeSubtitle = document.getElementById('homeSubtitle');
        const hoursCard = document.getElementById('hoursCard');
        const adminCard = document.getElementById('adminCard');
        
        if (this.isAuthenticated) {
            // Show main app
            Utils.dom.hideElement(authContainer);
            Utils.dom.showElement(mainApp);
            
            // Update user info
            if (userName) {
                userName.textContent = this.currentUser.name || this.currentUser.sNumber;
            }
            
            if (userRole) {
                userRole.textContent = this.isAdmin ? 'Administrator' : 'Student';
            }
            
            if (welcomeMessage) {
                welcomeMessage.textContent = `Welcome, ${this.currentUser.name || this.currentUser.sNumber}`;
            }
            
            if (homeSubtitle) {
                homeSubtitle.textContent = this.isAdmin 
                    ? 'Manage events and oversee club activities' 
                    : 'Track events, hours, and stay connected';
            }
            
            // Show appropriate cards
            if (this.isAdmin) {
                Utils.dom.hideElement(hoursCard);
                Utils.dom.showElement(adminCard);
            } else {
                Utils.dom.showElement(hoursCard);
                Utils.dom.hideElement(adminCard);
            }
            
            // Update menu
            this.updateMenu();
            
        } else {
            // Show auth container
            Utils.dom.showElement(authContainer);
            Utils.dom.hideElement(mainApp);
            
            // Reset to landing screen
            showScreen('landingScreen');
        }
    },

    // Update menu based on user role
    updateMenu: function() {
        const menuItems = document.getElementById('menuItems');
        if (!menuItems) return;
        
        const menuConfig = this.isAdmin ? CONFIG.MENU_ITEMS.ADMIN : CONFIG.MENU_ITEMS.STUDENT;
        
        menuItems.innerHTML = menuConfig.map(item => `
            <li>
                <a href="#" class="menu-item" data-route="${item.route}">
                    <i class="${item.icon}"></i>
                    <span>${item.title}</span>
                </a>
            </li>
        `).join('');
        
        // Add event listeners to menu items
        const menuItemElements = menuItems.querySelectorAll('.menu-item');
        menuItemElements.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const route = item.dataset.route;
                navigateTo(route);
                
                // Close sidebar on mobile
                const sidebar = document.getElementById('sidebar');
                if (sidebar && window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                }
            });
        });
    },

    // Get user hours (for students)
    getUserHours: async function() {
        if (!this.isAuthenticated || this.isAdmin) return 0;
        
        try {
            // Get real user data from Supabase using sNumber
            const user = await API.students.getById(this.currentUser.sNumber);
            return user ? (user.total_hours || 0) : 0;
        } catch (error) {
            console.error('❌ Error getting user hours:', error);
            return 0;
        }
    },

    // Update user hours
    updateUserHours: async function(hours) {
        if (!this.isAuthenticated || this.isAdmin) return false;
        
        try {
            // For demo purposes, just update the current user object
            // In a real app, this would update your database
            this.currentUser.totalHours = hours;
            Utils.storage.set(CONFIG.STORAGE_KEYS.USER, this.currentUser);
            
            return true;
        } catch (error) {
            console.error('❌ Error updating user hours:', error);
            return false;
        }
    },

    // Check if user can access a specific route
    canAccessRoute: function(route) {
        if (!this.isAuthenticated) return false;
        
        // Admin can access all routes
        if (this.isAdmin) return true;
        
        // Student route restrictions
        const adminOnlyRoutes = [
            'adminHourManagement',
            'adminMeetingManagement',
            'adminStudentManagement'
        ];
        
        return !adminOnlyRoutes.includes(route);
    },

    // Refresh user data
    refreshUserData: async function() {
        if (!this.isAuthenticated) return;
        
        try {
            // For demo purposes, we'll just update the UI
            // In a real app, this would fetch fresh data from your database
            this.updateUI();
        } catch (error) {
            console.error('❌ Error refreshing user data:', error);
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Auth;
} else {
    window.Auth = Auth;
} 