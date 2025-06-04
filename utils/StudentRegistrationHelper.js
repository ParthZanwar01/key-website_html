import SupabaseService from '../services/SupabaseService';
import { supabase } from '../supabase/supabaseClient';

/**
 * Helper utility for populating and managing student records in Supabase
 */
class StudentRegistrationHelper {
  /**
   * Add a batch of students to Supabase
   * 
   * @param {Array} students - Array of student objects containing sNumber and optionally name
   * @returns {Promise<Array>} - The response from Supabase
   * 
   * Example usage:
   * const students = [
   *   { sNumber: 's150712', name: 'John Smith' },
   *   { sNumber: 's150713', name: 'Jane Doe' },
   *   ...
   * ];
   * await StudentRegistrationHelper.addStudentBatch(students);
   */
  static async addStudentBatch(students) {
    try {
      console.log(`Adding ${students.length} students to Supabase...`);
      
      const results = [];
      
      // Process students one by one to handle potential duplicates gracefully
      for (const student of students) {
        try {
          // Check if student already exists
          const existingStudent = await SupabaseService.getStudent(student.sNumber);
          
          if (existingStudent) {
            console.log(`Student ${student.sNumber} already exists, skipping...`);
            results.push({ 
              sNumber: student.sNumber, 
              status: 'skipped', 
              reason: 'already exists' 
            });
            continue;
          }
          
          // Create new student
          const newStudent = await SupabaseService.createStudent({
            sNumber: student.sNumber.toLowerCase(),
            name: student.name || student.sNumber,
            totalHours: 0
          });
          
          results.push({ 
            sNumber: student.sNumber, 
            status: 'created', 
            data: newStudent 
          });
          
          console.log(`Created student: ${student.sNumber}`);
          
        } catch (error) {
          console.error(`Failed to create student ${student.sNumber}:`, error);
          results.push({ 
            sNumber: student.sNumber, 
            status: 'error', 
            error: error.message 
          });
        }
      }
      
      const successCount = results.filter(r => r.status === 'created').length;
      const skippedCount = results.filter(r => r.status === 'skipped').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      
      console.log(`Batch operation completed: ${successCount} created, ${skippedCount} skipped, ${errorCount} errors`);
      
      return results;
    } catch (error) {
      console.error('Error adding student batch:', error);
      throw error;
    }
  }
  
