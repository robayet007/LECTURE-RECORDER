import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Clock, Calendar, Volume2, SkipBack, SkipForward, RotateCcw, Trash2, Lock, Plus, X, Upload } from 'lucide-react';
import { saveRecordingToServer } from '../services/api';

const LectureList = ({ savedLectures, onDeleteLecture, onSaveLecture }) => {
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [lectureToDelete, setLectureToDelete] = useState(null);
  const [showAddLectureModal, setShowAddLectureModal] = useState(false);
  const [newLectureTitle, setNewLectureTitle] = useState('');
  const [newLectureNotes, setNewLectureNotes] = useState('');
  const [newLectureAudio, setNewLectureAudio] = useState(null);
  const [newLectureDuration, setNewLectureDuration] = useState('00:00');
  const [isSavingNewLecture, setIsSavingNewLecture] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saveStatus, setSaveStatus] = useState('');
  const audioRefs = useRef({});

  const handlePlayPause = (lectureId) => {
    const audioElement = audioRefs.current[lectureId];
    const lecture = savedLectures.find(l => l.id === lectureId);

    // Check if audio URL exists
    if (!lecture?.audioUrl) {
      alert('❌ Audio file not available for this lecture');
      return;
    }

    if (!audioElement) {
      console.error('Audio element not found for lecture:', lectureId);
      alert('❌ Audio player not initialized. Please refresh the page.');
      return;
    }

    if (playingAudio === lectureId) {
      audioElement.pause();
      setPlayingAudio(null);
    } else {
      // Stop any currently playing audio
      if (playingAudio) {
        const currentAudio = audioRefs.current[playingAudio];
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
      }

      // Check if audio is ready
      if (audioElement.readyState < 2) {
        console.log('⏳ Audio loading...', lecture?.audioUrl);
        audioElement.addEventListener('canplay', () => {
          console.log('✅ Audio ready to play');
        }, { once: true });
      }

      // Play new audio with error handling
      const playPromise = audioElement.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setPlayingAudio(lectureId);
            console.log('✅ Audio playing:', lecture?.title, 'URL:', lecture?.audioUrl);
          })
          .catch((error) => {
            console.error('❌ Audio play error:', error);
            console.error('Audio URL:', lecture?.audioUrl);
            console.error('Audio element:', audioElement);
            alert(`❌ Cannot play audio: ${error.message || 'Audio file may be corrupted or unavailable'}\n\nURL: ${lecture?.audioUrl}`);
          });
      } else {
        setPlayingAudio(lectureId);
      }
    }
  };

  const handleTimeUpdate = (lectureId) => {
    const audioElement = audioRefs.current[lectureId];
    if (audioElement && playingAudio === lectureId && !isSeeking) {
      setCurrentTime(audioElement.currentTime);
      setDuration(audioElement.duration || 0);
    }
  };

  const handleLoadedMetadata = (lectureId) => {
    const audioElement = audioRefs.current[lectureId];
    if (audioElement) {
      setDuration(audioElement.duration);
    }
  };

  const handleSeek = (event) => {
    const audioElement = audioRefs.current[selectedLecture.id];
    if (audioElement && duration) {
      const seekTime = (event.target.value / 100) * duration;
      setCurrentTime(seekTime);
      audioElement.currentTime = seekTime;
    }
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
  };

  const handleSeekEnd = () => {
    setIsSeeking(false);
  };

  const handleSkipBack = () => {
    const audioElement = audioRefs.current[selectedLecture.id];
    if (audioElement) {
      audioElement.currentTime = Math.max(0, audioElement.currentTime - 10);
    }
  };

  const handleSkipForward = () => {
    const audioElement = audioRefs.current[selectedLecture.id];
    if (audioElement) {
      audioElement.currentTime = Math.min(duration, audioElement.currentTime + 10);
    }
  };

  const handleRestart = () => {
    const audioElement = audioRefs.current[selectedLecture.id];
    if (audioElement) {
      audioElement.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const handlePlaybackRateChange = (rate) => {
    const audioElement = audioRefs.current[selectedLecture.id];
    if (audioElement) {
      audioElement.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const handleVolumeChange = (event) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    
    const audioElement = audioRefs.current[selectedLecture.id];
    if (audioElement) {
      audioElement.volume = newVolume;
    }
  };

  const handleLectureSelect = (lecture) => {
    // Stop current audio if playing
    if (playingAudio) {
      const currentAudio = audioRefs.current[playingAudio];
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      setPlayingAudio(null);
    }
    
    setSelectedLecture(lecture);
    setCurrentTime(0);
    setPlaybackRate(1.0);
  };

  const handleDeleteClick = (lecture, e) => {
    e.stopPropagation();
    setLectureToDelete(lecture);
    setShowDeleteModal(true);
    setDeletePassword('');
    setDeleteError('');
  };

  const handleDeleteConfirm = () => {
    if (deletePassword === 'robayet_delete') {
      // Stop audio if the deleted lecture is playing
      if (playingAudio === lectureToDelete.id) {
        const audioElement = audioRefs.current[lectureToDelete.id];
        if (audioElement) {
          audioElement.pause();
          setPlayingAudio(null);
        }
      }

      // Clear selection if the deleted lecture is selected
      if (selectedLecture && selectedLecture.id === lectureToDelete.id) {
        setSelectedLecture(null);
      }

      // Call parent component to delete the lecture
      if (onDeleteLecture) {
        onDeleteLecture(lectureToDelete.id);
      }

      setShowDeleteModal(false);
      setLectureToDelete(null);
      setDeletePassword('');
    } else {
      setDeleteError('❌ Incorrect password. Please try again.');
      setDeletePassword('');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setLectureToDelete(null);
    setDeletePassword('');
    setDeleteError('');
  };

  const handleSaveNewLecture = async () => {
    if (!newLectureTitle.trim()) {
      alert('Please enter a lecture title');
      return;
    }

    try {
      setIsSavingNewLecture(true);
      setUploadProgress(0);
      setSaveStatus('Preparing lecture...');

      const recordingData = {
        title: newLectureTitle.trim(),
        notes: newLectureNotes,
        duration: newLectureDuration || '00:00',
        noiseCancelled: false,
        audioQuality: 'Standard',
        category: 'Manual Upload'
      };

      let audioBlob = null;
      
      if (newLectureAudio) {
        setSaveStatus('Processing audio file...');
        setUploadProgress(5);
        audioBlob = newLectureAudio;
      } else {
        // Create empty audio blob if no file provided
        audioBlob = new Blob([], { type: 'audio/webm' });
      }

      setSaveStatus('Uploading to server...');
      setUploadProgress(10);

      // Save to backend
      const result = await saveRecordingToServer(
        recordingData,
        audioBlob,
        (progress) => {
          setUploadProgress(10 + (progress * 0.9)); // 10-100%
          setSaveStatus(`Uploading... ${Math.round(progress)}%`);
        }
      );

      setUploadProgress(100);
      setSaveStatus('Saving complete!');
      console.log('✅ New lecture saved:', result);

      // Call parent component's save function
      if (onSaveLecture) {
        onSaveLecture({
          id: result.recording._id,
          title: result.recording.title,
          duration: result.recording.duration,
          date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          audioUrl: result.recording.audioUrl 
            ? (result.recording.audioUrl.startsWith('http')
                ? result.recording.audioUrl
                : result.recording.audioUrl.startsWith('/')
                  ? result.recording.audioUrl  // Already has leading slash, use as-is (goes through Vercel proxy)
                  : `/${result.recording.audioUrl}`)  // Add leading slash for Vercel proxy
            : null,
          imageUrl: result.recording.imageUrl
            ? (result.recording.imageUrl.startsWith('http')
                ? result.recording.imageUrl
                : result.recording.imageUrl.startsWith('/')
                  ? result.recording.imageUrl  // Already has leading slash, use as-is (goes through Vercel proxy)
                  : `/${result.recording.imageUrl}`)  // Add leading slash for Vercel proxy
            : null,
          notes: result.recording.notes,
          category: 'Manual Upload',
          noiseCancelled: false,
          audioQuality: 'Standard'
        });
      }

      // Reset form and close modal
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setShowAddLectureModal(false);
      setNewLectureTitle('');
      setNewLectureNotes('');
      setNewLectureAudio(null);
      setNewLectureDuration('00:00');
      setUploadProgress(0);
      setSaveStatus('');
      
      alert('✅ Lecture added successfully!');

    } catch (error) {
      console.error('❌ Error saving new lecture:', error);
      setSaveStatus('Upload failed!');
      alert(`❌ Failed to save lecture: ${error.message || 'Please check if backend is running.'}`);
    } finally {
      setIsSavingNewLecture(false);
      setUploadProgress(0);
      setSaveStatus('');
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
    };
  }, []);

  return (
    <section id="lectures" className="px-4 py-20 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              Your Lecture Library
            </h2>
            <button
              onClick={() => setShowAddLectureModal(true)}
              className="flex items-center gap-2 px-6 py-3 text-lg font-semibold text-white transition-all duration-300 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl hover:shadow-xl hover:scale-105"
              title="Add New Lecture"
            >
              <Plus size={24} />
              <span className="hidden sm:inline">Add Lecture</span>
            </button>
          </div>
          <p className="max-w-3xl mx-auto text-xl font-light text-gray-600">
            Access all your recorded lectures with advanced audio controls and notes
          </p>
        </div>

        {/* Add Lecture Modal */}
        {showAddLectureModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-2xl p-6 mx-4 bg-white shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="flex items-center text-2xl font-bold text-gray-900">
                  <Plus className="mr-2 text-green-600" size={28} />
                  Add New Lecture
                </h3>
                <button
                  onClick={() => {
                    setShowAddLectureModal(false);
                    setNewLectureTitle('');
                    setNewLectureNotes('');
                    setNewLectureAudio(null);
                    setNewLectureDuration('00:00');
                    setUploadProgress(0);
                    setSaveStatus('');
                  }}
                  className="p-1 text-gray-400 transition-colors hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">
                    Lecture Title *
                  </label>
                  <input
                    type="text"
                    value={newLectureTitle}
                    onChange={(e) => setNewLectureTitle(e.target.value)}
                    placeholder="e.g., Advanced IELTS Grammar - Perfect Tenses"
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200"
                    disabled={isSavingNewLecture}
                  />
                </div>

                {/* Audio File Upload */}
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">
                    Audio File (Optional)
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setNewLectureAudio(file);
                            // Try to get duration from audio file
                            const audio = new Audio();
                            audio.src = URL.createObjectURL(file);
                            audio.addEventListener('loadedmetadata', () => {
                              const mins = Math.floor(audio.duration / 60);
                              const secs = Math.floor(audio.duration % 60);
                              setNewLectureDuration(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
                            });
                          }
                        }}
                        className="hidden"
                        disabled={isSavingNewLecture}
                      />
                      <div className="flex items-center gap-3 px-4 py-3 transition-colors border-2 border-gray-300 border-dashed rounded-xl hover:border-green-500">
                        <Upload size={20} className="text-gray-500" />
                        <span className="text-gray-600">
                          {newLectureAudio ? newLectureAudio.name : 'Choose audio file...'}
                        </span>
                      </div>
                    </label>
                    {newLectureAudio && (
                      <button
                        onClick={() => setNewLectureAudio(null)}
                        className="p-2 text-red-500 rounded-lg hover:bg-red-50"
                        disabled={isSavingNewLecture}
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">
                    Duration (MM:SS)
                  </label>
                  <input
                    type="text"
                    value={newLectureDuration}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow only MM:SS format
                      if (/^\d{0,2}:?\d{0,2}$/.test(value) || value === '') {
                        setNewLectureDuration(value);
                      }
                    }}
                    placeholder="00:00"
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200"
                    disabled={isSavingNewLecture}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">
                    Lecture Notes
                  </label>
                  <textarea
                    value={newLectureNotes}
                    onChange={(e) => setNewLectureNotes(e.target.value)}
                    placeholder="Add your lecture notes here..."
                    rows="8"
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 resize-none rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200"
                    disabled={isSavingNewLecture}
                  />
                </div>

                {/* Upload Progress */}
                {isSavingNewLecture && (
                  <div className="p-4 border border-blue-200 bg-blue-50 rounded-xl">
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-blue-900">
                          {saveStatus || 'Saving...'}
                        </span>
                        <span className="text-sm font-bold text-blue-700">
                          {Math.round(uploadProgress)}%
                        </span>
                      </div>
                      <div className="w-full h-2 overflow-hidden bg-blue-200 rounded-full">
                        <div 
                          className="h-full transition-all duration-300 bg-gradient-to-r from-blue-500 to-green-500"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowAddLectureModal(false);
                      setNewLectureTitle('');
                      setNewLectureNotes('');
                      setNewLectureAudio(null);
                      setNewLectureDuration('00:00');
                      setUploadProgress(0);
                      setSaveStatus('');
                    }}
                    className="flex-1 px-6 py-3 font-semibold text-gray-700 transition-colors bg-gray-100 rounded-xl hover:bg-gray-200"
                    disabled={isSavingNewLecture}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNewLecture}
                    disabled={!newLectureTitle.trim() || isSavingNewLecture}
                    className="flex-1 px-6 py-3 font-semibold text-white transition-colors bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingNewLecture ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                        Saving...
                      </span>
                    ) : (
                      'Save Lecture'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md p-6 mx-4 bg-white shadow-2xl rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center text-xl font-bold text-gray-900">
                  <Lock className="mr-2 text-red-600" size={24} />
                  Delete Lecture
                </h3>
                <button
                  onClick={handleDeleteCancel}
                  className="p-1 text-gray-400 transition-colors hover:text-gray-600"
                >
                  <Trash2 size={20} />
                </button>
              </div>
              
              <p className="mb-4 text-gray-600">
                Are you sure you want to delete "<strong>{lectureToDelete?.title}</strong>"?
                This action cannot be undone.
              </p>
              
              <div className="p-4 mb-4 border border-red-200 rounded-lg bg-red-50">
                <p className="text-sm font-semibold text-red-800">⚠️ This will permanently delete:</p>
                <ul className="mt-2 ml-4 text-sm text-red-700 list-disc">
                  <li>Lecture recording audio file</li>
                  <li>All associated notes</li>
                  <li>Lecture metadata and details</li>
                </ul>
              </div>

              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Enter delete password to confirm:
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter delete password..."
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleDeleteConfirm();
                    }
                  }}
                />
                {deleteError && (
                  <p className="mt-2 text-sm text-red-600">{deleteError}</p>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-3 font-semibold text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={!deletePassword.trim()}
                  className="flex-1 px-4 py-3 font-semibold text-white transition-colors bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}

        {savedLectures.length === 0 ? (
          <div className="py-16 text-center bg-white border shadow-sm rounded-3xl border-gray-200/60">
            <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl">
              <Volume2 size={32} className="text-gray-400" />
            </div>
            <h3 className="mb-3 text-2xl font-bold text-gray-900">
              No Lectures Yet
            </h3>
            <p className="max-w-md mx-auto mb-8 text-gray-600">
              Record your first lecture using the recording section above, or add a lecture manually.
              Your saved lectures will appear here automatically.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <a 
                href="#record"
                className="inline-block px-8 py-4 text-lg font-semibold text-white transition-all duration-300 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl hover:shadow-xl"
              >
                Start Recording
              </a>
              <button
                onClick={() => setShowAddLectureModal(true)}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-white transition-all duration-300 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl hover:shadow-xl"
              >
                <Plus size={24} />
                Add Lecture
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Lectures List - Left Sidebar */}
            <div className="lg:col-span-1">
              <div className="p-6 bg-white border shadow-sm rounded-3xl border-gray-200/60">
                <h3 className="flex items-center mb-6 text-2xl font-bold text-gray-900">
                  <Volume2 className="mr-3 text-blue-500" size={24} />
                  Your Lectures
                  <span className="px-2 py-1 ml-2 text-sm text-blue-800 bg-blue-100 rounded-full">
                    {savedLectures.length}
                  </span>
                </h3>
                
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {savedLectures.map(lecture => (
                    <div 
                      key={lecture.id}
                      className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${
                        selectedLecture?.id === lecture.id 
                          ? 'border-blue-500 bg-blue-50/50 shadow-md' 
                          : 'border-transparent hover:border-gray-300 bg-gray-50/50 hover:bg-white'
                      }`}
                      onClick={() => handleLectureSelect(lecture)}
                    >
                      {/* Hidden audio element */}
                      {lecture.audioUrl && (
                        <audio
                          ref={el => {
                            if (el) {
                              audioRefs.current[lecture.id] = el;
                              
                              // Format audio URL properly - use Vercel proxy for HTTPS
                              let audioUrl = lecture.audioUrl;
                              if (audioUrl && !audioUrl.startsWith('http')) {
                                // Use relative path for Vercel proxy (HTTPS compatible)
                                audioUrl = audioUrl.startsWith('/') ? audioUrl : `/${audioUrl}`;
                                el.src = audioUrl;
                              } else {
                                el.src = audioUrl;
                              }
                              
                              // Handle audio errors
                              el.onerror = (e) => {
                                console.error('❌ Audio load error for:', lecture.title);
                                console.error('Audio URL:', audioUrl);
                                console.error('Error details:', e);
                              };
                              
                              el.oncanplay = () => {
                                console.log('✅ Audio ready:', lecture.title);
                              };
                              
                              el.onloadedmetadata = () => {
                                console.log('✅ Audio metadata loaded:', lecture.title, 'Duration:', el.duration);
                              };
                            }
                          }}
                          preload="metadata"
                          crossOrigin="anonymous"
                          onTimeUpdate={() => handleTimeUpdate(lecture.id)}
                          onLoadedMetadata={() => handleLoadedMetadata(lecture.id)}
                          onEnded={() => setPlayingAudio(null)}
                          onError={(e) => {
                            console.error('❌ Audio element error:', lecture.title, e);
                          }}
                        />
                      )}
                      
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="flex-1 pr-2 text-lg font-semibold leading-tight text-gray-900">
                          {lecture.title}
                        </h4>
                        <div className="flex space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayPause(lecture.id);
                            }}
                            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                              playingAudio === lecture.id
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                          >
                            {playingAudio === lecture.id ? (
                              <Pause size={16} />
                            ) : (
                              <Play size={16} />
                            )}
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(lecture, e)}
                            className="flex items-center justify-center flex-shrink-0 w-10 h-10 text-gray-400 transition-all duration-300 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-600"
                            title="Delete lecture"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center space-x-3">
                          <span className="flex items-center">
                            <Clock size={14} className="mr-1" />
                            {lecture.duration}
                          </span>
                          <span className="flex items-center">
                            <Calendar size={14} className="mr-1" />
                            {lecture.date}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Lecture Details & Notes - Right Side */}
            <div className="lg:col-span-2">
              <div className="h-full p-8 bg-white border shadow-sm rounded-3xl border-gray-200/60">
                {selectedLecture ? (
                  <div>
                    {/* Header */}
                    <div className="flex flex-col mb-6 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <h3 className="mb-2 text-2xl font-bold text-gray-900">
                          {selectedLecture.title}
                        </h3>
                        <div className="flex items-center mb-4 space-x-4 text-gray-600">
                          <span className="flex items-center">
                            <Clock size={18} className="mr-2" />
                            {selectedLecture.duration}
                          </span>
                          <span className="flex items-center">
                            <Calendar size={18} className="mr-2" />
                            {selectedLecture.date}
                          </span>
                          {selectedLecture.noiseCancelled && (
                            <span className="px-3 py-1 text-xs font-semibold text-green-800 bg-green-100 border border-green-200 rounded-full">
                              Noise Cancelled
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex mt-4 space-x-2 sm:mt-0">
                        <button
                          onClick={() => handleDeleteClick(selectedLecture, { stopPropagation: () => {} })}
                          className="flex items-center px-4 py-4 font-semibold text-red-600 transition-colors border border-red-200 bg-red-50 rounded-2xl hover:bg-red-100"
                        >
                          <Trash2 size={20} className="mr-2" />
                          Delete
                        </button>
                        <button
                          onClick={() => handlePlayPause(selectedLecture.id)}
                          className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-300 flex items-center ${
                            playingAudio === selectedLecture.id
                              ? 'bg-red-500 text-white hover:bg-red-600'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                        >
                          {playingAudio === selectedLecture.id ? (
                            <>
                              <Pause size={20} className="mr-2" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play size={20} className="mr-2" />
                              Play Lecture
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Advanced Audio Controls */}
                    <div className="p-6 mb-8 bg-gray-50 rounded-2xl">
                      {/* Progress Bar */}
                      <div className="flex items-center justify-between mb-3 text-sm text-gray-600">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={duration ? (currentTime / duration) * 100 : 0}
                        onChange={handleSeek}
                        onMouseDown={handleSeekStart}
                        onMouseUp={handleSeekEnd}
                        onTouchStart={handleSeekStart}
                        onTouchEnd={handleSeekEnd}
                        className="w-full h-3 mb-6 bg-gray-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-blue-500 [&::-webkit-slider-thumb]:to-purple-600"
                      />

                      {/* Control Buttons */}
                      <div className="flex items-center justify-center mb-6 space-x-4">
                        <button
                          onClick={handleRestart}
                          className="p-3 text-gray-600 transition-colors bg-white border border-gray-300 rounded-full hover:bg-gray-50"
                          title="Restart"
                        >
                          <RotateCcw size={20} />
                        </button>
                        
                        <button
                          onClick={handleSkipBack}
                          className="p-3 text-gray-600 transition-colors bg-white border border-gray-300 rounded-full hover:bg-gray-50"
                          title="Skip Back 10s"
                        >
                          <SkipBack size={20} />
                        </button>
                        
                        <button
                          onClick={() => handlePlayPause(selectedLecture.id)}
                          className={`p-4 rounded-full transition-all duration-300 ${
                            playingAudio === selectedLecture.id
                              ? 'bg-red-500 text-white hover:bg-red-600'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                        >
                          {playingAudio === selectedLecture.id ? (
                            <Pause size={24} />
                          ) : (
                            <Play size={24} />
                          )}
                        </button>
                        
                        <button
                          onClick={handleSkipForward}
                          className="p-3 text-gray-600 transition-colors bg-white border border-gray-300 rounded-full hover:bg-gray-50"
                          title="Skip Forward 10s"
                        >
                          <SkipForward size={20} />
                        </button>
                      </div>

                      {/* Playback Speed & Volume Controls */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Playback Speed */}
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-700">
                            Playback Speed
                          </label>
                          <div className="flex space-x-2">
                            {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(speed => (
                              <button
                                key={speed}
                                onClick={() => handlePlaybackRateChange(speed)}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                                  playbackRate === speed
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                {speed}x
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Volume Control */}
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-700">
                            Volume
                          </label>
                          <div className="flex items-center space-x-3">
                            <Volume2 size={16} className="text-gray-500" />
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={volume}
                              onChange={handleVolumeChange}
                              className="flex-1 h-2 bg-gray-200 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                            />
                            <span className="w-8 text-sm text-gray-600">
                              {Math.round(volume * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Lecture Notes */}
                    <div>
                      <h4 className="flex items-center mb-4 text-xl font-bold text-gray-900">
                        <span className="w-2 h-2 mr-2 bg-green-500 rounded-full"></span>
                        Lecture Notes
                      </h4>
                      <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200 min-h-[200px]">
                        {selectedLecture.notes ? (
                          <div className="text-lg leading-relaxed text-gray-700 whitespace-pre-line">
                            {selectedLecture.notes}
                          </div>
                        ) : (
                          <div className="py-8 text-center text-gray-500">
                            <p className="text-lg">No notes added for this lecture</p>
                            <p className="mt-2 text-sm">You can add notes when recording your next lecture</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Empty State
                  <div className="py-16 text-center">
                    <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl">
                      <Volume2 size={32} className="text-gray-400" />
                    </div>
                    <h3 className="mb-3 text-2xl font-bold text-gray-900">
                      Select a Lecture
                    </h3>
                    <p className="max-w-md mx-auto text-gray-600">
                      Choose a lecture from your library to access advanced audio controls and view detailed notes
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default LectureList;