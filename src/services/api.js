// src/services/api.js
const API_BASE_URL = 'http://3.27.83.67:5000/api';

// Save recording to backend
export const saveRecordingToServer = async (recordingData, audioBlob) => {
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

    const response = await fetch(`${API_BASE_URL}/recordings`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to save recording to server');
    }

    const result = await response.json();
    return result;
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