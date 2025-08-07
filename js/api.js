// API Service - Direct mapping to SupabaseService functions
const API = {
    supabaseUrl: CONFIG.SUPABASE_URL,
    supabaseKey: CONFIG.SUPABASE_ANON_KEY,

    // Initialize API
    init: function() {
        console.log('🔧 Initializing API with Supabase...');
        console.log('Supabase URL:', this.supabaseUrl);
        console.log('API Key present:', !!this.supabaseKey);
    },

    // Authentication API - Maps directly to SupabaseService auth methods
    auth: {
        // Maps to SupabaseService.loginStudent
        studentLogin: async function(sNumber, password) {
            try {
                // Call the actual SupabaseService function
                const result = await SupabaseService.loginStudent(sNumber, password);
                return result.user;
            } catch (error) {
                console.error('Student login error:', error);
                throw error;
            }
        },

        // Maps to SupabaseService.registerStudent
        registerStudent: async function(studentData) {
            try {
                // Call the actual SupabaseService function
                const result = await SupabaseService.registerStudent(
                    studentData.sNumber, 
                    studentData.password, 
                    studentData.name
                );
                return result.user;
            } catch (error) {
                console.error('Student registration error:', error);
                throw error;
            }
        },

        // Maps to SupabaseService.changePassword
        changePassword: async function(sNumber, oldPassword, newPassword) {
            try {
                const result = await SupabaseService.changePassword(sNumber, oldPassword, newPassword);
                return result;
            } catch (error) {
                console.error('Change password error:', error);
                throw error;
            }
        },

        // Maps to SupabaseService.resetPassword
        resetPassword: async function(sNumber, newPassword) {
            try {
                const result = await SupabaseService.resetPassword(sNumber, newPassword);
                return result;
            } catch (error) {
                console.error('Reset password error:', error);
                throw error;
            }
        }
    },

    // Events API - Maps directly to SupabaseService event methods
    events: {
        // Maps to SupabaseService.getAllEvents
        getAll: async function() {
            try {
                const events = await SupabaseService.getAllEvents();
                return events;
            } catch (error) {
                console.error('Get all events error:', error);
                throw error;
            }
        },

        // Maps to SupabaseService.getEventById
        getById: async function(eventId) {
            try {
                const event = await SupabaseService.getEventById(eventId);
                return event;
            } catch (error) {
                console.error('Get event by ID error:', error);
                throw error;
            }
        },

        // Maps to SupabaseService.createEvent
        create: async function(eventData) {
            try {
                const event = await SupabaseService.createEvent(eventData);
                return event;
            } catch (error) {
                console.error('Create event error:', error);
                throw error;
            }
        },

        // Maps to SupabaseService.updateEvent
        update: async function(eventId, eventData) {
            try {
                const event = await SupabaseService.updateEvent(eventId, eventData);
                return event;
            } catch (error) {
                console.error('Update event error:', error);
                throw error;
            }
        },

        // Maps to SupabaseService.deleteEvent
        delete: async function(eventId) {
            try {
                const result = await SupabaseService.deleteEvent(eventId);
                return { success: true };
            } catch (error) {
                console.error('Delete event error:', error);
                throw error;
            }
        },

        // Maps to SupabaseService.signupForEvent
        signup: async function(eventId, attendeeData) {
            try {
                const result = await SupabaseService.signupForEvent(eventId, attendeeData);
                return result;
            } catch (error) {
                console.error('Signup for event error:', error);
                throw error;
            }
        },

        // Maps to SupabaseService.getEventAttendees
        getAttendees: async function(eventId) {
            try {
                const attendees = await SupabaseService.getEventAttendees(eventId);
                return attendees;
            } catch (error) {
                console.error('Get event attendees error:', error);
                throw error;
            }
        },

        // Maps to SupabaseService.unregisterFromEvent
        unregister: async function(eventId, email) {
            try {
                const result = await SupabaseService.unregisterFromEvent(eventId, email);
                return { success: true };
            } catch (error) {
                console.error('Unregister from event error:', error);
                throw error;
            }
        }
    },

    // Hour Requests API - Maps directly to SupabaseService hour request methods
    hourRequests: {
        // Maps to SupabaseService.getAllHourRequests
        getAll: async function() {
            try {
                const requests = await SupabaseService.getAllHourRequests();
                return requests;
            } catch (error) {
                console.error('Get all hour requests error:', error);
                throw error;
            }
        },

        // Maps to SupabaseService.getStudentHourRequests
        getForStudent: async function(sNumber) {
            try {
                const requests = await SupabaseService.getStudentHourRequests(sNumber);
                return requests;
            } catch (error) {
                console.error('Get student hour requests error:', error);
                throw error;
            }
        },

        // Maps to SupabaseService.submitHourRequest
        submit: async function(requestData) {
            try {
                const result = await SupabaseService.submitHourRequest(requestData);
                return result;
            } catch (error) {
                console.error('Submit hour request error:', error);
                throw error;
            }
        },

        // Maps to SupabaseService.updateHourRequestStatus
        updateStatus: async function(requestId, status, adminNotes = '', reviewedBy = 'Admin', hoursRequested = null) {
            try {
                const result = await SupabaseService.updateHourRequestStatus(requestId, status, adminNotes, reviewedBy, hoursRequested);
                return result;
            } catch (error) {
                console.error('Update hour request status error:', error);
                throw error;
            }
        }
    },

    // Announcements API - Maps directly to SupabaseService announcement methods
    announcements: {
        // Maps to SupabaseService.getAllAnnouncements
        getAll: async function() {
            try {
                const announcements = await SupabaseService.getAllAnnouncements();
                return announcements;
            } catch (error) {
                console.error('Get all announcements error:', error);
                throw error;
            }
        },

        // Maps to SupabaseService.createAnnouncement
        create: async function(announcementData) {
            try {
                const announcement = await SupabaseService.createAnnouncement(announcementData);
                return announcement;
            } catch (error) {
                console.error('Create announcement error:', error);
                throw error;
            }
        },

        // Maps to SupabaseService.deleteAnnouncement
        delete: async function(announcementId) {
            try {
                const result = await SupabaseService.deleteAnnouncement(announcementId);
                return { success: true };
            } catch (error) {
                console.error('Delete announcement error:', error);
                throw error;
            }
        }
    },

    // Meetings API - Maps directly to SupabaseService meeting methods
    meetings: {
        // Maps to SupabaseService.getAllMeetings
        getAll: async function() {
            try {
                const meetings = await SupabaseService.getAllMeetings();
                return meetings;
            } catch (error) {
                console.error('Get all meetings error:', error);
                throw error;
            }
        },

        // Maps to SupabaseService.getMeetingById
        getById: async function(meetingId) {
            try {
                const meeting = await SupabaseService.getMeetingById(meetingId);
                return meeting;
            } catch (error) {
                console.error('Get meeting by ID error:', error);
                throw error;
            }
        },

        // Maps to SupabaseService.createMeeting
        create: async function(meetingData) {
            try {
                const meeting = await SupabaseService.createMeeting(meetingData);
                return meeting;
            } catch (error) {
                console.error('Create meeting error:', error);
                throw error;
            }
        },

        // Maps to SupabaseService.updateMeeting
        update: async function(meetingId, updateData) {
            try {
                const meeting = await SupabaseService.updateMeeting(meetingId, updateData);
                return meeting;
            } catch (error) {
                console.error('Update meeting error:', error);
                throw error;
            }
        },

        // Maps to SupabaseService.deleteMeeting
        delete: async function(meetingId) {
            try {
                const result = await SupabaseService.deleteMeeting(meetingId);
                return { success: true };
            } catch (error) {
                console.error('Delete meeting error:', error);
                throw error;
            }
        },

        // Maps to SupabaseService.generateAttendanceCode
        generateCode: async function(meetingId) {
            try {
                const code = SupabaseService.generateAttendanceCode();
                return { code };
            } catch (error) {
                console.error('Generate attendance code error:', error);
                throw error;
            }
        },

        // Maps to SupabaseService.submitAttendance
        submitAttendance: async function(meetingId, studentSNumber, attendanceCode, sessionType = 'both') {
            try {
                const result = await SupabaseService.submitAttendance(meetingId, studentSNumber, attendanceCode, sessionType);
                return result;
            } catch (error) {
                console.error('Submit attendance error:', error);
                throw error;
            }
        },

        // Maps to SupabaseService.getStudentAttendanceHistory
        getStudentHistory: async function(studentSNumber) {
            try {
                const history = await SupabaseService.getStudentAttendanceHistory(studentSNumber);
                return history;
            } catch (error) {
                console.error('Get student attendance history error:', error);
                throw error;
            }
        },

        // Maps to SupabaseService.getMeetingAttendance
        getAttendance: async function(meetingId) {
            try {
                const attendance = await SupabaseService.getMeetingAttendance(meetingId);
                return attendance;
            } catch (error) {
                console.error('Get meeting attendance error:', error);
                throw error;
            }
        }
    },

    // Students API - Maps directly to SupabaseService student methods
    students: {
        // Maps to SupabaseService.getAllStudents
        getAll: async function() {
            try {
                const result = await SupabaseService.getAllStudents();
                return result.data || [];
            } catch (error) {
                console.error('Get all students error:', error);
                throw error;
            }
        },

        // Maps to SupabaseService.getStudent
        getById: async function(sNumber) {
            try {
                const student = await SupabaseService.getStudent(sNumber);
                return student;
            } catch (error) {
                console.error('Get student by ID error:', error);
                throw error;
            }
        },

        // Maps to SupabaseService.updateStudent
        update: async function(sNumber, updateData) {
            try {
                const student = await SupabaseService.updateStudent(sNumber, updateData);
                return student;
            } catch (error) {
                console.error('Update student error:', error);
                throw error;
            }
        },

        // Maps to SupabaseService.createStudent
        create: async function(studentData) {
            try {
                const student = await SupabaseService.createStudent(studentData);
                return student;
            } catch (error) {
                console.error('Create student error:', error);
                throw error;
            }
        }
    },

    // Support API - Maps directly to SupabaseService support methods
    support: {
        // Maps to SupabaseService.submitSupportQuestion
        submit: async function(questionData) {
            try {
                const result = await SupabaseService.submitSupportQuestion(questionData);
                return result;
            } catch (error) {
                console.error('Submit support question error:', error);
                throw error;
            }
        },

        // Maps to SupabaseService.getAllSupportQuestions
        getAll: async function() {
            try {
                const questions = await SupabaseService.getAllSupportQuestions();
                return questions;
            } catch (error) {
                console.error('Get all support questions error:', error);
                throw error;
            }
        },

        // Maps to SupabaseService.updateSupportQuestion
        update: async function(questionId, updateData) {
            try {
                const result = await SupabaseService.updateSupportQuestion(questionId, updateData);
                return result;
            } catch (error) {
                console.error('Update support question error:', error);
                throw error;
            }
        }
    },

    // File upload - Maps to SupabaseService.uploadAnnouncementImage
    uploadFile: async function(file, folder) {
        try {
            // For now, we'll use Google Drive for file uploads
            // In the future, we can integrate with SupabaseService.uploadAnnouncementImage
            const result = await GoogleDrive.uploadFile(file, folder);
            return {
                url: result.webViewLink,
                filename: result.downloadUrl
            };
        } catch (error) {
            console.error('Upload file error:', error);
            throw error;
        }
    },

    // Initialize the API
    initialize: function() {
        this.init();
    }
};

// Initialize the API when the module loads
API.initialize(); 