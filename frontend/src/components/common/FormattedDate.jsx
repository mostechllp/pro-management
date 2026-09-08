// src/components/Common/FormattedDate.jsx
import React from 'react';
import { formatDate } from '../../utils/dateUtils';
import { usePreferences } from '../../hooks/usePreferences';

const FormattedDate = ({ date, format: customFormat, className = '' }) => {
  const preferences = usePreferences();
  
  if (!date) return <span className={className}>N/A</span>;
  
  const formatted = formatDate(date, customFormat || preferences?.dateFormat);
  return <span className={className}>{formatted}</span>;
};

export default FormattedDate;