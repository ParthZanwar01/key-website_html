import React, { useContext, useState, useEffect, createContext, useCallback } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HourContext = createContext();

// Google Sheets API endpoint for hour requests
const HOUR_REQUESTS_API_ENDPOINT = 'https://api.sheetbest.com/sheets/a13c2d54-fe27-4fbd-9fb6-2da4d0136928';
// Google Sheets API endpoint for students (to update hours)
const STUDENTS_API_ENDPOINT = 'https://api.sheetbest.com/sheets/0b911400-5cc3-45c6-981e-dd6a551b3a5a';

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
        status: 'pending',
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
      console.log('Updating hours for student:', sNumber, 'adding:', hoursToAdd);
      
      // Get all students
      const response = await axios.get(STUDENTS_API_ENDPOINT);
      const allStudents = response.data;
      
      // Find the student index
      const studentIndex = allStudents.findIndex(s => {
        return s.sNumber && s.sNumber.toLowerCase() === sNumber.toLowerCase();
      });
      
      if (studentIndex === -1) {
        console.error('Student not found in sheet:', sNumber);
        throw new Error('Student not found');
      }
      
      const student = allStudents[studentIndex];
      console.log('Found student:', student.name, 'current hours:', student.totalHours);
      
      // Parse current hours safely
      let currentHours = 0;
      if (student.totalHours !== undefined && student.totalHours !== null && student.totalHours !== '') {
        currentHours = parseFloat(student.totalHours);
        if (isNaN(currentHours)) {
          console.warn('Invalid totalHours value, defaulting to 0');
          currentHours = 0;
        }
      }
      
      const hoursToAddFloat = parseFloat(hoursToAdd);
      if (isNaN(hoursToAddFloat)) {
        throw new Error('Invalid hours amount');
      }
      
      const newTotalHours = currentHours + hoursToAddFloat;
      console.log(`Updating hours: ${currentHours} + ${hoursToAddFloat} = ${newTotalHours}`);
      
      // Prepare update data with all required fields
      const updateData = {
        sNumber: student.sNumber,
        name: student.name,
        password: student.password,
        totalHours: newTotalHours.toString(),
        lastLogin: student.lastLogin,
        lastHourUpdate: new Date().toISOString(),
        accountCreated: student.accountCreated,
        id: student.id
      };
      
      // Use PATCH to update the student record
      const updateResponse = await axios.patch(`${STUDENTS_API_ENDPOINT}/${studentIndex}`, updateData);
      console.log('Hours updated successfully via PATCH');
      
      // Wait for API to process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Student hours update completed');
      return true;
      
    } catch (error) {
      console.error('Failed to update student hours:', error);
      throw error;
    }
  }, []);

  // Update hour request status (Admin only)
  const updateHourRequestStatus = useCallback(async (requestId, status, adminNotes = '', reviewedBy = 'Admin') => {
    try {
      console.log('Updating hour request status:', requestId, 'to:', status);
      
      // Get current requests from the API (fresh data)
      const currentResponse = await axios.get(HOUR_REQUESTS_API_ENDPOINT);
      const currentRequests = currentResponse.data || [];
      
      // Find the request index in Google Sheets
      const requestIndex = currentRequests.findIndex(r => r.id === requestId);
      
      if (requestIndex === -1) {
        throw new Error('Hour request not found');
      }
      
      const request = currentRequests[requestIndex];
      
      // Check if request is already processed to prevent duplicate processing
      if (request.status && request.status.toLowerCase() !== 'pending') {
        console.log('Request already processed with status:', request.status);
        throw new Error(`Request already ${request.status}. Please refresh to see current status.`);
      }
      
      // Normalize status to ensure consistency
      const normalizedStatus = status.toLowerCase();
      const finalStatus = normalizedStatus === 'approve' ? 'approved' : 
                         normalizedStatus === 'reject' ? 'rejected' : normalizedStatus;
      
      const updatedRequest = {
        id: request.id || '',
        studentSNumber: request.studentSNumber || '',
        studentName: request.studentName || '',
        eventName: request.eventName || '',
        eventDate: request.eventDate || '',
        hoursRequested: request.hoursRequested || '',
        description: request.description || '',
        status: finalStatus,
        submittedAt: request.submittedAt || '',
        reviewedAt: new Date().toISOString(),
        reviewedBy: reviewedBy,
        adminNotes: adminNotes || ''
      };
      
      // Update the request status first
      await axios.patch(`${HOUR_REQUESTS_API_ENDPOINT}/${requestIndex}`, updatedRequest);
      console.log('Request status updated successfully');
      
      // Wait for API to process the status update
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // If approved, update student's total hours
      if (finalStatus === 'approved') {
        console.log('Request approved - updating student hours...');
        const hoursToAdd = parseFloat(request.hoursRequested);
        
        if (isNaN(hoursToAdd) || hoursToAdd <= 0) {
          throw new Error('Invalid hours amount');
        }
        
        try {
          await updateStudentHours(request.studentSNumber, hoursToAdd);
          console.log('Student hours updated successfully');
        } catch (hourUpdateError) {
          console.error('Failed to update student hours:', hourUpdateError);
          
          // Revert the request status since hours update failed
          try {
            await axios.patch(`${HOUR_REQUESTS_API_ENDPOINT}/${requestIndex}`, {
              ...updatedRequest,
              status: 'pending',
              reviewedAt: '',
              reviewedBy: '',
              adminNotes: 'Hours update failed - reverted to pending'
            });
          } catch (revertError) {
            console.error('Failed to revert request status:', revertError);
          }
          
          throw new Error('Request approved but failed to update student hours: ' + hourUpdateError.message);
        }
      }
      
      // Update local state immediately to reflect changes
      setHourRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === requestId 
            ? { ...req, ...updatedRequest }
            : req
        )
      );
      
      // Wait a bit more and refresh from cloud to ensure sync
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadHourRequestsFromCloud();
      
      console.log('Hour request status update completed successfully');
      return true;
      
    } catch (error) {
      console.error('Failed to update hour request status:', error);
      throw error;
    }
  }, [loadHourRequestsFromCloud, updateStudentHours]);

  // Get student's current hours
  const getStudentHours = useCallback(async (sNumber) => {
    try {
      const response = await axios.get(STUDENTS_API_ENDPOINT);
      const allStudents = response.data;
      
      const student = allStudents.find(s => 
        s.sNumber && s.sNumber.toLowerCase() === sNumber.toLowerCase()
      );
      
      if (!student) {
        console.log('Student not found:', sNumber);
        return 0;
      }
      
      // Parse hours safely
      let hours = 0;
      if (student.totalHours !== undefined && student.totalHours !== null && student.totalHours !== '') {
        hours = parseFloat(student.totalHours);
        if (isNaN(hours)) {
          console.warn('Invalid totalHours value:', student.totalHours);
          hours = 0;
        }
      }
      
      return hours;
    } catch (error) {
      console.error('Failed to get student hours:', error);
      return 0;
    }
  }, []);

  // Get pending requests for admin
  const getPendingRequests = useCallback(() => {
    return hourRequests.filter(request => {
      const status = request.status?.toLowerCase();
      return status === 'pending' || !status;
    });
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