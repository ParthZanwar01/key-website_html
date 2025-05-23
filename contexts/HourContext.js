import React, { useContext, useState, useEffect, createContext, useCallback } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HourContext = createContext();

// Google Sheets API endpoint for hour requests - REPLACE WITH YOUR ACTUAL SHEET ID
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
      
      const updatedRequest = {
        ...currentRequests[requestIndex],
        status: status,
        reviewedAt: new Date().toISOString(),
        reviewedBy: reviewedBy,
        adminNotes: adminNotes
      };
      
      await axios.patch(`${HOUR_REQUESTS_API_ENDPOINT}/${requestIndex}`, updatedRequest);
      console.log('Hour request status updated successfully');
      
      // If approved, update student's total hours
      if (status === 'approved') {
        await updateStudentHours(
          currentRequests[requestIndex].studentSNumber, 
          parseFloat(currentRequests[requestIndex].hoursRequested)
        );
      }
      
      // Refresh requests from cloud
      await loadHourRequestsFromCloud();
      
    } catch (error) {
      console.error('Failed to update hour request status:', error);
      throw error;
    }
  }, [loadHourRequestsFromCloud]);

  // Update student's total hours
  const updateStudentHours = useCallback(async (sNumber, hoursToAdd) => {
    try {
      console.log('Updating student hours:', sNumber, hoursToAdd);
      
      // Get all students
      const response = await axios.get(STUDENTS_API_ENDPOINT);
      const allStudents = response.data;
      
      // Find the student index
      const studentIndex = allStudents.findIndex(s => 
        s.sNumber && s.sNumber.toLowerCase() === sNumber.toLowerCase()
      );
      
      if (studentIndex === -1) {
        throw new Error('Student not found');
      }
      
      const currentHours = parseFloat(allStudents[studentIndex].totalHours || 0);
      const newTotalHours = currentHours + hoursToAdd;
      
      await axios.patch(`${STUDENTS_API_ENDPOINT}/${studentIndex}`, {
        totalHours: newTotalHours.toString(),
        lastHourUpdate: new Date().toISOString()
      });
      
      console.log(`Student ${sNumber} hours updated: ${currentHours} -> ${newTotalHours}`);
      
    } catch (error) {
      console.error('Failed to update student hours:', error);
      throw error;
    }
  }, []);

  // Get student's current hours
  const getStudentHours = useCallback(async (sNumber) => {
    try {
      const response = await axios.get(STUDENTS_API_ENDPOINT);
      const allStudents = response.data;
      
      const student = allStudents.find(s => 
        s.sNumber && s.sNumber.toLowerCase() === sNumber.toLowerCase()
      );
      
      return student ? parseFloat(student.totalHours || 0) : 0;
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