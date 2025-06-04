// contexts/HourContext.js
import React, { useContext, useState, useEffect, createContext, useCallback } from 'react';
import SupabaseService from '../services/SupabaseService';

const HourContext = createContext();

export function useHours() {
  return useContext(HourContext);
}

export function HourProvider({ children }) {
  const [hourRequests, setHourRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const loadHourRequests = useCallback(async () => {
    try {
      console.log('Loading hour requests from Supabase...');
      const requests = await SupabaseService.getAllHourRequests();
      setHourRequests(requests);
      console.log(`Loaded ${requests.length} hour requests`);
    } catch (error) {
      console.error('Failed to load hour requests:', error);
    }
  }, []);

  const submitHourRequest = useCallback(async (requestData) => {
    try {
      await SupabaseService.submitHourRequest(requestData);
      await loadHourRequests();
    } catch (error) {
      console.error('Failed to submit hour request:', error);
      throw error;
    }
  }, [loadHourRequests]);

  const updateHourRequestStatus = useCallback(async (requestId, status, adminNotes = '', reviewedBy = 'Admin') => {
    try {
      await SupabaseService.updateHourRequestStatus(requestId, status, adminNotes, reviewedBy);
      await loadHourRequests();
      return true;
    } catch (error) {
      console.error('Failed to update hour request status:', error);
      throw error;
    }
  }, [loadHourRequests]);

  const getStudentHours = useCallback(async (sNumber) => {
    try {
      const student = await SupabaseService.getStudent(sNumber);
      return student ? parseFloat(student.total_hours || 0) : 0;
    } catch (error) {
      console.error('Failed to get student hours:', error);
      return 0;
    }
  }, []);

  const getPendingRequests = useCallback(() => {
    return hourRequests.filter(request => request.status === 'pending');
  }, [hourRequests]);

  const getStudentRequests = useCallback((sNumber) => {
    return hourRequests
      .filter(request => request.student_s_number === sNumber.toLowerCase())
      .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
  }, [hourRequests]);

  const getAllRequests = useCallback(() => {
    return hourRequests.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
  }, [hourRequests]);

  useEffect(() => {
    loadHourRequests().finally(() => {
      setLoading(false);
    });
  }, [loadHourRequests]);

  const contextValue = {
    hourRequests,
    loading,
    submitHourRequest,
    updateHourRequestStatus,
    getStudentHours,
    getPendingRequests,
    getStudentRequests,
    getAllRequests,
    refreshHourRequests: loadHourRequests
  };

  return (
    <HourContext.Provider value={contextValue}>
      {!loading && children}
    </HourContext.Provider>
  );
}