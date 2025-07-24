// services/SupabaseService.js - UPDATED with all missing methods
import { supabase } from '../supabase/supabaseClient';
import * as Crypto from 'expo-crypto';

class SupabaseService {
  
  /**
   * Test connection and log detailed information
   */
  static async testConnection() {
    try {
      console.log('🧪 Testing Supabase connection...');
      
      // Simple ping test
      const { data, error, status, statusText } = await supabase
        .from('students')
        .select('count')
        .limit(1);

      console.log('Response status:', status);
      console.log('Response statusText:', statusText);
      console.log('Response data:', data);
      console.log('Response error:', error);

      if (error) {
        console.error('❌ Supabase connection failed:', error);
        throw error;
      }

      console.log('✅ Supabase connection successful');
      return true;
    } catch (error) {
      console.error('❌ Connection test exception:', error);
      throw error;
    }
  }

  /**
   * Hash password securely
   */
  static async hashPassword(password) {
    try {
      const salt = Math.random().toString(36).substring(2, 15);
      const saltedPassword = password + salt;
      
      const hashedPassword = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        saltedPassword,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
      
      return `${hashedPassword}:${salt}`;
    } catch (error) {
      console.error('Error hashing password:', error);
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Verify password against stored hash
   */
  static async verifyPassword(password, storedHash) {
    try {
      const [hash, salt] = storedHash.split(':');
      const saltedPassword = password + salt;
      
      const hashedInput = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        saltedPassword,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
      
      return hashedInput === hash;
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  // ========== STUDENT MANAGEMENT ==========

  /**
   * Get student by S-Number with better error handling
   */
  static async getStudent(sNumber) {
    try {
      console.log('🔍 Getting student:', sNumber);
      
      // Test connection first
      await this.testConnection();
      
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('s_number', sNumber.toLowerCase())
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors when not found

      if (error) {
        console.error('❌ Error getting student:', error);
        throw error;
      }

      if (data) {
        console.log('✅ Found student:', data);
      } else {
        console.log('⚠️ Student not found:', sNumber);
      }

      return data;
    } catch (error) {
      console.error('❌ Failed to get student:', error);
      throw error;
    }
  }

  /**
   * Get auth user with better error handling
   */
  static async getAuthUser(sNumber) {
    try {
      console.log('🔍 Getting auth user:', sNumber);
      
      const { data, error } = await supabase
        .from('auth_users')
        .select('*')
        .eq('s_number', sNumber.toLowerCase())
        .maybeSingle(); // Use maybeSingle instead of single

      if (error) {
        console.error('❌ Error getting auth user:', error);
        throw error;
      }

      if (data) {
        console.log('✅ Found auth user:', { id: data.id, s_number: data.s_number });
      } else {
        console.log('⚠️ Auth user not found:', sNumber);
      }

      return data;
    } catch (error) {
      console.error('❌ Failed to get auth user:', error);
      throw error;
    }
  }

  /**
   * Create new student record
   */
  static async createStudent(studentData) {
    try {
      console.log('👤 Creating student:', studentData.sNumber);
      
      const { data, error } = await supabase
        .from('students')
        .insert([{
          s_number: studentData.sNumber.toLowerCase(),
          name: studentData.name,
          email: studentData.email || null,
          total_hours: studentData.totalHours || 0,
          account_status: 'pending'
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating student:', error);
        throw error;
      }

      console.log('✅ Student created:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to create student:', error);
      throw error;
    }
  }

  /**
   * Update student data
   */
  static async updateStudent(sNumber, updateData) {
    try {
      console.log('📝 Updating student:', sNumber, updateData);
      
      const { data, error } = await supabase
        .from('students')
        .update(updateData)
        .eq('s_number', sNumber.toLowerCase())
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating student:', error);
        throw error;
      }

      console.log('✅ Student updated:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to update student:', error);
      throw error;
    }
  }

  // ========== AUTHENTICATION ==========

  /**
   * Register student with improved flow
   */
  static async registerStudent(sNumber, password, name) {
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
      const { data: authUser, error: authError } = await supabase
        .from('auth_users')
        .insert([{
          s_number: sNumber.toLowerCase(),
          password_hash: passwordHash
        }])
        .select()
        .single();

      if (authError) {
        console.error('❌ Error creating auth record:', authError);
        throw authError;
      }

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
  }

  /**
   * Login student with improved flow
   */
  static async loginStudent(sNumber, password) {
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
  }

  /**
   * Change password
   */
  static async changePassword(sNumber, oldPassword, newPassword) {
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
      const { error } = await supabase
        .from('auth_users')
        .update({ password_hash: newPasswordHash })
        .eq('s_number', sNumber.toLowerCase());

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  }

  /**
   * Reset password (admin function)
   */
  static async resetPassword(sNumber, newPassword) {
    try {
      const newPasswordHash = await this.hashPassword(newPassword);

      const { error } = await supabase
        .from('auth_users')
        .update({ password_hash: newPasswordHash })
        .eq('s_number', sNumber.toLowerCase());

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  // ========== EVENTS MANAGEMENT ==========

  /**
   * Get all events with better error handling
   */
  static async getAllEvents() {
    try {
      console.log('📅 Getting all events...');
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date');

      if (error) {
        console.error('❌ Error getting events:', error);
        throw error;
      }
      
      console.log(`✅ Found ${data?.length || 0} events`);
      
      // Transform data to match existing structure
      return (data || []).map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        date: event.event_date,
        startTime: event.start_time,
        endTime: event.end_time,
        capacity: event.capacity,
        color: event.color,
        attendees: [], // We'll load these separately if needed
        createdBy: event.created_by,
        createdAt: event.created_at
      }));
    } catch (error) {
      console.error('Error getting events:', error);
      throw error;
    }
  }

  /**
   * Create event
   */
  static async createEvent(eventData) {
    try {
      console.log('📅 Creating event:', eventData.title);
      
      const { data, error } = await supabase
        .from('events')
        .insert([{
          title: eventData.title,
          description: eventData.description,
          location: eventData.location,
          event_date: eventData.date,
          start_time: eventData.startTime,
          end_time: eventData.endTime,
          capacity: eventData.capacity,
          color: eventData.color,
          created_by: eventData.createdBy || 'Admin'
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating event:', error);
        throw error;
      }
      
      console.log('✅ Event created:', data);
      return data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  /**
   * Update event
   */
  static async updateEvent(eventId, eventData) {
    try {
      console.log('📅 Updating event:', eventId);
      
      const { data, error } = await supabase
        .from('events')
        .update({
          title: eventData.title,
          description: eventData.description,
          location: eventData.location,
          event_date: eventData.date,
          start_time: eventData.startTime,
          end_time: eventData.endTime,
          capacity: eventData.capacity,
          color: eventData.color,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating event:', error);
        throw error;
      }
      
      console.log('✅ Event updated:', data);
      return data;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  /**
   * Delete event
   */
  static async deleteEvent(eventId) {
    try {
      console.log('🗑️ Deleting event:', eventId);
      
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) {
        console.error('❌ Error deleting event:', error);
        throw error;
      }
      
      console.log('✅ Event deleted:', eventId);
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  /**
   * Sign up for event - FIXED with correct column name
   */
  static async signupForEvent(eventId, attendeeData) {
    try {
      console.log('✍️ Signing up for event:', eventId, attendeeData);
      
      const { data, error } = await supabase
        .from('event_attendees')
        .insert([{
          event_id: eventId,
          name: attendeeData.name,
          email: attendeeData.email,
          registered_at: new Date().toISOString() // ✅ FIXED: Use registered_at instead of signed_up_at
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error signing up for event:', error);
        throw error;
      }
      
      console.log('✅ Event signup successful:', data);
      return data;
    } catch (error) {
      console.error('Error signing up for event:', error);
      throw error;
    }
  }

  // ========== HOUR REQUESTS ==========

  /**
   * Submit hour request
   */
  // Simplified submitHourRequest method for SupabaseService.js
// This only handles the hour request data + image filename

/**
 * Submit hour request with optional image filename
 */
  static async submitHourRequest(requestData) {
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
      
      // Add image filename if available (just the filename, not URLs)
      if (requestData.imageName) {
        insertData.image_name = requestData.imageName;
      }
      
      console.log('💾 Inserting hour request into database...');
      
      const { data, error } = await supabase
        .from('hour_requests')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error submitting hour request:', error);
        console.error('❌ Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
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
      
      // Provide more specific error messages
      if (error.code === '23505') {
        throw new Error('Duplicate request detected. Please check if this request was already submitted.');
      } else if (error.code === '23503') {
        throw new Error('Student not found in system. Please contact your Key Club sponsor.');
      } else if (error.message.includes('permission')) {
        throw new Error('Database permission error. Please contact support.');
      } else {
        throw new Error(`Failed to submit hour request: ${error.message}`);
      }
    }
  }

  /**
   * Get hour requests for student
   */
  static async getStudentHourRequests(sNumber) {
    try {
      const { data, error } = await supabase
        .from('hour_requests')
        .select('*')
        .eq('student_s_number', sNumber.toLowerCase())
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting student hour requests:', error);
      throw error;
    }
  }

  /**
   * Get all hour requests (admin)
   */
  static async getAllHourRequests() {
    try {
      const { data, error } = await supabase
        .from('hour_requests')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting all hour requests:', error);
      throw error;
    }
  }

  /**
   * Update hour request status
   */
  static async updateHourRequestStatus(requestId, status, adminNotes = '', reviewedBy = 'Admin') {
    try {
      // 1. Update request status
      const { data: request, error: updateError } = await supabase
        .from('hour_requests')
        .update({
          status: status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewedBy,
          admin_notes: adminNotes
        })
        .eq('id', requestId)
        .select()
        .single();

      if (updateError) throw updateError;

      // 2. If approved, update student's total hours
      if (status === 'approved') {
        const student = await this.getStudent(request.student_s_number);
        if (student) {
          const newTotalHours = parseFloat(student.total_hours || 0) + parseFloat(request.hours_requested);
          await this.updateStudent(request.student_s_number, {
            total_hours: newTotalHours,
            last_hour_update: new Date().toISOString()
          });
        }
      }

      return request;
    } catch (error) {
      console.error('Error updating hour request status:', error);
      throw error;
    }
  }

  // ========== SUPPORT QUESTIONS ==========

  /**
   * Submit support question
   */
  static async submitSupportQuestion(questionData) {
    try {
      const { data, error } = await supabase
        .from('support_questions')
        .insert([{
          name: questionData.name,
          s_number: questionData.sNumber,
          subject: questionData.subject,
          message: questionData.message,
          user_type: questionData.userType || 'student'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error submitting support question:', error);
      throw error;
    }
  }

  /**
   * Get all support questions (admin)
   */
  static async getAllSupportQuestions() {
    try {
      const { data, error } = await supabase
        .from('support_questions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting support questions:', error);
      throw error;
    }
  }

  /**
   * Update support question (admin response)
   */
  static async updateSupportQuestion(questionId, updateData) {
    try {
      console.log('📝 Updating support question:', questionId, updateData);
      
      const { data, error } = await supabase
        .from('support_questions')
        .update(updateData)
        .eq('id', questionId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating support question:', error);
        throw error;
      }
      
      console.log('✅ Support question updated:', data);
      return data;
    } catch (error) {
      console.error('Error updating support question:', error);
      throw error;
    }
  }

// Replace your resetStudentPassword method with this version
// This matches your actual database schema

/**
 * Reset student password (corrected for your actual table structure)
 */
static async resetStudentPassword(sNumber, newPassword) {
  try {
    console.log('🔒 Starting password reset for:', sNumber);
    
    // 1. Validate inputs
    if (!sNumber || !newPassword) {
      throw new Error('S-Number and password are required');
    }
    
    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    
    // 2. Check if student exists
    console.log('🔍 Checking if student exists...');
    const student = await this.getStudent(sNumber);
    if (!student) {
      console.error('❌ Student not found:', sNumber);
      throw new Error('Student not found in system');
    }
    console.log('✅ Student found:', student.s_number);

    // 3. Check if auth user exists
    console.log('🔍 Checking if auth user exists...');
    const authUser = await this.getAuthUser(sNumber);
    if (!authUser) {
      console.error('❌ Auth user not found:', sNumber);
      throw new Error('No account found for this S-Number');
    }
    console.log('✅ Auth user found:', authUser.s_number);

    // 4. Hash the new password
    console.log('🔐 Hashing new password...');
    const newPasswordHash = await this.hashPassword(newPassword);
    console.log('✅ Password hashed successfully');

    // 5. Update the password using your actual table columns
    console.log('💾 Updating password in database...');
    
    const { data: updateData, error: updateError } = await supabase
      .from('auth_users')
      .update({ 
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString() // Use your existing updated_at column
      })
      .eq('s_number', sNumber.toLowerCase())
      .select();

    if (updateError) {
      console.error('❌ Database update error details:', {
        error: updateError,
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint
      });
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    console.log('✅ Password updated in database:', updateData);

    // 6. Update student record to track password reset (optional)
    console.log('📝 Updating student record...');
    try {
      await this.updateStudent(sNumber, {
        last_password_reset: new Date().toISOString(),
        account_status: 'active'
      });
      console.log('✅ Student record updated');
    } catch (studentUpdateError) {
      console.warn('⚠️ Student record update failed (non-critical):', studentUpdateError);
      // Don't throw here - password was already updated successfully
    }

    console.log('✅ Password reset completed successfully for:', sNumber);

    return {
      success: true,
      message: 'Password reset successfully'
    };
  } catch (error) {
    console.error('❌ Password reset failed:', {
      error: error,
      message: error.message,
      stack: error.stack,
      sNumber: sNumber
    });
    
    // Re-throw with more specific error message
    if (error.message.includes('Database update failed')) {
      throw error;
    } else if (error.message.includes('not found')) {
      throw error;
    } else {
      throw new Error(`Password reset failed: ${error.message}`);
    }
  }
}

// Alternative minimal version if you prefer simplicity:
static async resetStudentPasswordSimple(sNumber, newPassword) {
  try {
    console.log('🔒 Resetting password for:', sNumber);
    
    // Hash password
    const newPasswordHash = await this.hashPassword(newPassword);
    
    // Update password and timestamp
    const { data, error } = await supabase
      .from('auth_users')
      .update({ 
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString()
      })
      .eq('s_number', sNumber.toLowerCase())
      .select();

    if (error) {
      console.error('Update error:', error);
      throw new Error(`Failed to update password: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('No user found with that S-Number');
    }

    console.log('✅ Password updated successfully');
    return { success: true, message: 'Password reset successfully' };
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
}

}

export default SupabaseService;