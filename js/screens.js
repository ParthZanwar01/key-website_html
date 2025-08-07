// Screens module for Key Club Hub Web App

const Screens = {
    // Events screen functionality
    events: {
        // Load events
        load: async function() {
            try {
                const eventsList = document.getElementById('eventsList');
                if (!eventsList) return;

                // Show loading state
                eventsList.innerHTML = '<div class="loading-state"><i class="fas fa-spinner"></i> Loading events...</div>';

                const events = await API.events.getAll();
                
                if (events.length === 0) {
                    eventsList.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-calendar-times"></i>
                            <h3>No Events Found</h3>
                            <p>There are no events scheduled at this time.</p>
                        </div>
                    `;
                    return;
                }

                // Sort events by date
                const sortedEvents = Utils.array.sortBy(events, 'date', 'asc');
                
                eventsList.innerHTML = sortedEvents.map(event => this.renderEventCard(event)).join('');
                
                // Add event listeners to event cards
                this.addEventListeners();
                
            } catch (error) {
                console.error('❌ Error loading events:', error);
                const eventsList = document.getElementById('eventsList');
                if (eventsList) {
                    eventsList.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h3>Error Loading Events</h3>
                            <p>Failed to load events. Please try again.</p>
                        </div>
                    `;
                }
            }
        },

        // Render event card
        renderEventCard: function(event) {
            const eventDate = Utils.date.format(event.date, CONFIG.DATE_FORMATS.DISPLAY);
            const eventTime = `${event.startTime} - ${event.endTime}`;
            const attendeesCount = event.attendees ? event.attendees.length : 0;
            const isFull = attendeesCount >= event.capacity;
            
            return `
                <div class="event-card hover-lift" data-event-id="${event.id}">
                    <div class="event-header">
                        <div>
                            <h3 class="event-title">${event.title}</h3>
                            <p class="event-date">${eventDate} • ${eventTime}</p>
                        </div>
                        <div class="event-status ${isFull ? 'full' : 'available'}">
                            ${isFull ? 'Full' : `${attendeesCount}/${event.capacity}`}
                        </div>
                    </div>
                    
                    <p class="event-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${event.location}
                    </p>
                    
                    <p class="event-description">${Utils.string.truncate(event.description, 150)}</p>
                    
                    <div class="event-actions">
                        <button class="btn btn-primary btn-sm" onclick="Screens.events.viewDetails('${event.id}')">
                            <i class="fas fa-eye"></i>
                            View Details
                        </button>
                        ${Auth.isAdmin ? `
                            <button class="btn btn-secondary btn-sm" onclick="Screens.events.editEvent('${event.id}')">
                                <i class="fas fa-edit"></i>
                                Edit
                            </button>
                            <button class="btn btn-secondary btn-sm" onclick="Screens.events.deleteEvent('${event.id}')">
                                <i class="fas fa-trash"></i>
                                Delete
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        },

        // Add event listeners
        addEventListeners: function() {
            const eventCards = document.querySelectorAll('.event-card');
            eventCards.forEach(card => {
                card.addEventListener('click', (e) => {
                    if (!e.target.closest('button')) {
                        const eventId = card.dataset.eventId;
                        this.viewDetails(eventId);
                    }
                });
            });
        },

        // View event details
        viewDetails: async function(eventId) {
            try {
                const event = await API.events.getById(eventId);
                if (!event) {
                    UI.showToast('Event not found', 'error');
                    return;
                }

                const eventDate = Utils.date.format(event.date, CONFIG.DATE_FORMATS.DISPLAY);
                const eventTime = `${event.startTime} - ${event.endTime}`;
                const attendeesCount = event.attendees ? event.attendees.length : 0;

                const content = `
                    <div class="event-details">
                        <div class="event-detail-item">
                            <i class="fas fa-calendar"></i>
                            <span class="event-detail-label">Date:</span>
                            <span class="event-detail-value">${eventDate}</span>
                        </div>
                        
                        <div class="event-detail-item">
                            <i class="fas fa-clock"></i>
                            <span class="event-detail-label">Time:</span>
                            <span class="event-detail-value">${eventTime}</span>
                        </div>
                        
                        <div class="event-detail-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span class="event-detail-label">Location:</span>
                            <span class="event-detail-value">${event.location}</span>
                        </div>
                        
                        <div class="event-detail-item">
                            <i class="fas fa-users"></i>
                            <span class="event-detail-label">Capacity:</span>
                            <span class="event-detail-value">${attendeesCount}/${event.capacity}</span>
                        </div>
                        
                        <div class="event-detail-item">
                            <i class="fas fa-info-circle"></i>
                            <span class="event-detail-label">Description:</span>
                            <span class="event-detail-value">${event.description}</span>
                        </div>
                    </div>
                    
                    ${event.attendees && event.attendees.length > 0 ? `
                        <div class="event-attendees">
                            <h4>Attendees (${event.attendees.length})</h4>
                            <ul>
                                ${event.attendees.map(attendee => `
                                    <li>${attendee.name} (${attendee.email})</li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    <div class="event-actions">
                        ${!Auth.isAdmin && attendeesCount < event.capacity ? `
                            <button class="btn btn-primary" onclick="Screens.events.signupForEvent('${event.id}')">
                                <i class="fas fa-plus"></i>
                                Sign Up
                            </button>
                        ` : ''}
                        
                        ${Auth.isAdmin ? `
                            <button class="btn btn-secondary" onclick="Screens.events.editEvent('${event.id}')">
                                <i class="fas fa-edit"></i>
                                Edit Event
                            </button>
                        ` : ''}
                    </div>
                `;

                Navigation.showModal(event.title, content);
                
            } catch (error) {
                console.error('❌ Error viewing event details:', error);
                UI.showToast('Error loading event details', 'error');
            }
        },

        // Sign up for event
        signupForEvent: async function(eventId) {
            try {
                const user = Auth.getCurrentUser();
                if (!user) {
                    UI.showToast('Please log in to sign up for events', 'error');
                    return;
                }

                const attendeeData = {
                    name: user.name || user.sNumber,
                    email: `${user.sNumber}@example.com`, // In real app, this would be user's email
                    sNumber: user.sNumber
                };

                await API.events.signup(eventId, attendeeData);
                
                UI.showToast('Successfully signed up for event!', 'success');
                Navigation.closeModal();
                
                // Refresh events list
                await this.load();
                
            } catch (error) {
                console.error('❌ Error signing up for event:', error);
                UI.showToast(error.message || 'Error signing up for event', 'error');
            }
        },

        // Edit event (admin only)
        editEvent: function(eventId) {
            // This would open an edit form
            console.log('Edit event:', eventId);
            UI.showToast('Edit functionality coming soon', 'info');
        },

        // Delete event (admin only)
        deleteEvent: async function(eventId) {
            try {
                const confirmed = confirm('Are you sure you want to delete this event?');
                if (!confirmed) return;

                await API.events.delete(eventId);
                
                UI.showToast('Event deleted successfully', 'success');
                
                // Refresh events list
                await this.load();
                
            } catch (error) {
                console.error('❌ Error deleting event:', error);
                UI.showToast('Error deleting event', 'error');
            }
        }
    },

    // Hour requests functionality
    hourRequests: {
        // Load hour requests (admin)
        load: async function() {
            try {
                const requestsList = document.getElementById('hourRequestsList');
                if (!requestsList) return;

                requestsList.innerHTML = '<div class="loading-state"><i class="fas fa-spinner"></i> Loading hour requests...</div>';

                const requests = await API.hourRequests.getAll();
                
                if (requests.length === 0) {
                    requestsList.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-clock"></i>
                            <h3>No Hour Requests</h3>
                            <p>There are no hour requests to review.</p>
                        </div>
                    `;
                    return;
                }

                // Sort by submission date (newest first)
                const sortedRequests = Utils.array.sortBy(requests, 'submittedAt', 'desc');
                
                requestsList.innerHTML = sortedRequests.map(request => this.renderRequestCard(request)).join('');
                
            } catch (error) {
                console.error('❌ Error loading hour requests:', error);
                const requestsList = document.getElementById('hourRequestsList');
                if (requestsList) {
                    requestsList.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h3>Error Loading Requests</h3>
                            <p>Failed to load hour requests. Please try again.</p>
                        </div>
                    `;
                }
            }
        },

        // Render request card
        renderRequestCard: function(request) {
            const submittedDate = Utils.date.format(request.submittedAt, CONFIG.DATE_FORMATS.DISPLAY);
            const eventDate = Utils.date.format(request.eventDate, CONFIG.DATE_FORMATS.DISPLAY);
            
            return `
                <div class="request-card" data-request-id="${request.id}">
                    <div class="request-header">
                        <div>
                            <h3 class="request-student">${request.studentName}</h3>
                            <p class="request-date">Submitted: ${submittedDate}</p>
                        </div>
                        <span class="request-status ${request.status}">${Utils.string.capitalize(request.status)}</span>
                    </div>
                    
                    <div class="request-details">
                        <div class="request-detail">
                            <span class="request-detail-label">Event:</span>
                            <span class="request-detail-value">${request.eventName}</span>
                        </div>
                        
                        <div class="request-detail">
                            <span class="request-detail-label">Event Date:</span>
                            <span class="request-detail-value">${eventDate}</span>
                        </div>
                        
                        <div class="request-detail">
                            <span class="request-detail-label">Hours Requested:</span>
                            <span class="request-detail-value">${request.hoursRequested}</span>
                        </div>
                    </div>
                    
                    <div class="request-description">
                        <strong>Description:</strong><br>
                        ${request.description}
                    </div>
                    
                    ${request.status === 'pending' ? `
                        <div class="request-actions">
                            <button class="btn btn-success btn-sm" onclick="Screens.hourRequests.approveRequest('${request.id}')">
                                <i class="fas fa-check"></i>
                                Approve
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="Screens.hourRequests.rejectRequest('${request.id}')">
                                <i class="fas fa-times"></i>
                                Reject
                            </button>
                        </div>
                    ` : ''}
                    
                    ${request.adminNotes ? `
                        <div class="admin-notes">
                            <strong>Admin Notes:</strong><br>
                            ${request.adminNotes}
                        </div>
                    ` : ''}
                </div>
            `;
        },

        // Approve request
        approveRequest: async function(requestId) {
            try {
                const notes = prompt('Add approval notes (optional):');
                const hours = prompt('Hours to approve (leave empty to use requested amount):');
                
                const hoursToApprove = hours ? parseFloat(hours) : null;
                
                await API.hourRequests.updateStatus(requestId, 'approved', notes || '', 'Admin', hoursToApprove);
                
                UI.showToast('Hour request approved!', 'success');
                
                // Refresh requests list
                await this.load();
                
            } catch (error) {
                console.error('❌ Error approving request:', error);
                UI.showToast('Error approving request', 'error');
            }
        },

        // Reject request
        rejectRequest: async function(requestId) {
            try {
                const notes = prompt('Add rejection reason:');
                if (!notes) {
                    UI.showToast('Please provide a rejection reason', 'error');
                    return;
                }
                
                await API.hourRequests.updateStatus(requestId, 'rejected', notes, 'Admin');
                
                UI.showToast('Hour request rejected', 'success');
                
                // Refresh requests list
                await this.load();
                
            } catch (error) {
                console.error('❌ Error rejecting request:', error);
                UI.showToast('Error rejecting request', 'error');
            }
        }
    },

    // Announcements functionality
    announcements: {
        // Load announcements
        load: async function() {
            try {
                const announcementsList = document.getElementById('announcementsList');
                if (!announcementsList) return;

                announcementsList.innerHTML = '<div class="loading-state"><i class="fas fa-spinner"></i> Loading announcements...</div>';

                const announcements = await API.announcements.getAll();
                
                if (announcements.length === 0) {
                    announcementsList.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-bullhorn"></i>
                            <h3>No Announcements</h3>
                            <p>There are no announcements at this time.</p>
                        </div>
                    `;
                    return;
                }

                announcementsList.innerHTML = announcements.map(announcement => this.renderAnnouncementCard(announcement)).join('');
                
            } catch (error) {
                console.error('❌ Error loading announcements:', error);
                const announcementsList = document.getElementById('announcementsList');
                if (announcementsList) {
                    announcementsList.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h3>Error Loading Announcements</h3>
                            <p>Failed to load announcements. Please try again.</p>
                        </div>
                    `;
                }
            }
        },

        // Render announcement card
        renderAnnouncementCard: function(announcement) {
            const date = Utils.date.format(announcement.date, CONFIG.DATE_FORMATS.DISPLAY);
            
            return `
                <div class="announcement-card" data-announcement-id="${announcement.id}">
                    <div class="announcement-header">
                        <div>
                            <h3 class="announcement-title">${announcement.title}</h3>
                            <p class="announcement-date">${date}</p>
                        </div>
                        ${Auth.isAdmin ? `
                            <button class="btn btn-danger btn-sm" onclick="Screens.announcements.deleteAnnouncement('${announcement.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                    
                    <div class="announcement-message">
                        ${announcement.message}
                    </div>
                </div>
            `;
        },

        // Delete announcement (admin only)
        deleteAnnouncement: async function(announcementId) {
            try {
                const confirmed = confirm('Are you sure you want to delete this announcement?');
                if (!confirmed) return;

                await API.announcements.delete(announcementId);
                
                UI.showToast('Announcement deleted successfully', 'success');
                
                // Refresh announcements list
                await this.load();
                
            } catch (error) {
                console.error('❌ Error deleting announcement:', error);
                UI.showToast('Error deleting announcement', 'error');
            }
        }
    },

    // Officers functionality
    officers: {
        // Load officers
        load: function() {
            try {
                const officersGrid = document.getElementById('officersGrid');
                if (!officersGrid) return;

                officersGrid.innerHTML = CONFIG.OFFICERS.map(officer => this.renderOfficerCard(officer)).join('');
                
            } catch (error) {
                console.error('❌ Error loading officers:', error);
                const officersGrid = document.getElementById('officersGrid');
                if (officersGrid) {
                    officersGrid.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h3>Error Loading Officers</h3>
                            <p>Failed to load officers information. Please try again.</p>
                        </div>
                    `;
                }
            }
        },

        // Render officer card
        renderOfficerCard: function(officer) {
            return `
                <div class="officer-card hover-lift">
                    <div class="officer-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    
                    <h3 class="officer-name">${officer.name}</h3>
                    <p class="officer-position">${officer.position}</p>
                    <p class="officer-description">${officer.description}</p>
                </div>
            `;
        }
    },

    // Contact functionality
    contact: {
        // Submit contact form
        submit: async function() {
            try {
                const form = document.getElementById('contactForm');
                if (!form) return;

                const formData = new FormData(form);
                const data = {
                    name: formData.get('name'),
                    sNumber: formData.get('sNumber'),
                    subject: formData.get('subject'),
                    message: formData.get('message'),
                    userType: Auth.isAdmin ? 'admin' : 'student'
                };

                // Validate form
                const validation = Utils.validation.validateForm(data, {
                    name: { required: true, minLength: 2 },
                    subject: { required: true, minLength: 5 },
                    message: { required: true, minLength: 10 }
                });

                if (!validation.isValid) {
                    const firstError = Object.values(validation.errors)[0];
                    UI.showToast(firstError, 'error');
                    return;
                }

                await API.support.submit(data);
                
                UI.showToast('Message sent successfully!', 'success');
                form.reset();
                
            } catch (error) {
                console.error('❌ Error submitting contact form:', error);
                UI.showToast('Error sending message', 'error');
            }
        }
    },

    // Public events functionality
    publicEvents: {
        // Load public events
        load: async function() {
            try {
                const eventsList = document.getElementById('publicEventsList');
                if (!eventsList) return;

                eventsList.innerHTML = '<div class="loading-state"><i class="fas fa-spinner"></i> Loading public events...</div>';

                const events = await API.events.getAll();
                
                if (events.length === 0) {
                    eventsList.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-calendar-times"></i>
                            <h3>No Public Events</h3>
                            <p>There are no public events scheduled at this time.</p>
                        </div>
                    `;
                    return;
                }

                // Sort events by date
                const sortedEvents = Utils.array.sortBy(events, 'date', 'asc');
                
                eventsList.innerHTML = sortedEvents.map(event => Screens.events.renderEventCard(event)).join('');
                
                // Add event listeners
                Screens.events.addEventListeners();
                
            } catch (error) {
                console.error('❌ Error loading public events:', error);
                const eventsList = document.getElementById('publicEventsList');
                if (eventsList) {
                    eventsList.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h3>Error Loading Events</h3>
                            <p>Failed to load public events. Please try again.</p>
                        </div>
                    `;
                }
            }
        }
    },

    // Admin Student Management Screen
    adminStudentManagement: {
        // Load students
        load: async function() {
            try {
                const students = await API.students.getAll();
                this.render(students);
            } catch (error) {
                console.error('Error loading students:', error);
                UI.showToast('Error loading students', 'error');
            }
        },

        // Render students
        render: function(students) {
            const container = document.getElementById('studentsList');
            if (!container) return;

            if (students.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <h3>No Students</h3>
                        <p>No students have registered yet.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = students.map(student => `
                <div class="student-card">
                    <div class="student-info">
                        <div class="student-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="student-details">
                            <h4>${student.name}</h4>
                            <p>${student.sNumber}</p>
                            <span class="student-status ${student.verified ? 'verified' : 'pending'}">
                                ${student.verified ? 'Verified' : 'Pending Verification'}
                            </span>
                        </div>
                    </div>
                    <div class="student-actions">
                        <button class="btn btn-secondary" onclick="Screens.adminStudentManagement.viewStudent('${student.id}')">
                            <i class="fas fa-eye"></i>
                            View
                        </button>
                        <button class="btn btn-primary" onclick="Screens.adminStudentManagement.verifyStudent('${student.id}')">
                            <i class="fas fa-check"></i>
                            Verify
                        </button>
                    </div>
                </div>
            `).join('');
        },

        // View student details
        viewStudent: function(studentId) {
            UI.showToast('Student details view coming soon', 'info');
        },

        // Verify student
        verifyStudent: async function(studentId) {
            try {
                await API.students.verify(studentId);
                UI.showToast('Student verified successfully', 'success');
                this.load(); // Reload the list
            } catch (error) {
                console.error('Error verifying student:', error);
                UI.showToast('Error verifying student', 'error');
            }
        }
    },

    // Admin Meeting Management Screen
    adminMeetingManagement: {
        // Load meetings
        load: async function() {
            try {
                const meetings = await API.meetings.getAll();
                this.render(meetings);
            } catch (error) {
                console.error('Error loading meetings:', error);
                UI.showToast('Error loading meetings', 'error');
            }
        },

        // Render meetings
        render: function(meetings) {
            const container = document.getElementById('meetingsList');
            if (!container) return;

            if (meetings.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-calendar-times"></i>
                        <h3>No Meetings</h3>
                        <p>No meetings have been created yet.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = meetings.map(meeting => `
                <div class="meeting-card">
                    <div class="meeting-info">
                        <h4>${meeting.title}</h4>
                        <p>${meeting.description}</p>
                        <div class="meeting-details">
                            <span><i class="fas fa-calendar"></i> ${Utils.date.format(meeting.date)}</span>
                            <span><i class="fas fa-clock"></i> ${meeting.time}</span>
                            <span><i class="fas fa-users"></i> ${meeting.attendees?.length || 0} attendees</span>
                        </div>
                    </div>
                    <div class="meeting-actions">
                        <button class="btn btn-secondary" onclick="Screens.adminMeetingManagement.viewMeeting('${meeting.id}')">
                            <i class="fas fa-eye"></i>
                            View
                        </button>
                        <button class="btn btn-primary" onclick="Screens.adminMeetingManagement.generateCode('${meeting.id}')">
                            <i class="fas fa-qrcode"></i>
                            Generate Code
                        </button>
                    </div>
                </div>
            `).join('');
        },

        // View meeting details
        viewMeeting: function(meetingId) {
            UI.showToast('Meeting details view coming soon', 'info');
        },

        // Generate attendance code
        generateCode: async function(meetingId) {
            try {
                const code = await API.meetings.generateCode(meetingId);
                UI.showToast(`Attendance code generated: ${code}`, 'success');
            } catch (error) {
                console.error('Error generating code:', error);
                UI.showToast('Error generating code', 'error');
            }
        }
    },

    // Student Meeting Attendance Screen
    studentMeetingAttendance: {
        // Load attendance history
        load: async function() {
            try {
                const history = await API.meetings.getStudentHistory();
                this.renderHistory(history);
            } catch (error) {
                console.error('Error loading attendance history:', error);
                UI.showToast('Error loading history', 'error');
            }
        },

        // Render attendance history
        renderHistory: function(history) {
            const container = document.getElementById('attendanceHistory');
            if (!container) return;

            if (history.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-history"></i>
                        <h3>No Attendance History</h3>
                        <p>You haven't attended any meetings yet.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = history.map(record => `
                <div class="attendance-record">
                    <div class="attendance-info">
                        <h4>${record.meetingTitle}</h4>
                        <p>${Utils.date.format(record.date)} at ${record.time}</p>
                    </div>
                    <div class="attendance-status">
                        <span class="status ${record.status}">${record.status}</span>
                    </div>
                </div>
            `).join('');
        },

        // Submit attendance code
        submitCode: async function(code) {
            try {
                await API.meetings.submitAttendance(code);
                UI.showToast('Attendance submitted successfully', 'success');
                this.load(); // Reload history
            } catch (error) {
                console.error('Error submitting attendance:', error);
                UI.showToast('Invalid attendance code', 'error');
            }
        }
    },

    // Student Hour Requests Screen
    studentHourRequests: {
        // Load user's hour requests
        load: async function() {
            try {
                const requests = await API.hourRequests.getUserRequests();
                this.render(requests);
            } catch (error) {
                console.error('Error loading hour requests:', error);
                UI.showToast('Error loading requests', 'error');
            }
        },

        // Render hour requests
        render: function(requests) {
            const container = document.getElementById('myHourRequestsList');
            if (!container) return;

            if (requests.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-clock"></i>
                        <h3>No Hour Requests</h3>
                        <p>You haven't submitted any hour requests yet.</p>
                        <button class="btn btn-primary" onclick="Navigation.navigateTo('hourRequest')">
                            <i class="fas fa-plus"></i>
                            Submit Request
                        </button>
                    </div>
                `;
                return;
            }

            container.innerHTML = requests.map(request => `
                <div class="hour-request-card">
                    <div class="request-info">
                        <h4>${request.eventName}</h4>
                        <p>${request.description}</p>
                        <div class="request-details">
                            <span><i class="fas fa-calendar"></i> ${Utils.date.format(request.eventDate)}</span>
                            <span><i class="fas fa-clock"></i> ${request.hoursRequested} hours</span>
                        </div>
                    </div>
                    <div class="request-status">
                        <span class="status ${request.status}">${request.status}</span>
                    </div>
                </div>
            `).join('');
        }
    },

    // Create Announcement Screen
    createAnnouncement: {
        // Submit announcement
        submit: async function(formData) {
            try {
                await API.announcements.create(formData);
                UI.showToast('Announcement created successfully', 'success');
                Navigation.navigateTo('announcements');
            } catch (error) {
                console.error('Error creating announcement:', error);
                UI.showToast('Error creating announcement', 'error');
            }
        }
    },

    // Attendee List Screen
    attendeeList: {
        // Load attendees for an event
        load: async function(eventId) {
            try {
                const attendees = await API.events.getAttendees(eventId);
                this.render(attendees);
            } catch (error) {
                console.error('Error loading attendees:', error);
                UI.showToast('Error loading attendees', 'error');
            }
        },

        // Render attendees
        render: function(attendees) {
            const container = document.getElementById('attendeesList');
            if (!container) return;

            if (attendees.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <h3>No Attendees</h3>
                        <p>No one has signed up for this event yet.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = attendees.map(attendee => `
                <div class="attendee-card">
                    <div class="attendee-info">
                        <div class="attendee-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="attendee-details">
                            <h4>${attendee.name}</h4>
                            <p>${attendee.sNumber}</p>
                        </div>
                    </div>
                    <div class="attendee-stats">
                        <span class="stat">
                            <i class="fas fa-clock"></i>
                            ${attendee.totalHours || 0} hours
                        </span>
                    </div>
                </div>
            `).join('');

            // Update stats
            this.updateStats(attendees);
        },

        // Update statistics
        updateStats: function(attendees) {
            const totalAttendees = document.getElementById('totalAttendees');
            const avgHours = document.getElementById('avgHours');
            
            if (totalAttendees) {
                totalAttendees.textContent = attendees.length;
            }
            
            if (avgHours) {
                const totalHours = attendees.reduce((sum, attendee) => sum + (attendee.totalHours || 0), 0);
                const average = attendees.length > 0 ? (totalHours / attendees.length).toFixed(1) : 0;
                avgHours.textContent = average;
            }
        }
    },

    // Social Media Screen
    socialMedia: {
        // Load social media links
        load: function() {
            console.log('Social media screen loaded');
        }
    }
};

// Global screen functions
window.loadEvents = async function() {
    await Screens.events.load();
};

window.loadHourRequests = async function() {
    await Screens.hourRequests.load();
};

window.loadAnnouncements = async function() {
    await Screens.announcements.load();
};

window.loadOfficers = function() {
    Screens.officers.load();
};

window.submitContactForm = async function() {
    await Screens.contact.submit();
};

window.loadPublicEvents = async function() {
    await Screens.publicEvents.load();
};

window.submitHourRequest = async function() {
    try {
        const form = document.getElementById('hourRequestForm');
        if (!form) return;

        const formData = new FormData(form);
        const user = Auth.getCurrentUser();
        
        // Get raw form values
        const rawHoursRequested = formData.get('hoursRequested');
        const hoursRequested = rawHoursRequested ? parseFloat(rawHoursRequested) : null;
        
        const data = {
            studentSNumber: user.sNumber,
            studentName: user.name || user.sNumber,
            eventName: formData.get('eventName'),
            eventDate: formData.get('eventDate'),
            hoursRequested: hoursRequested,
            description: formData.get('description')
        };

        // Validate form
        const validation = Utils.validation.validateForm(data, {
            eventName: { required: true, minLength: 3 },
            eventDate: { required: true },
            hoursRequested: { required: true, custom: (value) => {
                if (value === null || isNaN(value)) return 'Please enter a valid number of hours';
                if (value <= 0) return 'Hours must be greater than 0';
                if (value > 24) return 'Hours cannot exceed 24';
                return null;
            }},
            description: { required: true, minLength: 10 }
        });

        if (!validation.isValid) {
            const firstError = Object.values(validation.errors)[0];
            UI.showToast(firstError, 'error');
            return;
        }

        // Handle file upload if present
        const imageFile = formData.get('image');
        if (imageFile && imageFile.size > 0) {
            try {
                const uploadResult = await API.uploadFile(imageFile, 'hour-requests');
                data.imageName = uploadResult.filename;
            } catch (error) {
                console.error('❌ Error uploading image:', error);
                UI.showToast('Error uploading image. Please try again.', 'error');
                return;
            }
        }

        await API.hourRequests.submit(data);
        
        UI.showToast('Hour request submitted successfully!', 'success');
        form.reset();
        
        // Navigate back to home
        Navigation.navigateTo('home');
        
    } catch (error) {
        console.error('❌ Error submitting hour request:', error);
        UI.showToast('Error submitting hour request', 'error');
    }
};

// Global screen functions
window.loadAdminStudentManagement = async function() {
    await Screens.adminStudentManagement.load();
};

window.loadAdminMeetingManagement = async function() {
    await Screens.adminMeetingManagement.load();
};

window.loadStudentMeetingAttendance = async function() {
    await Screens.studentMeetingAttendance.load();
};

window.loadStudentHourRequests = async function() {
    await Screens.studentHourRequests.load();
};

window.loadSocialMedia = function() {
    Screens.socialMedia.load();
};

window.showStudentVerification = function() {
    UI.showToast('Student verification feature coming soon', 'info');
};

window.exportStudentData = function() {
    UI.showToast('Export feature coming soon', 'info');
};

window.showMeetingCreation = function() {
    UI.showToast('Meeting creation feature coming soon', 'info');
};

window.generateAttendanceCode = function() {
    UI.showToast('Code generation feature coming soon', 'info');
};

// Handle attendance code submission
window.submitAttendanceCode = async function() {
    try {
        const form = document.getElementById('attendanceCodeForm');
        if (!form) return;

        const formData = new FormData(form);
        const code = formData.get('code');

        if (!code || code.trim() === '') {
            UI.showToast('Please enter an attendance code', 'error');
            return;
        }

        await Screens.studentMeetingAttendance.submitCode(code);
        form.reset();
        
    } catch (error) {
        console.error('Error submitting attendance code:', error);
        UI.showToast(error.message || 'Error submitting attendance', 'error');
    }
};

// Handle announcement creation
window.submitAnnouncement = async function() {
    try {
        const form = document.getElementById('createAnnouncementForm');
        if (!form) return;

        const formData = new FormData(form);
        const data = {
            title: formData.get('title'),
            content: formData.get('content'),
            priority: formData.get('priority')
        };

        // Validate form
        const validation = Utils.validation.validateForm(data, {
            title: { required: true, minLength: 3 },
            content: { required: true, minLength: 10 },
            priority: { required: true }
        });

        if (!validation.isValid) {
            const firstError = Object.values(validation.errors)[0];
            UI.showToast(firstError, 'error');
            return;
        }

        // Handle file upload if present
        const imageFile = formData.get('image');
        if (imageFile && imageFile.size > 0) {
            try {
                const uploadResult = await API.uploadFile(imageFile, 'announcements');
                data.imageName = uploadResult.filename;
            } catch (error) {
                console.error('Error uploading image:', error);
                UI.showToast('Error uploading image. Please try again.', 'error');
                return;
            }
        }

        await Screens.createAnnouncement.submit(data);
        form.reset();
        
    } catch (error) {
        console.error('Error creating announcement:', error);
        UI.showToast('Error creating announcement', 'error');
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Screens;
} else {
    window.Screens = Screens;
} 