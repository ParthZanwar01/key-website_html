import React, { useContext, useState, useEffect, createContext, useCallback } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HourContext = createContext();

// Google Sheets API endpoint for hour requests
const HOUR_REQUESTS_API_ENDPOINT = 'https://api.sheetbest.com/sheets/a13c2d54-fe27-4fbd-9fb6-2da4d0136928';
// Google Sheets API endpoint for students (to update hours)
const STUDENTS_API_ENDPOINT = 'https://api.sheetbest.com/sheets/216a1c49-0ea0-48d4-be6d-d9245fd7896e';

export function useHours() {
  return useContext(HourContext);
}

export function HourProvider({ children }) {
  const [hourRequests, setHourRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Load hour requests from Google Sheets
  const loadHourRequestsFromCloud = useCallback(async () => {
    try {
      console.log('Loading hour requests from Google Sheets...');
      const response = await axios.get(HOUR_REQUESTS_API_ENDPOINT);
      const cloudRequests = response.data || [];
      
      setHourRequests(cloudRequests);
      
      // Save to local storage as backup
      await AsyncStorage.setItem('hourRequests', JSON.stringify(cloudRequests));
      
      console.log(`Loaded ${cloudRequests.length} hour requests from cloud`);
      return cloudRequests;
    } catch (error) {
      console.error('Failed to load hour requests from cloud:', error);
      // Fallback to local storage if cloud fails
      try {
        const localRequests = await AsyncStorage.getItem('hourRequests');
        if (localRequests) {
          const parsed = JSON.parse(localRequests);
          setHourRequests(parsed);
          return parsed;
        }
      } catch (localError) {
        console.error('Failed to load local hour requests:', localError);
      }
      return [];
    }
  }, []);

  // Submit hour request
  const submitHourRequest = useCallback(async (requestData) => {
    try {
      console.log('Submitting hour request:', requestData);
      
      const hourRequestData = {
        id: Date.now().toString(),
        studentSNumber: requestData.studentSNumber,
        studentName: requestData.studentName,
        eventName: requestData.eventName,
        eventDate: requestData.eventDate,
        hoursRequested: requestData.hoursRequested,
        description: requestData.description,
        status: 'pending', // pending, approved, rejected
        submittedAt: new Date().toISOString(),
        reviewedAt: '',
        reviewedBy: '',
        adminNotes: ''
      };
      
      await axios.post(HOUR_REQUESTS_API_ENDPOINT, hourRequestData);
      console.log('Hour request submitted successfully');
      
      // Refresh requests from cloud
      await loadHourRequestsFromCloud();
      
    } catch (error) {
      console.error('Failed to submit hour request:', error);
      throw error;
    }
  }, [loadHourRequestsFromCloud]);

  // Update student's total hours
  const updateStudentHours = useCallback(async (sNumber, hoursToAdd) => {
    try {
      console.log('Starting updateStudentHours for:', sNumber, 'adding:', hoursToAdd);
      
      // Get all students
      const response = await axios.get(STUDENTS_API_ENDPOINT);
      const allStudents = response.data;
      
      console.log('Found', allStudents.length, 'students in sheet');
      
      // Find the student index
      const studentIndex = allStudents.findIndex(s => {
        const match = s.sNumber && s.sNumber.toLowerCase() === sNumber.toLowerCase();
        if (match) {
          console.log('Found matching student at index:', studentIndex, 'with data:', s);
        }
        return match;
      });
      
      if (studentIndex === -1) {
        console.error('Student not found in sheet:', sNumber);
        console.log('Available sNumbers:', allStudents.map(s => s.sNumber));
        throw new Error('Student not found');
      }
      
      const student = allStudents[studentIndex];
      console.log('Current student data:', student);
      
      // Parse current hours (handle both string and number, and undefined/null)
      let currentHours = 0;
      if (student.totalHours !== undefined && student.totalHours !== null && student.totalHours !== '') {
        currentHours = parseFloat(student.totalHours);
        if (isNaN(currentHours)) {
          console.warn('Invalid totalHours value:', student.totalHours, 'defaulting to 0');
          currentHours = 0;
        }
      }
      
      const newTotalHours = currentHours + parseFloat(hoursToAdd);
      
      console.log(`Updating hours: ${currentHours} + ${hoursToAdd} = ${newTotalHours}`);
      
      // Prepare update data
      const updateData = {
        totalHours: newTotalHours.toString(),
        lastHourUpdate: new Date().toISOString()
      };
      
      console.log('Sending update to index:', studentIndex, 'with data:', updateData);
      
      // Update the student's hours
      const updateResponse = await axios.patch(`${STUDENTS_API_ENDPOINT}/${studentIndex}`, updateData);
      
      console.log('Update response:', updateResponse.status, updateResponse.data);
      console.log(`Student ${sNumber} hours updated successfully: ${currentHours} -> ${newTotalHours}`);
      
      return true;
      
    } catch (error) {
      console.error('Failed to update student hours:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }, []);

  // Update hour request status (Admin only)
  const updateHourRequestStatus = useCallback(async (requestId, status, adminNotes = '', reviewedBy = 'Admin') => {
    try {
      console.log('Updating hour request status:', requestId, status);
      
      // Find the request index in Google Sheets
      const currentRequests = await loadHourRequestsFromCloud();
      const requestIndex = currentRequests.findIndex(r => r.id === requestId);
      
      if (requestIndex === -1) {
        throw new Error('Hour request not found');
      }
      
      const request = currentRequests[requestIndex];
      console.log('Found request to update:', request);
      
      const updatedRequest = {
        ...request,
        status: status,
        reviewedAt: new Date().toISOString(),
        reviewedBy: reviewedBy,
        adminNotes: adminNotes
      };
      
      // Update the request status first
      await axios.patch(`${HOUR_REQUESTS_API_ENDPOINT}/${requestIndex}`, updatedRequest);
      console.log('Hour request status updated successfully');
      
      // If approved, update student's total hours
      if (status === 'approved') {
        console.log('Request approved, updating student hours...');
        const hoursToAdd = parseFloat(request.hoursRequested);
        
        if (isNaN(hoursToAdd) || hoursToAdd <= 0) {
          console.error('Invalid hours requested:', request.hoursRequested);
          throw new Error('Invalid hours amount');
        }
        
        try {
          await updateStudentHours(request.studentSNumber, hoursToAdd);
          console.log('Student hours updated successfully');
        } catch (hourUpdateError) {
          console.error('Failed to update student hours, but request was approved:', hourUpdateError);
          // You might want to revert the request status here or handle this differently
          throw new Error('Request approved but failed to update student hours: ' + hourUpdateError.message);
        }
      }
      
      // Refresh requests from cloud
      await loadHourRequestsFromCloud();
      
      return true;
      
    } catch (error) {
      console.error('Failed to update hour request status:', error);
      throw error;
    }
  }, [loadHourRequestsFromCloud, updateStudentHours]);

  // Get student's current hours
  const getStudentHours = useCallback(async (sNumber) => {
    try {
      console.log('Getting hours for student:', sNumber);
      
      const response = await axios.get(STUDENTS_API_ENDPOINT);
      const allStudents = response.data;
      
      const student = allStudents.find(s => 
        s.sNumber && s.sNumber.toLowerCase() === sNumber.toLowerCase()
      );
      
      if (!student) {
        console.log('Student not found:', sNumber);
        return 0;
      }
      
      console.log('Found student:', student);
      
      // Parse hours safely
      let hours = 0;
      if (student.totalHours !== undefined && student.totalHours !== null && student.totalHours !== '') {
        hours = parseFloat(student.totalHours);
        if (isNaN(hours)) {
          console.warn('Invalid totalHours value:', student.totalHours);
          hours = 0;
        }
      }
      
      console.log('Returning hours:', hours);
      return hours;
    } catch (error) {
      console.error('Failed to get student hours:', error);
      return 0;
    }
  }, []);

  // Get pending requests for admin
  const getPendingRequests = useCallback(() => {
    return hourRequests.filter(request => request.status === 'pending');
  }, [hourRequests]);

  // Get student's hour requests
  const getStudentRequests = useCallback((sNumber) => {
    return hourRequests.filter(request => 
      request.studentSNumber && request.studentSNumber.toLowerCase() === sNumber.toLowerCase()
    ).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }, [hourRequests]);

  // Get all requests (admin view)
  const getAllRequests = useCallback(() => {
    return hourRequests.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }, [hourRequests]);

  // Initial load
  useEffect(() => {
    loadHourRequestsFromCloud().finally(() => {
      setLoading(false);
    });
  }, [loadHourRequestsFromCloud]);

  const contextValue = {
    hourRequests,
    loading,
    submitHourRequest,
    updateHourRequestStatus,
    getStudentHours,
    getPendingRequests,
    getStudentRequests,
    getAllRequests,
    refreshHourRequests: loadHourRequestsFromCloud
  };

  return (
    <HourContext.Provider value={contextValue}>
      {!loading && children}
    </HourContext.Provider>
  );
}