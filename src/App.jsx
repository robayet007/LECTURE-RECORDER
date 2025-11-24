import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AudioRecorder from './components/AudioRecorder';
import LectureList from './components/LectureList';
import { getAllRecordings, deleteRecording } from './services/api';

function App() {
  const [savedLectures, setSavedLectures] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load recordings from MongoDB on component mount
  useEffect(() => {
    loadRecordingsFromServer();
  }, []);

  const loadRecordingsFromServer = async () => {
    try {
      setLoading(true);
      const recordings = await getAllRecordings();
      console.log('Loaded recordings from server:', recordings);
      
      // Transform MongoDB data to frontend format
      const formattedRecordings = recordings.map(recording => ({
        id: recording._id || recording.id,
        title: recording.title,
        duration: recording.duration,
        date: recording.recordingDate 
          ? new Date(recording.recordingDate).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : recording.date,
        audioUrl: recording.audioUrl 
          ? (recording.audioUrl.startsWith('http') 
              ? recording.audioUrl 
              : recording.audioUrl.startsWith('/')
                ? recording.audioUrl  // Already has leading slash, use as-is (goes through Vercel proxy)
                : `/${recording.audioUrl}`)  // Add leading slash for Vercel proxy
          : null,
        notes: recording.notes,
        noiseCancelled: recording.noiseCancelled,
        audioQuality: recording.audioQuality
      }));
      
      setSavedLectures(formattedRecordings);
    } catch (error) {
      console.error('Error loading recordings:', error);
      // If API fails, try to load from localStorage as fallback
      const storedLectures = localStorage.getItem('savedLectures');
      if (storedLectures) {
        setSavedLectures(JSON.parse(storedLectures));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLecture = (newLecture) => {
    // Add new lecture to the list
    setSavedLectures(prev => [newLecture, ...prev]);
    
    // Also save to localStorage as backup
    const updatedLectures = [newLecture, ...savedLectures];
    localStorage.setItem('savedLectures', JSON.stringify(updatedLectures));
  };

  const handleDeleteLecture = async (lectureId) => {
    try {
      // Delete from backend
      await deleteRecording(lectureId);
      
      // Update local state
      setSavedLectures(prev => prev.filter(lecture => lecture.id !== lectureId));
      
      // Update localStorage
      const updatedLectures = savedLectures.filter(lecture => lecture.id !== lectureId);
      localStorage.setItem('savedLectures', JSON.stringify(updatedLectures));
      
      console.log('✅ Lecture deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting lecture:', error);
      alert('Failed to delete lecture from server');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-xl font-semibold text-gray-700">Loading your lectures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <AudioRecorder onSaveLecture={handleSaveLecture} />
      <LectureList 
        savedLectures={savedLectures} 
        onDeleteLecture={handleDeleteLecture}
        onSaveLecture={handleSaveLecture}
      />
    </div>
  );
}

export default App;