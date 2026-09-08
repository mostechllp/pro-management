// src/hooks/usePreferences.js
import { useSelector } from 'react-redux';
import { useEffect } from 'react';

export const usePreferences = () => {
  const { preferences } = useSelector((state) => state.settings);
  
  // Sync preferences to localStorage when they change
  useEffect(() => {
    if (preferences) {
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
    }
  }, [preferences]);
  
  return preferences;
};