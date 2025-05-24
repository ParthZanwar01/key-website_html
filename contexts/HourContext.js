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
      console.log('🔄 Loading hour requests from Google Sheets...');
      const response = await axios.get(HOUR_REQUESTS_API_ENDPOINT);
      const cloudRequests = response.data || [];
      
      setHourRequests(cloudRequests);
      
      // Save to local storage as backup
      await AsyncStorage.setItem('hourRequests', JSON.stringify(cloudRequests));
      
      console.log(`✅ Loaded ${cloudRequests.length} hour requests from cloud`);
      return cloudRequests;
    } catch (error) {
      console.error('❌ Failed to load hour requests from cloud:', error);
      // Fallback to local storage if cloud fails
      try {
        const localRequests = await AsyncStorage.getItem('hourRequests');
        if (localRequests) {
          const parsed = JSON.parse(localRequests);
          setHourRequests(parsed);
          return parsed;
        }
      } catch (localError) {
        console.error('❌ Failed to load local hour requests:', localError);
      }
      return [];
    }
  }, []);

  // Submit hour request
  const submitHourRequest = useCallback(async (requestData) => {
    try {
      console.log('📝 Submitting hour request:', requestData);
      
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
      console.log('✅ Hour request submitted successfully');
      
      // Refresh requests from cloud
      await loadHourRequestsFromCloud();
      
    } catch (error) {
      console.error('❌ Failed to submit hour request:', error);
      throw error;
    }
  }, [loadHourRequestsFromCloud]);

  // Update student's total hours - WITH EXTENSIVE DEBUGGING
  const updateStudentHours = useCallback(async (sNumber, hoursToAdd) => {
    try {
      console.log('🎯 === STARTING updateStudentHours ===');
      console.log('📊 Student:', sNumber);
      console.log('➕ Hours to add:', hoursToAdd, '(type:', typeof hoursToAdd, ')');
      
      // Get all students
      console.log('📋 Fetching all students from:', STUDENTS_API_ENDPOINT);
      const response = await axios.get(STUDENTS_API_ENDPOINT);
      const allStudents = response.data;
      
      console.log('👥 Total students found:', allStudents.length);
      console.log('📝 First few students:', allStudents.slice(0, 3).map(s => ({
        sNumber: s.sNumber,
        name: s.name,
        totalHours: s.totalHours
      })));
      
      // Find the student index
      const studentIndex = allStudents.findIndex(s => {
        const match = s.sNumber && s.sNumber.toLowerCase() === sNumber.toLowerCase();
        if (match) {
          console.log('🎯 Found matching student at index:', studentIndex);
          console.log('👤 Student data:', s);
        }
        return match;
      });
      
      if (studentIndex === -1) {
        console.error('❌ Student not found in sheet:', sNumber);
        console.log('📝 Available sNumbers:', allStudents.map(s => s.sNumber));
        throw new Error('Student not found');
      }
      
      const student = allStudents[studentIndex];
      console.log('📊 Current student record:', student);
      
      // Parse current hours safely
      let currentHours = 0;
      console.log('🔍 Raw totalHours value:', student.totalHours, '(type:', typeof student.totalHours, ')');
      
      if (student.totalHours !== undefined && student.totalHours !== null && student.totalHours !== '') {
        currentHours = parseFloat(student.totalHours);
        if (isNaN(currentHours)) {
          console.warn('⚠️ Invalid totalHours value:', student.totalHours, 'defaulting to 0');
          currentHours = 0;
        }
      }
      
      const hoursToAddFloat = parseFloat(hoursToAdd);
      if (isNaN(hoursToAddFloat)) {
        console.error('❌ Invalid hoursToAdd value:', hoursToAdd);
        throw new Error('Invalid hours amount');
      }
      
      const newTotalHours = currentHours + hoursToAddFloat;
      
      console.log('🧮 CALCULATION:');
      console.log('   Current hours:', currentHours);
      console.log('   Hours to add:', hoursToAddFloat);
      console.log('   New total:', newTotalHours);
      
      // Prepare update data - ONLY updating the necessary fields
      const updateData = {
        totalHours: newTotalHours.toString(),
        lastHourUpdate: new Date().toISOString()
      };
      
      console.log('📤 Update data to send:', updateData);
      console.log('🌐 Update URL:', `${STUDENTS_API_ENDPOINT}/${studentIndex}`);
      
      // Update the student's hours
      const updateResponse = await axios.patch(`${STUDENTS_API_ENDPOINT}/${studentIndex}`, updateData);
      
      console.log('✅ UPDATE RESPONSE:');
      console.log('   Status:', updateResponse.status);
      console.log('   Data:', updateResponse.data);
      
      // Wait a moment for the API to process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify the update by fetching the student again
      console.log('🔍 VERIFYING UPDATE...');
      const verifyResponse = await axios.get(STUDENTS_API_ENDPOINT);
      const updatedStudents = verifyResponse.data;
      const updatedStudent = updatedStudents[studentIndex];
      
      console.log('🎯 VERIFICATION RESULT:');
      console.log('   Student after update:', updatedStudent);
      console.log('   New totalHours value:', updatedStudent.totalHours);
      console.log('   Expected:', newTotalHours.toString());
      console.log('   Match:', updatedStudent.totalHours === newTotalHours.toString());
      
      if (updatedStudent.totalHours !== newTotalHours.toString()) {
        console.error('❌ HOURS UPDATE FAILED!');
        console.error('   Expected:', newTotalHours.toString());
        console.error('   Actual:', updatedStudent.totalHours);
        throw new Error('Hours update verification failed');
      }
      
      console.log('🎉 === updateStudentHours COMPLETED SUCCESSFULLY ===');
      return true;
      
    } catch (error) {
      console.error('💥 === updateStudentHours FAILED ===');
      console.error('❌ Error:', error.message);
      console.error('📱 Response:', error.response?.data);
      console.error('🔢 Status:', error.response?.status);
      console.error('🔧 Stack:', error.stack);
      throw error;
    }
  }, []);

  // Update hour request status (Admin only) - WITH EXTENSIVE DEBUGGING
  const updateHourRequestStatus = useCallback(async (requestId, status, adminNotes = '', reviewedBy = 'Admin') => {
    try {
      console.log('🚀 === STARTING updateHourRequestStatus ===');
      console.log('🆔 Request ID:', requestId);
      console.log('📊 Status:', status);
      console.log('📝 Admin notes:', adminNotes);
      console.log('👤 Reviewed by:', reviewedBy);
      
      // Find the request index in Google Sheets
      const currentRequests = await loadHourRequestsFromCloud();
      const requestIndex = currentRequests.findIndex(r => r.id === requestId);
      
      if (requestIndex === -1) {
        console.error('❌ Hour request not found:', requestId);
        throw new Error('Hour request not found');
      }
      
      const request = currentRequests[requestIndex];
      console.log('📋 Found request to update:', request);
      
      const updatedRequest = {
        id: request.id || '',
        studentSNumber: request.studentSNumber || '',
        studentName: request.studentName || '',
        eventName: request.eventName || '',
        eventDate: request.eventDate || '',
        hoursRequested: request.hoursRequested || '',
        description: request.description || '',
        status: status,
        submittedAt: request.submittedAt || '',
        reviewedAt: new Date().toISOString(),
        reviewedBy: reviewedBy,
        adminNotes: adminNotes || ''
      };
      
      console.log('📤 Updating request with data:', updatedRequest);
      console.log('🌐 Update URL:', `${HOUR_REQUESTS_API_ENDPOINT}/${requestIndex}`);
      
      // Update the request status first
      const requestUpdateResponse = await axios.patch(`${HOUR_REQUESTS_API_ENDPOINT}/${requestIndex}`, updatedRequest);
      console.log('✅ Request status updated, response:', requestUpdateResponse.status);
      
      // Wait for API to process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // If approved, update student's total hours
      if (status === 'approved') {
        console.log('🎯 Request APPROVED - updating student hours...');
        const hoursToAdd = parseFloat(request.hoursRequested);
        
        if (isNaN(hoursToAdd) || hoursToAdd <= 0) {
          console.error('❌ Invalid hours requested:', request.hoursRequested);
          throw new Error('Invalid hours amount');
        }
        
        console.log('➕ Adding', hoursToAdd, 'hours to student', request.studentSNumber);
        
        try {
          await updateStudentHours(request.studentSNumber, hoursToAdd);
          console.log('🎉 Student hours updated successfully!');
        } catch (hourUpdateError) {
          console.error('💥 Failed to update student hours:', hourUpdateError);
          // Revert the request status since hours update failed
          console.log('🔄 Reverting request status due to hours update failure...');
          await axios.patch(`${HOUR_REQUESTS_API_ENDPOINT}/${requestIndex}`, {
            ...updatedRequest,
            status: 'pending',
            reviewedAt: '',
            reviewedBy: '',
            adminNotes: 'Hours update failed - reverted to pending'
          });
          throw new Error('Request approved but failed to update student hours: ' + hourUpdateError.message);
        }
      }
      
      // Update local state immediately
      setHourRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === requestId 
            ? { ...req, ...updatedRequest }
            : req
        )
      );
      
      // Wait and refresh from cloud
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadHourRequestsFromCloud();
      
      console.log('🎉 === updateHourRequestStatus COMPLETED SUCCESSFULLY ===');
      return true;
      
    } catch (error) {
      console.error('💥 === updateHourRequestStatus FAILED ===');
      console.error('❌ Error:', error.message);
      console.error('📱 Response:', error.response?.data);
      console.error('🔢 Status:', error.response?.status);
      throw error;
    }
  }, [loadHourRequestsFromCloud, updateStudentHours]);

  // Get student's current hours
  const getStudentHours = useCallback(async (sNumber) => {
    try {
      console.log('📊 Getting hours for student:', sNumber);
      
      const response = await axios.get(STUDENTS_API_ENDPOINT);
      const allStudents = response.data;
      
      const student = allStudents.find(s => 
        s.sNumber && s.sNumber.toLowerCase() === sNumber.toLowerCase()
      );
      
      if (!student) {
        console.log('❌ Student not found:', sNumber);
        return 0;
      }
      
      console.log('👤 Found student:', student);
      
      // Parse hours safely
      let hours = 0;
      if (student.totalHours !== undefined && student.totalHours !== null && student.totalHours !== '') {
        hours = parseFloat(student.totalHours);
        if (isNaN(hours)) {
          console.warn('⚠️ Invalid totalHours value:', student.totalHours);
          hours = 0;
        }
      }
      
      console.log('📊 Returning hours:', hours);
      return hours;
    } catch (error) {
      console.error('❌ Failed to get student hours:', error);
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