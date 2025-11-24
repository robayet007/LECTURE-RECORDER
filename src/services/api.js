// src/services/api.js
// const API_BASE_URL = 'http://3.27.83.67:5000/api'; // ❌ OLD - Mixed Content Error
const API_BASE_URL = '/api'; // ✅ NEW - Vercel Proxy

// Save recording to backend - Optimized for large files (2-3 hour recordings)
export const saveRecordingToServer = async (recordingData, audioBlob, onProgress) => {
  try {
    const formData = new FormData();
    
    // Add audio file
    formData.append('audio', audioBlob, 'recording.webm');
    
    // Add other data
    formData.append('title', recordingData.title);
    formData.append('notes', recordingData.notes);
    formData.append('duration', recordingData.duration);
    formData.append('noiseCancelled', recordingData.noiseCancelled.toString());
    formData.append('audioQuality', recordingData.audioQuality);
    formData.append('category', recordingData.category);

    // Use XMLHttpRequest for progress tracking on large files
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            resolve(result);
          } catch (e) {
            reject(new Error('Invalid response from server'));
          }
        } else {
          reject(new Error(`Server error: ${xhr.status} ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted'));
      });

      // Set timeout for very long uploads (2-3 hour files might take 10-15 minutes)
      xhr.timeout = 30 * 60 * 1000; // 30 minutes timeout
      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timeout - file too large or connection too slow'));
      });

      xhr.open('POST', `${API_BASE_URL}/recordings`);
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Error saving recording:', error);
    throw error;
  }
};

// Get all recordings from server
export const getAllRecordings = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/recordings`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch recordings');
    }

    const recordings = await response.json();
    return recordings;
  } catch (error) {
    console.error('Error fetching recordings:', error);
    throw error;
  }
};

// Delete recording from server
export const deleteRecording = async (recordingId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/recordings/${recordingId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete recording');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error deleting recording:', error);
    throw error;
  }
};