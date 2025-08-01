# Meeting Attendance System

This document describes the meeting attendance system implementation for the Key Club app.

## Overview

The meeting attendance system allows admins to create and manage meetings, while students can submit attendance using unique codes. The system includes:

- **Admin Meeting Management**: Create, open/close, and manage meetings
- **Student Attendance Submission**: Submit attendance for open meetings
- **Attendance History**: View past attendance records
- **Real-time Status**: See which meetings are currently open

## Features

### Admin Features
- Create new meetings with custom dates and attendance codes
- Open/close meetings for attendance submission
- Regenerate attendance codes for security
- View attendance lists for each meeting
- Delete meetings (with confirmation)
- Bulk delete multiple meetings

### Student Features
- View open meetings available for attendance
- Submit attendance using 6-character codes
- View personal attendance history
- Real-time status updates

## Database Schema

### Tables

#### `meetings`
- `id`: Primary key
- `meeting_date`: Date of the meeting
- `meeting_type`: Type of meeting (default: 'both')
- `attendance_code`: 6-character unique code
- `is_open`: Boolean indicating if meeting is open for attendance
- `created_by`: S-Number of admin who created the meeting
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update

#### `meeting_attendance`
- `id`: Primary key
- `meeting_id`: Foreign key to meetings table
- `student_s_number`: Student's S-Number
- `attendance_code`: Code used for submission
- `submitted_at`: Timestamp of submission

### Security
- Row Level Security (RLS) enabled on all tables
- Students can only view their own attendance records
- Admins can view all attendance records
- Only admins can create/manage meetings

## Files Added

### Screens
1. **`screens/AdminMeetingManagementScreen.js`**
   - Admin interface for managing meetings
   - Create, edit, delete meetings
   - View attendance lists
   - Toggle meeting status

2. **`screens/StudentMeetingAttendanceScreen.js`**
   - Student interface for attendance
   - Submit attendance codes
   - View attendance history
   - Tab-based navigation

### Services
- **`services/SupabaseService.js`** (updated)
  - Added meeting-related methods
  - Attendance submission logic
  - Code generation functions

### Navigation
- **`navigation/AppNavigator.js`** (updated)
  - Added routes for new screens
  - Integrated with existing navigation

### Home Screen
- **`screens/HomeScreen.js`** (updated)
  - Added meeting attendance menu item
  - Different options for admin vs student

## API Methods

### Meeting Management
```javascript
// Get all meetings (admin)
SupabaseService.getAllMeetings()

// Create new meeting
SupabaseService.createMeeting(meetingData)

// Update meeting
SupabaseService.updateMeeting(meetingId, updateData)

// Delete meeting
SupabaseService.deleteMeeting(meetingId)

// Generate attendance code
SupabaseService.generateAttendanceCode()
```

### Attendance
```javascript
// Get open meetings (students)
SupabaseService.getOpenMeetings()

// Submit attendance
SupabaseService.submitAttendance(meetingId, studentSNumber, code)

// Get meeting attendance (admin)
SupabaseService.getMeetingAttendance(meetingId)

// Get student attendance history
SupabaseService.getStudentAttendanceHistory(studentSNumber)
```

## Usage

### For Admins
1. Navigate to "Meeting Management" from the home menu
2. Create new meetings with dates and attendance codes
3. Open meetings when ready for attendance
4. View attendance lists and manage meeting status
5. Close meetings when attendance period ends

### For Students
1. Navigate to "Meeting Attendance" from the home menu
2. View open meetings in the "Open Meetings" tab
3. Tap on a meeting to submit attendance
4. Enter the 6-character attendance code
5. View attendance history in the "My History" tab

## Security Features

- **Unique Attendance Codes**: 6-character alphanumeric codes
- **One Submission Per Student**: Prevents duplicate submissions
- **Meeting Status Control**: Only open meetings accept attendance
- **Code Validation**: Verifies codes match meeting records
- **RLS Policies**: Database-level security controls

## Error Handling

The system includes comprehensive error handling for:
- Invalid attendance codes
- Duplicate submissions
- Closed meetings
- Network connectivity issues
- Database errors

## UI/UX Features

- **Smooth Animations**: Header and list animations
- **Pull-to-Refresh**: Update data by pulling down
- **Loading States**: Clear loading indicators
- **Empty States**: Helpful messages when no data
- **Confirmation Dialogs**: For destructive actions
- **Responsive Design**: Works on mobile and web

## Database Setup

Run the SQL commands in `database_schema.sql` to set up the required tables:

```sql
-- Execute the schema file in your Supabase SQL editor
-- This will create tables, indexes, and security policies
```

## Testing

### Admin Testing
1. Create a new meeting
2. Verify attendance code generation
3. Open/close meeting status
4. View attendance list
5. Delete meetings

### Student Testing
1. View open meetings
2. Submit attendance with valid code
3. Attempt duplicate submission (should fail)
4. Submit with invalid code (should fail)
5. View attendance history

## Future Enhancements

Potential improvements for the system:
- **QR Code Support**: Generate QR codes for attendance
- **Geolocation**: Verify student location during submission
- **Time Windows**: Set specific time periods for attendance
- **Notifications**: Push notifications for meeting reminders
- **Export Features**: Export attendance data to CSV/Excel
- **Analytics**: Attendance statistics and trends
- **Bulk Operations**: Import meetings from CSV

## Troubleshooting

### Common Issues

1. **Meeting not appearing for students**
   - Check if meeting is marked as `is_open = true`
   - Verify meeting date is correct

2. **Attendance submission fails**
   - Verify attendance code is correct
   - Check if meeting is still open
   - Ensure student hasn't already submitted

3. **Admin can't create meetings**
   - Verify admin privileges in database
   - Check RLS policies are correctly configured

4. **Navigation issues**
   - Ensure screens are properly registered in navigation
   - Check screen names match navigation calls

### Debug Information

The system includes extensive console logging:
- Meeting creation/updates
- Attendance submissions
- Error conditions
- Data loading operations

Check the browser/device console for detailed logs when troubleshooting. 