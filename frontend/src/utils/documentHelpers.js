// Helper function to get the document view URL
export const getDocumentViewUrl = (docId) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return `${apiUrl}/documents/${docId}/view`;
};

// Helper function to open document in new tab
export const viewDocumentInNewTab = (docId) => {
  const url = getDocumentViewUrl(docId);
  console.log('Opening document URL:', url);
  
  // Open in new tab
  const newWindow = window.open(url, '_blank');
  
  // If popup blocked, show message
  if (!newWindow) {
    alert('Please allow popups for this site to view documents');
  }
};

import apiClient from "../services/apiClient";

// View in a new tab
export const viewDoc = async (docId) => {
  // Open synchronously inside the click so popup blockers allow it
  const tab = window.open("", "_blank");
  try {
    const { data } = await apiClient.get(`/documents/${docId}/view`);
    if (tab) tab.location.href = data.url;
    else window.location.href = data.url; // popup blocked fallback
  } catch (error) {
    tab?.close();
    throw error;
  }
};

// Download (ImageKit's ?ik-attachment=true forces a download with the real filename)
export const downloadDocument = async (docId) => {
  const { data } = await apiClient.get(`/documents/${docId}/download`);
  const a = document.createElement("a");
  a.href = data.url;
  document.body.appendChild(a);
  a.click();
  a.remove();
};