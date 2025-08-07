// Web-compatible SupabaseService - Direct port from React Native version
const SupabaseService = {
    // Web-compatible crypto functions
    async hashPassword(password) {
        try {
            const salt = Math.random().toString(36).substring(2, 15);
            const saltedPassword = password + salt;
            
            const encoder = new TextEncoder();
            const data = encoder.encode(saltedPassword);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            return `${hashHex}:${salt}`;
        } catch (error) {
            console.error('Error hashing password:', error);
            throw new Error('Failed to hash password');
        }
    },

    async verifyPassword(password, storedHash) {
        try {
            const [hash, salt] = storedHash.split(':');
            const saltedPassword = password + salt;
            
            const encoder = new TextEncoder();
            const data = encoder.encode(saltedPassword);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            return hashHex === hash;
        } catch (error) {
            console.error('Error verifying password:', error);
            return false;
        }
    },

    // Test connection
    async testConnection() {
        try {
            console.log('🧪 Testing Supabase connection...');
            
            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/students?select=count&limit=1`, {
                headers: {
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            console.log('✅ Supabase connection successful');
            return true;
        } catch (error) {
            console.error('❌ Connection test exception:', error);
            throw error;
        }
    },

    // Student management
    async getStudent(sNumber) {
        try {
            console.log('🔍 Getting student:', sNumber);
            
            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/students?s_number=eq.${sNumber.toLowerCase()}`, {
                headers: {
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const student = data && data.length > 0 ? data[0] : null;

            if (student) {
                console.log('✅ Found student:', student);
            } else {
                console.log('⚠️ Student not found:', sNumber);
            }

            return student;
        } catch (error) {
            console.error('❌ Failed to get student:', error);
            throw error;
        }
    },

    async getAuthUser(sNumber) {
        try {
            console.log('🔍 Getting auth user:', sNumber);
            
            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/auth_users?s_number=eq.${sNumber.toLowerCase()}`, {
                headers: {
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const authUser = data && data.length > 0 ? data[0] : null;

            if (authUser) {
                console.log('✅ Found auth user:', { id: authUser.id, s_number: authUser.s_number });
            } else {
                console.log('⚠️ Auth user not found:', sNumber);
            }

            return authUser;
        } catch (error) {
            console.error('❌ Failed to get auth user:', error);
            throw error;
        }
    },

    async createStudent(studentData) {
        try {
            console.log('👤 Creating student:', studentData.sNumber);
            
            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/students`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    s_number: studentData.sNumber.toLowerCase(),
                    name: studentData.name,
                    email: studentData.email || null,
                    total_hours: studentData.totalHours || 0,
                    account_status: 'pending'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Check if response has content before trying to parse JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                console.log('✅ Student created:', data);
                return data;
            } else {
                console.log('✅ Student created successfully (no data returned)');
                return { success: true };
            }
        } catch (error) {
            console.error('❌ Failed to create student:', error);
            throw error;
        }
    },

    async updateStudent(sNumber, updateData) {
        try {
            console.log('📝 Updating student:', sNumber, updateData);
            
            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/students?s_number=eq.${sNumber.toLowerCase()}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Check if response has content before trying to parse JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                console.log('✅ Student updated:', data);
                return data;
            } else {
                // PATCH requests might not return data, just return success
                console.log('✅ Student updated successfully (no data returned)');
                return { success: true };
            }
        } catch (error) {
            console.error('❌ Failed to update student:', error);
            throw error;
        }
    },

    // Authentication
    async registerStudent(sNumber, password, name) {
        try {
            console.log('🚀 Starting registration for:', sNumber);

            // 1. Test connection first
            await this.testConnection();

            // 2. Check if student exists, if not create one
            let student = await this.getStudent(sNumber);
            if (!student) {
                console.log('👤 Student not found, creating new record...');
                student = await this.createStudent({
                    sNumber: sNumber,
                    name: name || sNumber,
                    totalHours: 0
                });
            }

            // 3. Check if already has auth record
            const existingAuth = await this.getAuthUser(sNumber);
            if (existingAuth) {
                throw new Error('Account already exists. Please use the login page.');
            }

            // 4. Hash password
            console.log('🔐 Hashing password...');
            const passwordHash = await this.hashPassword(password);

            // 5. Create auth record
            console.log('🔑 Creating auth record...');
            const authResponse = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/auth_users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    s_number: sNumber.toLowerCase(),
                    password_hash: passwordHash
                })
            });

            if (!authResponse.ok) {
                throw new Error(`HTTP ${authResponse.status}: ${authResponse.statusText}`);
            }

            const authUser = await authResponse.json();
            console.log('✅ Auth record created:', { id: authUser.id, s_number: authUser.s_number });

            // 6. Update student status
            await this.updateStudent(sNumber, {
                name: name || student.name,
                account_status: 'active',
                account_created: new Date().toISOString()
            });

            console.log('✅ Registration completed successfully for:', sNumber);

            return {
                success: true,
                user: {
                    id: student.id,
                    sNumber: sNumber.toLowerCase(),
                    name: name || student.name,
                    role: 'student'
                }
            };
        } catch (error) {
            console.error('❌ Registration error:', error);
            throw error;
        }
    },

    async loginStudent(sNumber, password) {
        try {
            console.log('🚀 Starting login for:', sNumber);

            // 1. Test connection first
            await this.testConnection();

            // 2. Get auth record
            const authUser = await this.getAuthUser(sNumber);
            if (!authUser) {
                throw new Error('No account found. Please register first.');
            }

            // 3. Verify password
            console.log('🔐 Verifying password...');
            const isValidPassword = await this.verifyPassword(password, authUser.password_hash);
            if (!isValidPassword) {
                throw new Error('Incorrect password.');
            }

            // 4. Get student data
            const student = await this.getStudent(sNumber);
            if (!student) {
                throw new Error('Student record not found.');
            }

            // 5. Update last login
            await this.updateStudent(sNumber, {
                last_login: new Date().toISOString()
            });

            console.log('✅ Login successful for:', sNumber);

            return {
                success: true,
                user: {
                    id: student.id,
                    sNumber: sNumber.toLowerCase(),
                    name: student.name,
                    role: student.role || 'student',
                    totalHours: student.total_hours
                }
            };
        } catch (error) {
            console.error('❌ Login error:', error);
            throw error;
        }
    },

    async changePassword(sNumber, oldPassword, newPassword) {
        try {
            // 1. Get auth record
            const authUser = await this.getAuthUser(sNumber);
            if (!authUser) {
                throw new Error('Account not found');
            }

            // 2. Verify old password
            const isValidOldPassword = await this.verifyPassword(oldPassword, authUser.password_hash);
            if (!isValidOldPassword) {
                throw new Error('Current password is incorrect');
            }

            // 3. Hash new password
            const newPasswordHash = await this.hashPassword(newPassword);

            // 4. Update password
            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/auth_users?s_number=eq.${sNumber.toLowerCase()}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({ password_hash: newPasswordHash })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Check if response has content before trying to parse JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                await response.json(); // Consume the response
            }

            return { success: true };
        } catch (error) {
            console.error('Password change error:', error);
            throw error;
        }
    },

    async resetPassword(sNumber, newPassword) {
        try {
            const newPasswordHash = await this.hashPassword(newPassword);

            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/auth_users?s_number=eq.${sNumber.toLowerCase()}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({ password_hash: newPasswordHash })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Check if response has content before trying to parse JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                await response.json(); // Consume the response
            }

            return { success: true };
        } catch (error) {
            console.error('Password reset error:', error);
            throw error;
        }
    },

    // Events management
    async getAllEvents() {
        try {
            console.log('📅 Getting all events with attendees...');
            
            // Step 1: Get all events
            const eventsResponse = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/events?order=event_date.asc`, {
                headers: {
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                }
            });

            if (!eventsResponse.ok) {
                throw new Error(`HTTP ${eventsResponse.status}: ${eventsResponse.statusText}`);
            }

            const eventsData = await eventsResponse.json();
            console.log(`✅ Found ${eventsData?.length || 0} events`);
            
            if (!eventsData || eventsData.length === 0) {
                return [];
            }

            // Step 2: Get all attendees for all events
            const eventIds = eventsData.map(event => event.id);
            const attendeesResponse = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/event_attendees?event_id=in.(${eventIds.join(',')})&order=registered_at.asc`, {
                headers: {
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                }
            });

            let attendeesData = [];
            if (attendeesResponse.ok) {
                attendeesData = await attendeesResponse.json();
                console.log(`✅ Found ${attendeesData?.length || 0} total attendees across all events`);
            } else {
                console.warn('⚠️ Continuing without attendees data');
            }
            
            // Step 3: Group attendees by event_id
            const attendeesByEvent = {};
            if (attendeesData) {
                attendeesData.forEach(attendee => {
                    if (!attendeesByEvent[attendee.event_id]) {
                        attendeesByEvent[attendee.event_id] = [];
                    }
                    attendeesByEvent[attendee.event_id].push({
                        id: attendee.id,
                        name: attendee.name,
                        email: attendee.email,
                        registeredAt: attendee.registered_at
                    });
                });
            }

            // Step 4: Transform events and attach attendees
            const eventsWithAttendees = eventsData.map(event => {
                const eventAttendees = attendeesByEvent[event.id] || [];
                
                console.log(`Event "${event.title}": ${eventAttendees.length} attendees`);
                
                return {
                    id: event.id,
                    title: event.title,
                    description: event.description,
                    location: event.location,
                    date: event.event_date,
                    startTime: event.start_time,
                    endTime: event.end_time,
                    capacity: event.capacity,
                    color: event.color,
                    attendees: eventAttendees,
                    createdBy: event.created_by,
                    createdAt: event.created_at
                };
            });

            console.log('✅ Events loaded with attendees successfully');
            return eventsWithAttendees;
            
        } catch (error) {
            console.error('❌ Error getting events:', error);
            throw error;
        }
    },

    async getEventById(eventId) {
        try {
            console.log('📅 Getting event by ID with attendees:', eventId);
            
            // Get the event
            const eventResponse = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/events?id=eq.${eventId}`, {
                headers: {
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                }
            });

            if (!eventResponse.ok) {
                throw new Error(`HTTP ${eventResponse.status}: ${eventResponse.statusText}`);
            }

            const eventData = await eventResponse.json();
            if (!eventData || eventData.length === 0) {
                return null;
            }

            const event = eventData[0];

            // Get attendees for this event
            const attendeesResponse = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/event_attendees?event_id=eq.${eventId}&order=registered_at.asc`, {
                headers: {
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                }
            });

            let attendees = [];
            if (attendeesResponse.ok) {
                const attendeesData = await attendeesResponse.json();
                attendees = (attendeesData || []).map(attendee => ({
                    id: attendee.id,
                    name: attendee.name,
                    email: attendee.email,
                    registeredAt: attendee.registered_at
                }));
            }

            console.log(`✅ Found event "${event.title}" with ${attendees.length} attendees`);

            return {
                id: event.id,
                title: event.title,
                description: event.description,
                location: event.location,
                date: event.event_date,
                startTime: event.start_time,
                endTime: event.end_time,
                capacity: event.capacity,
                color: event.color,
                attendees: attendees,
                createdBy: event.created_by,
                createdAt: event.created_at
            };
            
        } catch (error) {
            console.error('❌ Error getting event by ID:', error);
            throw error;
        }
    },

    async createEvent(eventData) {
        try {
            console.log('➕ Creating new event:', eventData.title);
            
            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    title: eventData.title,
                    description: eventData.description,
                    location: eventData.location,
                    event_date: eventData.date,
                    start_time: eventData.startTime,
                    end_time: eventData.endTime,
                    capacity: parseInt(eventData.capacity),
                    color: eventData.color || '#4287f5',
                    created_by: eventData.createdBy || 'admin',
                    created_at: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ Event created successfully:', data);
            return data;
        } catch (error) {
            console.error('❌ Failed to create event:', error);
            throw error;
        }
    },

    async updateEvent(eventId, eventData) {
        try {
            console.log('📝 Updating event:', eventId);
            
            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/events?id=eq.${eventId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    title: eventData.title,
                    description: eventData.description,
                    location: eventData.location,
                    event_date: eventData.date,
                    start_time: eventData.startTime,
                    end_time: eventData.endTime,
                    capacity: parseInt(eventData.capacity),
                    color: eventData.color || '#4287f5',
                    updated_at: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ Event updated successfully:', data);
            return data;
        } catch (error) {
            console.error('❌ Failed to update event:', error);
            throw error;
        }
    },

    async deleteEvent(eventId) {
        try {
            console.log('🗑️ Deleting event:', eventId);
            
            // First, delete all attendees for this event
            console.log('🗑️ Deleting event attendees...');
            const attendeesResponse = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/event_attendees?event_id=eq.${eventId}`, {
                method: 'DELETE',
                headers: {
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                }
            });

            if (!attendeesResponse.ok) {
                throw new Error(`HTTP ${attendeesResponse.status}: ${attendeesResponse.statusText}`);
            }

            // Then delete the event itself
            console.log('🗑️ Deleting event record...');
            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/events?id=eq.${eventId}`, {
                method: 'DELETE',
                headers: {
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ Event deleted successfully:', data);
            return data;
        } catch (error) {
            console.error('❌ Failed to delete event:', error);
            throw error;
        }
    },

    async signupForEvent(eventId, attendeeData) {
        try {
            console.log('✍️ Signing up for event:', eventId, attendeeData);
            
            // Check if already registered
            const checkResponse = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/event_attendees?event_id=eq.${eventId}&email=eq.${attendeeData.email}`, {
                headers: {
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                }
            });

            if (checkResponse.ok) {
                const existingAttendee = await checkResponse.json();
                if (existingAttendee && existingAttendee.length > 0) {
                    throw new Error('You are already registered for this event');
                }
            }

            // Check event capacity
            const event = await this.getEventById(eventId);
            if (!event) {
                throw new Error('Event not found');
            }

            if (event.attendees && event.attendees.length >= event.capacity) {
                throw new Error('Event is at full capacity');
            }

            // Add attendee
            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/event_attendees`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    event_id: eventId,
                    name: attendeeData.name,
                    email: attendeeData.email,
                    s_number: attendeeData.sNumber || null,
                    registered_at: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ Successfully signed up for event:', data);
            return data;
        } catch (error) {
            console.error('❌ Failed to sign up for event:', error);
            throw error;
        }
    },

    async getEventAttendees(eventId) {
        try {
            console.log('👥 Getting attendees for event:', eventId);
            
            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/event_attendees?event_id=eq.${eventId}&order=registered_at.asc`, {
                headers: {
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const attendeesData = await response.json();
            const attendees = (attendeesData || []).map(attendee => ({
                id: attendee.id,
                name: attendee.name,
                email: attendee.email,
                sNumber: attendee.s_number,
                registeredAt: attendee.registered_at
            }));

            console.log(`✅ Found ${attendees.length} attendees for event ${eventId}`);
            return attendees;
        } catch (error) {
            console.error('❌ Failed to get event attendees:', error);
            throw error;
        }
    },

    async unregisterFromEvent(eventId, email) {
        try {
            console.log('🚫 Unregistering from event:', eventId, email);
            
            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/event_attendees?event_id=eq.${eventId}&email=eq.${email}`, {
                method: 'DELETE',
                headers: {
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            console.log('✅ Successfully unregistered from event');
            return true;
        } catch (error) {
            console.error('❌ Failed to unregister from event:', error);
            throw error;
        }
    },

    // Hour requests
    async submitHourRequest(requestData) {
        try {
            console.log('⏰ Submitting hour request to Supabase...');
            console.log('📋 Request data:', {
                studentSNumber: requestData.studentSNumber,
                eventName: requestData.eventName,
                hoursRequested: requestData.hoursRequested,
                hasImage: !!requestData.imageName
            });
            
            // Prepare the data for insertion
            const insertData = {
                student_s_number: requestData.studentSNumber.toLowerCase(),
                student_name: requestData.studentName,
                event_name: requestData.eventName,
                event_date: requestData.eventDate,
                hours_requested: parseFloat(requestData.hoursRequested),
                description: requestData.description,
                status: 'pending', // Default status
                submitted_at: new Date().toISOString()
            };
            
            // Add image filename if available
            if (requestData.imageName) {
                insertData.image_name = requestData.imageName;
            }
            
            console.log('💾 Inserting hour request into database...');
            
            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/hour_requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify(insertData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('✅ Hour request submitted successfully:', {
                id: data.id,
                status: data.status,
                student: data.student_s_number,
                hours: data.hours_requested,
                imageName: data.image_name
            });
            
            return data;
        } catch (error) {
            console.error('❌ Error submitting hour request:', error);
            throw error;
        }
    },

    async getStudentHourRequests(sNumber) {
        try {
            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/hour_requests?student_s_number=eq.${sNumber.toLowerCase()}&order=submitted_at.desc`, {
                headers: {
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data || [];
        } catch (error) {
            console.error('Error getting student hour requests:', error);
            throw error;
        }
    },

    async getAllHourRequests() {
        try {
            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/hour_requests?order=submitted_at.desc`, {
                headers: {
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data || [];
        } catch (error) {
            console.error('Error getting all hour requests:', error);
            throw error;
        }
    },

    async updateHourRequestStatus(requestId, status, adminNotes = '', reviewedBy = 'Admin', hoursRequested = null) {
        try {
            console.log('🔄 Starting hour request status update:', { requestId, status, adminNotes, reviewedBy, hoursRequested });
            
            // 1. Update request status
            const updateData = {
                status: status,
                reviewed_at: new Date().toISOString(),
                reviewed_by: reviewedBy,
                admin_notes: adminNotes
            };

            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/hour_requests?id=eq.${requestId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const request = await response.json();
            console.log('✅ Request status updated successfully:', request);
            
            const normalizedStatus = (status || '').toString().trim().toLowerCase();
            console.log('🔔 Status value received:', status, '| Normalized:', normalizedStatus);
            
            if (normalizedStatus === 'approved') {
                console.log('📝 Full request object at approval:', request);
                if (!request) {
                    console.error('❌ No request object found after update!');
                    return request;
                }
                const studentSNumber = request.student_s_number || request.s_number;
                if (!studentSNumber) {
                    console.error('❌ No student S-number found in request:', request);
                    return request;
                }
                const student = await this.getStudent(studentSNumber);
                console.log('👤 Current student data:', student);
                if (student) {
                    const currentHours = parseFloat(student.total_hours || 0);
                    let requestedHours = hoursRequested !== null ? parseFloat(hoursRequested) : parseFloat(request.hours_requested);
                    console.log('🧪 Type of requestedHours:', typeof requestedHours, 'Value:', requestedHours);
                    if (isNaN(requestedHours) || requestedHours <= 0) {
                        console.error('❌ Invalid or missing hours_requested in request:', request);
                        return request;
                    }
                    const newTotalHours = currentHours + requestedHours;
                    console.log('📊 Hours calculation:', {
                        currentHours,
                        requestedHours,
                        newTotalHours
                    });
                    const updateResult = await this.updateStudent(studentSNumber, {
                        total_hours: newTotalHours,
                        last_hour_update: new Date().toISOString()
                    });
                    console.log('✅ Student hours updated successfully:', updateResult);
                } else {
                    console.error('❌ Student not found:', studentSNumber);
                }
            } else {
                console.warn('⚠️ Approval logic skipped: status was not "approved" (got:', status, ')');
            }

            return request;
        } catch (error) {
            console.error('❌ Error updating hour request status:', error);
            throw error;
        }
    },

    // Support questions
    async submitSupportQuestion(questionData) {
        try {
            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/support_questions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    name: questionData.name,
                    s_number: questionData.sNumber,
                    subject: questionData.subject,
                    message: questionData.message,
                    user_type: questionData.userType || 'student'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error submitting support question:', error);
            throw error;
        }
    },

    async getAllSupportQuestions() {
        try {
            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/support_questions?order=submitted_at.desc`, {
                headers: {
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data || [];
        } catch (error) {
            console.error('Error getting support questions:', error);
            throw error;
        }
    },

    async updateSupportQuestion(questionId, updateData) {
        try {
            console.log('📝 Updating support question:', questionId, updateData);
            
            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/support_questions?id=eq.${questionId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('✅ Support question updated:', data);
            return data;
        } catch (error) {
            console.error('Error updating support question:', error);
            throw error;
        }
    },

    // Get all students
    async getAllStudents() {
        try {
            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/students?order=name.asc`, {
                headers: {
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return { data };
        } catch (error) {
            console.error('❌ Error getting all students:', error);
            return { data: [], error };
        }
    },

    // Meeting management
    generateAttendanceCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    async getAllMeetings() {
        try {
            console.log('📅 Getting all meetings...');
            
            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/meetings?order=meeting_date.desc`, {
                headers: {
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const meetings = await response.json();
            console.log(`✅ Found ${meetings?.length || 0} meetings`);
            return meetings || [];
        } catch (error) {
            console.error('❌ Error getting meetings:', error);
            throw error;
        }
    },

    async getMeetingById(meetingId) {
        try {
            console.log('📅 Getting meeting by ID:', meetingId);
            
            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/meetings?id=eq.${meetingId}`, {
                headers: {
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data && data.length > 0 ? data[0] : null;
        } catch (error) {
            console.error('❌ Error getting meeting by ID:', error);
            throw error;
        }
    },

    async createMeeting(meetingData) {
        try {
            console.log('📅 Creating new meeting...');
            
            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/meetings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    meeting_date: meetingData.meetingDate,
                    meeting_type: meetingData.meetingType,
                    attendance_code: meetingData.attendanceCode,
                    is_open: meetingData.isOpen || false,
                    created_by: meetingData.createdBy,
                    created_at: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const meeting = await response.json();
            console.log('✅ Meeting created successfully:', meeting);
            return meeting;
        } catch (error) {
            console.error('❌ Error creating meeting:', error);
            throw error;
        }
    },

    async updateMeeting(meetingId, updateData) {
        try {
            console.log('📅 Updating meeting:', meetingId);
            
            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/meetings?id=eq.${meetingId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    ...updateData,
                    updated_at: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const meeting = await response.json();
            console.log('✅ Meeting updated successfully:', meeting);
            return meeting;
        } catch (error) {
            console.error('❌ Error updating meeting:', error);
            throw error;
        }
    },

    async deleteMeeting(meetingId) {
        try {
            console.log('🗑️ Deleting meeting:', meetingId);
            
            // First delete related attendance records
            console.log('🗑️ Deleting attendance records for meeting:', meetingId);
            const attendanceResponse = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/meeting_attendance?meeting_id=eq.${meetingId}`, {
                method: 'DELETE',
                headers: {
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                }
            });

            if (!attendanceResponse.ok) {
                throw new Error(`HTTP ${attendanceResponse.status}: ${attendanceResponse.statusText}`);
            }

            console.log('✅ Attendance records deleted successfully');
            
            // Then delete the meeting
            console.log('🗑️ Deleting meeting record:', meetingId);
            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/meetings?id=eq.${meetingId}`, {
                method: 'DELETE',
                headers: {
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const meetingData = await response.json();
            console.log('✅ Meeting deleted successfully:', meetingData);
            
            return true;
        } catch (error) {
            console.error('❌ Error deleting meeting:', error);
            throw error;
        }
    },

    async getMeetingAttendance(meetingId) {
        try {
            console.log('📊 Getting attendance for meeting:', meetingId);
            
            // First get the attendance records
            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/meeting_attendance?meeting_id=eq.${meetingId}&order=submitted_at.asc`, {
                headers: {
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const attendance = await response.json();

            // Then get student names for each attendance record
            const attendanceWithNames = await Promise.all(
                (attendance || []).map(async (record) => {
                    try {
                        const studentResponse = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/students?s_number=eq.${record.student_s_number}`, {
                            headers: {
                                'apikey': CONFIG.SUPABASE_ANON_KEY,
                                'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                            }
                        });

                        if (studentResponse.ok) {
                            const studentData = await studentResponse.json();
                            const student = studentData && studentData.length > 0 ? studentData[0] : null;

                            if (student) {
                                return {
                                    ...record,
                                    students: {
                                        name: student.name,
                                        s_number: student.s_number
                                    }
                                };
                            }
                        }

                        return {
                            ...record,
                            students: {
                                name: 'Unknown Student',
                                s_number: record.student_s_number
                            }
                        };
                    } catch (error) {
                        console.warn(`⚠️ Error getting student info for ${record.student_s_number}:`, error);
                        return {
                            ...record,
                            students: {
                                name: 'Unknown Student',
                                s_number: record.student_s_number
                            }
                        };
                    }
                })
            );

            console.log(`✅ Found ${attendanceWithNames.length} attendance records`);
            return attendanceWithNames;
        } catch (error) {
            console.error('❌ Error getting meeting attendance:', error);
            throw error;
        }
    },

    async getOpenMeetings() {
        try {
            console.log('📅 Getting open meetings...');
            
            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/meetings?is_open=eq.true&order=meeting_date.desc`, {
                headers: {
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const meetings = await response.json();
            console.log(`✅ Found ${meetings?.length || 0} open meetings`);
            return meetings || [];
        } catch (error) {
            console.error('❌ Error getting open meetings:', error);
            throw error;
        }
    },

    async getStudentAttendanceHistory(studentSNumber) {
        try {
            console.log('📊 Getting attendance history for student:', studentSNumber);
            
            // First get the attendance records
            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/meeting_attendance?student_s_number=eq.${studentSNumber.toLowerCase()}&order=submitted_at.asc`, {
                headers: {
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const attendance = await response.json();

            // Then get meeting info for each attendance record
            const attendanceWithMeetings = await Promise.all(
                (attendance || []).map(async (record) => {
                    try {
                        const meetingResponse = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/meetings?id=eq.${record.meeting_id}`, {
                            headers: {
                                'apikey': CONFIG.SUPABASE_ANON_KEY,
                                'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                            }
                        });

                        if (meetingResponse.ok) {
                            const meetingData = await meetingResponse.json();
                            const meeting = meetingData && meetingData.length > 0 ? meetingData[0] : null;

                            if (meeting) {
                                return {
                                    ...record,
                                    meetings: {
                                        meeting_date: meeting.meeting_date,
                                        meeting_type: meeting.meeting_type,
                                        is_open: meeting.is_open
                                    }
                                };
                            }
                        }

                        return {
                            ...record,
                            meetings: {
                                meeting_date: 'Unknown Date',
                                meeting_type: 'unknown',
                                is_open: false
                            }
                        };
                    } catch (error) {
                        console.warn(`⚠️ Error getting meeting info for ${record.meeting_id}:`, error);
                        return {
                            ...record,
                            meetings: {
                                meeting_date: 'Unknown Date',
                                meeting_type: 'unknown',
                                is_open: false
                            }
                        };
                    }
                })
            );

            console.log(`✅ Found ${attendanceWithMeetings.length} attendance records for student`);
            return attendanceWithMeetings;
        } catch (error) {
            console.error('❌ Error getting student attendance:', error);
            throw error;
        }
    },

    async getStudentAttendance(studentSNumber) {
        return this.getStudentAttendanceHistory(studentSNumber);
    },

    async getStudentMissedMeetings(studentSNumber) {
        try {
            console.log('📊 Getting missed meetings for student:', studentSNumber);
            
            // Get all meetings for the current school year
            const allMeetings = await this.getAllMeetings();
            
            // Get student's attendance
            const studentAttendance = await this.getStudentAttendance(studentSNumber);
            
            // Find meetings where student didn't attend AND the meeting date has passed
            const attendedMeetingIds = studentAttendance.map(a => a.meeting_id);
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time to start of day
            
            const missedMeetings = allMeetings.filter(meeting => {
                const meetingDate = new Date(meeting.meeting_date);
                meetingDate.setHours(0, 0, 0, 0);
                
                // Only count as missed if:
                // 1. Student didn't attend
                // 2. Meeting date has passed
                return !attendedMeetingIds.includes(meeting.id) && meetingDate < today;
            });

            console.log(`✅ Student missed ${missedMeetings.length} meetings (only counting past meetings)`);
            return missedMeetings;
        } catch (error) {
            console.error('❌ Error getting missed meetings:', error);
            throw error;
        }
    },

    async submitAttendance(meetingId, studentSNumber, attendanceCode, sessionType = 'both') {
        try {
            console.log('✅ Submitting attendance for meeting:', meetingId);
            console.log('👤 Student:', studentSNumber);
            console.log('🔑 Code:', attendanceCode);
            console.log('⏰ Session:', sessionType);
            
            // First, verify the meeting exists and is open
            const meeting = await this.getMeetingById(meetingId);
            if (!meeting) {
                throw new Error('Meeting not found');
            }
            
            if (!meeting.is_open) {
                throw new Error('Attendance submission is closed for this meeting');
            }
            
            if (meeting.attendance_code !== attendanceCode) {
                throw new Error('Invalid attendance code');
            }

            // Check if student already submitted attendance
            const checkResponse = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/meeting_attendance?meeting_id=eq.${meetingId}&student_s_number=eq.${studentSNumber.toLowerCase()}`, {
                headers: {
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                }
            });

            if (checkResponse.ok) {
                const existingAttendance = await checkResponse.json();
                if (existingAttendance && existingAttendance.length > 0) {
                    throw new Error('You have already submitted attendance for this meeting');
                }
            }

            // Submit attendance
            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/meeting_attendance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    meeting_id: meetingId,
                    student_s_number: studentSNumber.toLowerCase(),
                    attendance_code: attendanceCode,
                    session_type: sessionType,
                    submitted_at: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const attendance = await response.json();
            console.log('✅ Attendance submitted successfully:', attendance);
            return attendance;
        } catch (error) {
            console.error('❌ Error submitting attendance:', error);
            throw error;
        }
    },

    // Announcements
    async getAllAnnouncements() {
        try {
            console.log('📢 Getting all announcements...');
            
            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/announcements?order=date.desc`, {
                headers: {
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const announcements = await response.json();
            console.log(`✅ Found ${announcements?.length || 0} announcements`);
            return announcements || [];
        } catch (error) {
            console.error('❌ Error getting announcements:', error);
            throw error;
        }
    },

    async createAnnouncement(announcementData) {
        try {
            console.log('📢 Creating new announcement:', announcementData.title);
            
            const insertData = {
                title: announcementData.title,
                message: announcementData.message,
                created_by: announcementData.createdBy || 'admin',
                date: new Date().toISOString()
            };

            // Add image data if provided
            if (announcementData.imageUrl) {
                insertData.image_url = announcementData.imageUrl;
            }
            if (announcementData.imageFilename) {
                insertData.image_filename = announcementData.imageFilename;
            }

            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/announcements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify(insertData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ Announcement created successfully:', data);
            return data;
        } catch (error) {
            console.error('❌ Failed to create announcement:', error);
            throw error;
        }
    },

    async deleteAnnouncement(announcementId) {
        try {
            console.log('🗑️ Deleting announcement:', announcementId);
            
            const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/announcements?id=eq.${announcementId}`, {
                method: 'DELETE',
                headers: {
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ Announcement deleted successfully:', data);
            return data;
        } catch (error) {
            console.error('❌ Failed to delete announcement:', error);
            throw error;
        }
    }
};
