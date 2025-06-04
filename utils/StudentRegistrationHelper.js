import axios from 'axios';

// Constants
const SHEET_API_URL = 'https://api.sheetbest.com/sheets/5cffbe63-c25b-4fb8-b66b-8d86bf1450b6';

/**
 * Helper utility for populating and managing student records in Google Sheets
 */
class StudentRegistrationHelper {
  /**
   * Add a batch of students to the Google Sheet
   * 
   * @param {Array} students - Array of student objects containing sNumber and optionally name
   * @returns {Promise<Array>} - The response from the Google Sheet API
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
      // Format students to match sheet structure
      const formattedStudents = students.map(student => ({
        sNumber: student.sNumber.toLowerCase(),
        name: student.name || student.sNumber,
        registered: new Date().toISOString(),
        lastLogin: '',
        password: '' // Will be set by the student on first login
      }));
      
      // Use Promise.all to handle multiple POST requests
      const responses = await Promise.all(
        formattedStudents.map(student => axios.post(SHEET_API_URL, student))
      );
      
      console.log(`Added ${responses.length} students to the system`);
      return responses.map(response => response.data);
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
      const response = await axios.get(SHEET_API_URL);
      return response.data;
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
      const formattedSNumber = sNumber.toLowerCase();
      const response = await axios.get(`${SHEET_API_URL}/search?sNumber=${formattedSNumber}`);
      return response.data.length > 0;
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
      const formattedSNumber = sNumber.toLowerCase();
      
      // Get all students
      const allStudents = await this.getAllStudents();
      
      // Find student index
      const studentIndex = allStudents.findIndex(
        student => student.sNumber && student.sNumber.toLowerCase() === formattedSNumber
      );
      
      if (studentIndex === -1) {
        console.log(`Student ${sNumber} not found for deletion`);
        return false;
      }
      
      // Delete the student at this index
      await axios.delete(`${SHEET_API_URL}/${studentIndex}`);
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
      const formattedSNumber = sNumber.toLowerCase();
      
      // Get all students
      const allStudents = await this.getAllStudents();
      
      // Find student index
      const studentIndex = allStudents.findIndex(
        student => student.sNumber && student.sNumber.toLowerCase() === formattedSNumber
      );
      
      if (studentIndex === -1) {
        console.log(`Student ${sNumber} not found for password reset`);
        return false;
      }
      
      // Reset the password field
      await axios.patch(`${SHEET_API_URL}/${studentIndex}`, {
        password: '' // Clear the password
      });
      
      console.log(`Password for student ${sNumber} reset successfully`);
      return true;
    } catch (error) {
      console.error(`Error resetting password for student ${sNumber}:`, error);
      throw error;
    }
  }
}

export default StudentRegistrationHelper;