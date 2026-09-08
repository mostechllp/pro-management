// src/utils/dateUtils.js
import { format } from 'date-fns';

// Get date format from localStorage or use default
export const getDateFormat = () => {
  const preferences = localStorage.getItem('userPreferences');
  if (preferences) {
    try {
      const parsed = JSON.parse(preferences);
      return parsed.dateFormat || 'dd MMM yyyy';
    } catch {
      return 'dd MMM yyyy';
    }
  }
  return 'dd MMM yyyy';
};

// Format a date using the user's preferred format
export const formatDate = (date, formatStr = null) => {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return 'N/A';
  
  const dateFormat = formatStr || getDateFormat();
  
  // Map format strings to date-fns compatible formats
  const formatMap = {
    'dd MMM yyyy': 'dd MMM yyyy',
    'MM/dd/yyyy': 'MM/dd/yyyy',
    'yyyy-MM-dd': 'yyyy-MM-dd',
  };
  
  const finalFormat = formatMap[dateFormat] || 'dd MMM yyyy';
  return format(dateObj, finalFormat);
};

// Format date for display with time
export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return 'N/A';
  return format(dateObj, `${getDateFormat()} HH:mm`);
};

// Format relative time (e.g., "2 days ago")
export const formatRelativeTime = (date) => {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return 'N/A';
  return format(dateObj, 'dd MMM yyyy');
};

// Get days left until expiry
export const getDaysLeft = (expiryDate) => {
  if (!expiryDate) return null;
  const now = new Date();
  const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
  const diffTime = expiry - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Format days left as a string
export const formatDaysLeft = (daysLeft) => {
  if (daysLeft === null || daysLeft === undefined) return 'N/A';
  if (daysLeft < 0) return `${Math.abs(daysLeft)} days overdue`;
  if (daysLeft === 0) return 'Today';
  if (daysLeft === 1) return '1 day';
  return `${daysLeft} days`;
};