  /**
   * Get a list of all students in the system
   * 
   * @returns {Promise<Array>} - Array of student objects
   */
  static async getAllStudents() {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting all students:', error);
      throw error;
    }
  }
  
  /**
   * Check if a specific S-Number exists in the system
   * 
   * @param {string} sNumber - The S-Number to check
   * @returns {Promise<boolean>} - True if the S-Number exists, false otherwise
   */
  static async doesStudentExist(sNumber) {
    try {
      const student = await SupabaseService.getStudent(sNumber);
      return !!student;
    } catch (error) {
      console.error(`Error checking if student ${sNumber} exists:`, error);
      throw error;
    }
  }
  
  /**
   * Delete a student from the system
   * 
   * @param {string} sNumber - The S-Number of the student to delete
   * @returns {Promise<boolean>} - True if deletion was successful
   */
  static async deleteStudent(sNumber) {
    try {
      console.log(`Deleting student: ${sNumber}`);
      
      // First, delete from auth_users if exists
      const { error: authError } = await supabase
        .from('auth_users')
        .delete()
        .eq('s_number', sNumber.toLowerCase());
      
      if (authError) {
        console.log('Note: No auth record found for student (this is okay)');
      }
      
      // Then delete from students table
      const { error: studentError } = await supabase
        .from('students')
        .delete()
        .eq('s_number', sNumber.toLowerCase());
      
      if (studentError) {
        console.error('Error deleting student:', studentError);
        throw studentError;
      }
      
      console.log(`Student ${sNumber} deleted successfully`);
      return true;
    } catch (error) {
      console.error(`Error deleting student ${sNumber}:`, error);
      throw error;
    }
  }
  
  /**
   * Reset a student's password
   * 
   * @param {string} sNumber - The S-Number of the student
   * @returns {Promise<boolean>} - True if reset was successful
   */
  static async resetStudentPassword(sNumber) {
    try {
      console.log(`Resetting password for student: ${sNumber}`);
      
      // Check if student has an auth record
      const authUser = await SupabaseService.getAuthUser(sNumber);
      
      if (!authUser) {
        console.log(`Student ${sNumber} has no auth record - cannot reset password`);
        return false;
      }
      
      // Delete the auth record - student will need to re-register
      const { error } = await supabase
        .from('auth_users')
        .delete()
        .eq('s_number', sNumber.toLowerCase());
      
      if (error) {
        console.error('Error resetting password:', error);
        throw error;
      }
      
      // Update student status to indicate password reset needed
      await SupabaseService.updateStudent(sNumber, {
        account_status: 'password_reset_required',
        password_reset_at: new Date().toISOString()
      });
      
      console.log(`Password for student ${sNumber} reset successfully`);
      return true;
    } catch (error) {
      console.error(`Error resetting password for student ${sNumber}:`, error);
      throw error;
    }
  }

  /**
   * Get student statistics
   * 
   * @returns {Promise<Object>} - Statistics about students in the system
   */
  static async getStudentStats() {
    try {
      // Get total student count
      const { count: totalStudents, error: countError } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      // Get students with accounts
      const { count: studentsWithAccounts, error: accountsError } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('account_status', 'active');

      if (accountsError) throw accountsError;

      // Get total hours logged
      const { data: hoursData, error: hoursError } = await supabase
        .from('students')
        .select('total_hours');

      if (hoursError) throw hoursError;

      const totalHours = hoursData.reduce((sum, student) => 
        sum + parseFloat(student.total_hours || 0), 0
      );

      return {
        totalStudents: totalStudents || 0,
        studentsWithAccounts: studentsWithAccounts || 0,
        studentsWithoutAccounts: (totalStudents || 0) - (studentsWithAccounts || 0),
        totalHours: totalHours,
        averageHours: totalStudents > 0 ? totalHours / totalStudents : 0
      };
    } catch (error) {
      console.error('Error getting student stats:', error);
      throw error;
    }
  }

  /**
   * Import students from CSV data
   * 
   * @param {string} csvData - CSV data with headers: sNumber, name
   * @returns {Promise<Array>} - Results of the import operation
   */
  static async importStudentsFromCSV(csvData) {
    try {
      // Parse CSV data (simple implementation)
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const students = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const student = {};
        
        headers.forEach((header, index) => {
          student[header] = values[index];
        });
        
        if (student.sNumber) {
          students.push(student);
        }
      }
      
      console.log(`Parsed ${students.length} students from CSV`);
      
      // Use the existing addStudentBatch method
      return await this.addStudentBatch(students);
    } catch (error) {
      console.error('Error importing students from CSV:', error);
      throw error;
    }
  }

  /**
   * Export students to CSV format
   * 
   * @returns {Promise<string>} - CSV data string
   */
  static async exportStudentsToCSV() {
    try {
      const students = await this.getAllStudents();
      
      const headers = [
        'S-Number',
        'Name', 
        'Total Hours',
        'Account Status',
        'Account Created',
        'Last Login'
      ];
      
      const csvLines = [headers.join(',')];
      
      students.forEach(student => {
        const row = [
          student.s_number || '',
          `"${student.name || ''}"`,
          student.total_hours || '0',
          student.account_status || 'pending',
          student.account_created || '',
          student.last_login || ''
        ];
        csvLines.push(row.join(','));
      });
      
      return csvLines.join('\n');
    } catch (error) {
      console.error('Error exporting students to CSV:', error);
      throw error;
    }
  }

  /**
   * Get students who need account setup
   * 
   * @returns {Promise<Array>} - Students without active accounts
   */
  static async getStudentsNeedingAccountSetup() {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .neq('account_status', 'active')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting students needing account setup:', error);
      throw error;
    }
  }

  /**
   * Bulk update student information
   * 
   * @param {Array} updates - Array of {sNumber, updateData} objects
   * @returns {Promise<Array>} - Results of the update operations
   */
  static async bulkUpdateStudents(updates) {
    try {
      console.log(`Performing bulk update on ${updates.length} students...`);
      
      const results = [];
      
      for (const update of updates) {
        try {
          const updatedStudent = await SupabaseService.updateStudent(
            update.sNumber, 
            update.updateData
          );
          
          results.push({
            sNumber: update.sNumber,
            status: 'updated',
            data: updatedStudent
          });
          
        } catch (error) {
          console.error(`Failed to update student ${update.sNumber}:`, error);
          results.push({
            sNumber: update.sNumber,
            status: 'error',
            error: error.message
          });
        }
      }
      
      const successCount = results.filter(r => r.status === 'updated').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      
      console.log(`Bulk update completed: ${successCount} updated, ${errorCount} errors`);
      
      return results;
    } catch (error) {
      console.error('Error in bulk update:', error);
      throw error;
    }
  }
}

export default StudentRegistrationHelper;