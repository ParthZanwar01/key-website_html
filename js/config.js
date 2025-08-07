// Configuration file for Key Club Hub Web App

const CONFIG = {
    // App Settings
    APP_NAME: 'Key Club Hub',
    APP_VERSION: '1.0.0',
    
    // API Configuration
    SUPABASE_URL: 'https://zvoavkzruhnzzeqyihrc.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2b2F2a3pydWhuenplcXlpaHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwMTE0OTcsImV4cCI6MjA2NDU4NzQ5N30.YOi2Cu6C7IwlNVpq3WXuhk_euHNg2n8V4BWSAwRleyM',
    
    // Google Drive Configuration
    GOOGLE_API_KEY: 'AIzaSyCcX-uLOzgPYhJMkp5JC22fhPqU359u_kY',
    GOOGLE_CLIENT_ID: '28895447434-n468oke316vaeo8hcguue7222vijorfr.apps.googleusercontent.com',
    GOOGLE_CLIENT_SECRET: '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',
    GOOGLE_DRIVE_FOLDER_ID: '17Z64oFj5nolu4sQPYAcrdv7KvKKw967l',
    
    // Default Admin Credentials (for demo purposes)
    ADMIN_EMAIL: 'admin@example.com',
    ADMIN_PASSWORD: 'password',
    
    // UI Settings
    ANIMATION_DURATION: 300,
    TOAST_DURATION: 5000,
    SPLASH_DURATION: 2000,
    
    // Hour Tracking
    TARGET_HOURS: 25,
    HOUR_REQUEST_STATUSES: {
        PENDING: 'pending',
        APPROVED: 'approved',
        REJECTED: 'rejected'
    },
    
    // Event Settings
    EVENT_COLORS: [
        '#4299e1', // Blue
        '#48bb78', // Green
        '#ed8936', // Orange
        '#9f7aea', // Purple
        '#f56565', // Red
        '#38b2ac', // Teal
        '#ed64a6', // Pink
        '#f6ad55'  // Yellow
    ],
    
    // Meeting Settings
    ATTENDANCE_CODE_LENGTH: 6,
    MEETING_TYPES: {
        MORNING: 'morning',
        AFTERNOON: 'afternoon'
    },
    
    // File Upload
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    
    // Validation Rules
    VALIDATION: {
        S_NUMBER_PATTERN: /^s\d{6}$/i,
        PASSWORD_MIN_LENGTH: 6,
        NAME_MIN_LENGTH: 2,
        EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        PHONE_PATTERN: /^\+?[\d\s\-\(\)]{10,}$/
    },
    
    // Local Storage Keys
    STORAGE_KEYS: {
        USER: 'keyclub_user',
        AUTH_TOKEN: 'keyclub_auth_token',
        THEME: 'keyclub_theme',
        LANGUAGE: 'keyclub_language',
        SETTINGS: 'keyclub_settings'
    },
    
    // Navigation
    ROUTES: {
        HOME: 'home',
        CALENDAR: 'calendar',
        EVENTS: 'events',
        HOUR_REQUEST: 'hourRequest',
        ADMIN_HOUR_MANAGEMENT: 'adminHourManagement',
        ANNOUNCEMENTS: 'announcements',
        OFFICERS: 'officers',
        CONTACT: 'contact',
        PUBLIC_EVENTS: 'publicEvents',
        STUDENT_LOGIN: 'studentLogin',
        ADMIN_LOGIN: 'adminLogin',
        STUDENT_REGISTRATION: 'studentRegistration',
        FORGOT_PASSWORD: 'forgotPassword',
        ADMIN_STUDENT_MANAGEMENT: 'adminStudentManagement',
        ADMIN_MEETING_MANAGEMENT: 'adminMeetingManagement',
        STUDENT_MEETING_ATTENDANCE: 'studentMeetingAttendance',
        STUDENT_HOUR_REQUESTS: 'studentHourRequests',
        CREATE_ANNOUNCEMENT: 'createAnnouncement',
        ATTENDEE_LIST: 'attendeeList',
        SOCIAL_MEDIA: 'socialMedia'
    },
    
    // Menu Items Configuration
    MENU_ITEMS: {
        STUDENT: [
            {
                id: 'home',
                title: 'Home',
                icon: 'fas fa-home',
                route: 'home',
                gradient: ['#4299e1', '#3182ce']
            },
            {
                id: 'calendar',
                title: 'Events',
                icon: 'fas fa-calendar',
                route: 'calendar',
                gradient: ['#38b2ac', '#319795']
            },
            {
                id: 'hourRequest',
                title: 'Request Hours',
                icon: 'fas fa-plus-circle',
                route: 'hourRequest',
                gradient: ['#ed8936', '#dd6b20']
            },
            {
                id: 'announcements',
                title: 'Announcements',
                icon: 'fas fa-bullhorn',
                route: 'announcements',
                gradient: ['#9f7aea', '#805ad5']
            },
            {
                id: 'officers',
                title: 'Officers',
                icon: 'fas fa-users',
                route: 'officers',
                gradient: ['#48bb78', '#38a169']
            },
            {
                id: 'meetingAttendance',
                title: 'Meeting Attendance',
                icon: 'fas fa-check-circle',
                route: 'studentMeetingAttendance',
                gradient: ['#f59e0b', '#d97706']
            },
            {
                id: 'myHourRequests',
                title: 'My Hour Requests',
                icon: 'fas fa-list-alt',
                route: 'studentHourRequests',
                gradient: ['#38b2ac', '#319795']
            },
            {
                id: 'socialMedia',
                title: 'Social Media',
                icon: 'fab fa-instagram',
                route: 'socialMedia',
                gradient: ['#E1306C', '#F56040']
            },
            {
                id: 'contact',
                title: 'Contact',
                icon: 'fas fa-envelope',
                route: 'contact',
                gradient: ['#4299e1', '#3182ce']
            }
        ],
        ADMIN: [
            {
                id: 'home',
                title: 'Home',
                icon: 'fas fa-home',
                route: 'home',
                gradient: ['#4299e1', '#3182ce']
            },
            {
                id: 'calendar',
                title: 'Events',
                icon: 'fas fa-calendar',
                route: 'calendar',
                gradient: ['#38b2ac', '#319795']
            },
            {
                id: 'adminHourManagement',
                title: 'Review Hours',
                icon: 'fas fa-clock',
                route: 'adminHourManagement',
                gradient: ['#ed8936', '#dd6b20']
            },
            {
                id: 'announcements',
                title: 'Announcements',
                icon: 'fas fa-bullhorn',
                route: 'announcements',
                gradient: ['#9f7aea', '#805ad5']
            },
            {
                id: 'officers',
                title: 'Officers',
                icon: 'fas fa-users',
                route: 'officers',
                gradient: ['#48bb78', '#38a169']
            },
            {
                id: 'adminMeetingManagement',
                title: 'Meeting Management',
                icon: 'fas fa-cog',
                route: 'adminMeetingManagement',
                gradient: ['#f59e0b', '#d97706']
            },
            {
                id: 'adminStudentManagement',
                title: 'Student Management',
                icon: 'fas fa-user-graduate',
                route: 'adminStudentManagement',
                gradient: ['#4299e1', '#3182ce']
            },
            {
                id: 'socialMedia',
                title: 'Social Media',
                icon: 'fab fa-instagram',
                route: 'socialMedia',
                gradient: ['#E1306C', '#F56040']
            },
            {
                id: 'contact',
                title: 'Help',
                icon: 'fas fa-question-circle',
                route: 'contact',
                gradient: ['#4299e1', '#3182ce']
            }
        ]
    },
    
    // Officers Data
    OFFICERS: [
        {
            name: 'Parth Zanwar',
            position: 'President',
            description: 'Leads the club and coordinates all activities',
            image: 'assets/images/officers/parth.png'
        },
        {
            name: 'Anabella',
            position: 'Vice President',
            description: 'Assists the president and manages events',
            image: 'assets/images/officers/anabella.png'
        },
        {
            name: 'Anika',
            position: 'Secretary',
            description: 'Manages records and communications',
            image: 'assets/images/officers/anika.png'
        },
        {
            name: 'Arjun',
            position: 'Treasurer',
            description: 'Handles financial matters and budgeting',
            image: 'assets/images/officers/arjun.png'
        },
        {
            name: 'Bella',
            position: 'Historian',
            description: 'Documents club activities and history',
            image: 'assets/images/officers/bella.png'
        },
        {
            name: 'Cody',
            position: 'Public Relations',
            description: 'Manages social media and outreach',
            image: 'assets/images/officers/cody.png'
        },
        {
            name: 'Dhruv',
            position: 'Service Project Coordinator',
            description: 'Organizes community service projects',
            image: 'assets/images/officers/dhruv.png'
        },
        {
            name: 'Gabriela',
            position: 'Membership Chair',
            description: 'Recruits and manages new members',
            image: 'assets/images/officers/gabriela.png'
        },
        {
            name: 'Gabriella',
            position: 'Event Coordinator',
            description: 'Plans and executes club events',
            image: 'assets/images/officers/gabriella.png'
        },
        {
            name: 'Gitali',
            position: 'Fundraising Chair',
            description: 'Organizes fundraising activities',
            image: 'assets/images/officers/gitali.png'
        },
        {
            name: 'Jacob',
            position: 'Technology Officer',
            description: 'Manages digital tools and platforms',
            image: 'assets/images/officers/jacob.png'
        },
        {
            name: 'Jefferson',
            position: 'Community Outreach',
            description: 'Builds relationships with community partners',
            image: 'assets/images/officers/jefferson.png'
        },
        {
            name: 'Madilyn',
            position: 'Social Media Manager',
            description: 'Manages online presence and engagement',
            image: 'assets/images/officers/madilyn.png'
        },
        {
            name: 'Nihika',
            position: 'Volunteer Coordinator',
            description: 'Coordinates volunteer opportunities',
            image: 'assets/images/officers/nihika.png'
        },
        {
            name: 'Nikkiiii',
            position: 'Activities Director',
            description: 'Plans recreational and team-building activities',
            image: 'assets/images/officers/nikkiiii.png'
        },
        {
            name: 'Nisha',
            position: 'Academic Liaison',
            description: 'Connects with academic departments',
            image: 'assets/images/officers/nisha.png'
        },
        {
            name: 'Ruhi',
            position: 'Diversity & Inclusion Chair',
            description: 'Promotes diversity and inclusion initiatives',
            image: 'assets/images/officers/ruhi.png'
        },
        {
            name: 'Shamoel',
            position: 'Environmental Officer',
            description: 'Leads environmental initiatives',
            image: 'assets/images/officers/shamoel.png'
        },
        {
            name: 'Simran',
            position: 'Health & Wellness Coordinator',
            description: 'Promotes health and wellness programs',
            image: 'assets/images/officers/simran.png'
        },
        {
            name: 'Svar',
            position: 'International Relations',
            description: 'Manages international partnerships',
            image: 'assets/images/officers/svar.png'
        },
        {
            name: 'Winston',
            position: 'Alumni Relations',
            description: 'Maintains connections with alumni',
            image: 'assets/images/officers/winston.png'
        },
        {
            name: 'Yuyan',
            position: 'Cultural Events Coordinator',
            description: 'Organizes cultural celebration events',
            image: 'assets/images/officers/yuyan.png'
        }
    ],
    
    // Error Messages
    ERROR_MESSAGES: {
        NETWORK_ERROR: 'Network error. Please check your connection and try again.',
        INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
        INVALID_S_NUMBER: 'Please enter a valid S-Number (e.g., s123456).',
        PASSWORD_TOO_SHORT: 'Password must be at least 6 characters long.',
        PASSWORDS_DONT_MATCH: 'Passwords do not match.',
        EMAIL_INVALID: 'Please enter a valid email address.',
        REQUIRED_FIELD: 'This field is required.',
        FILE_TOO_LARGE: 'File size must be less than 5MB.',
        INVALID_FILE_TYPE: 'Please select a valid image file.',
        EVENT_NOT_FOUND: 'Event not found.',
        ALREADY_REGISTERED: 'You are already registered for this event.',
        EVENT_FULL: 'This event is at full capacity.',
        INVALID_ATTENDANCE_CODE: 'Invalid attendance code.',
        ALREADY_SUBMITTED: 'You have already submitted attendance for this meeting.',
        STUDENT_NOT_FOUND: 'Student not found in system.',
        ACCOUNT_EXISTS: 'An account with this S-Number already exists.',
        NO_ACCOUNT: 'No account found. Please register first.',
        INCORRECT_PASSWORD: 'Incorrect password.',
        UNAUTHORIZED: 'You are not authorized to perform this action.',
        SERVER_ERROR: 'Server error. Please try again later.',
        VALIDATION_ERROR: 'Please check your input and try again.'
    },
    
    // Success Messages
    SUCCESS_MESSAGES: {
        LOGIN_SUCCESS: 'Login successful!',
        REGISTRATION_SUCCESS: 'Account created successfully! You can now log in.',
        PASSWORD_RESET: 'Password reset successfully.',
        PASSWORD_CHANGED: 'Password changed successfully.',
        EVENT_CREATED: 'Event created successfully!',
        EVENT_UPDATED: 'Event updated successfully!',
        EVENT_DELETED: 'Event deleted successfully!',
        HOUR_REQUEST_SUBMITTED: 'Hour request submitted successfully!',
        HOUR_REQUEST_APPROVED: 'Hour request approved!',
        HOUR_REQUEST_REJECTED: 'Hour request rejected.',
        ANNOUNCEMENT_CREATED: 'Announcement created successfully!',
        ANNOUNCEMENT_DELETED: 'Announcement deleted successfully!',
        ATTENDANCE_SUBMITTED: 'Attendance submitted successfully!',
        MEETING_CREATED: 'Meeting created successfully!',
        MEETING_UPDATED: 'Meeting updated successfully!',
        MEETING_DELETED: 'Meeting deleted successfully!',
        STUDENT_UPDATED: 'Student information updated successfully!',
        SUPPORT_MESSAGE_SENT: 'Support message sent successfully!',
        LOGOUT_SUCCESS: 'Logged out successfully.'
    },
    
    // Date Formats
    DATE_FORMATS: {
        DISPLAY: 'MMM DD, YYYY',
        INPUT: 'YYYY-MM-DD',
        TIME: 'HH:mm',
        DATETIME: 'MMM DD, YYYY HH:mm',
        RELATIVE: 'relative'
    },
    
    // Theme Colors
    THEME: {
        PRIMARY: '#4299e1',
        PRIMARY_DARK: '#3182ce',
        SECONDARY: '#48bb78',
        SUCCESS: '#48bb78',
        WARNING: '#ed8936',
        ERROR: '#f56565',
        INFO: '#4299e1',
        BACKGROUND: '#1a365d',
        BACKGROUND_LIGHT: '#2d3748',
        TEXT_PRIMARY: '#ffffff',
        TEXT_SECONDARY: '#e2e8f0',
        TEXT_MUTED: '#cbd5e0',
        BORDER: 'rgba(255, 255, 255, 0.2)',
        CARD_BACKGROUND: 'rgba(255, 255, 255, 0.1)'
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
} 