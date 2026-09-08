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

export const viewDoc = async (docId, fileName = 'document') => {
  try {
    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const url = `${apiUrl}/documents/${docId}/download`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to download document');
    }
    
    // Handle redirect response from backend
    if (response.redirected) {
      // Open the redirected URL in a new tab for download
      window.open(response.url, '_blank');
      return;
    }
    
    // If backend returns the file directly (proxy approach)
    const blob = await response.blob();
    
    // Determine file extension from content-type
    const contentType = response.headers.get('content-type') || '';
    let extension = 'pdf';
    if (contentType.includes('image/jpeg')) extension = 'jpg';
    else if (contentType.includes('image/png')) extension = 'png';
    else if (contentType.includes('application/pdf')) extension = 'pdf';
    
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${fileName || 'document'}.${extension}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
};

// Helper function to download document
export const downloadDocument = async (docId) => {
  try {
    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const url = `${apiUrl}/documents/${docId}/view`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to download document');
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `document-${docId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
};