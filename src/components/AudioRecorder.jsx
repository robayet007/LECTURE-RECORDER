import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Save, RotateCcw, VolumeX, Cpu, Type, Bold, Heading, X, Lock } from 'lucide-react';
import { saveRecordingToServer } from '../services/api';

const AudioRecorder = ({ onSaveLecture }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [lectureTitle, setLectureTitle] = useState('');
  const [lectureNotes, setLectureNotes] = useState('');
  const [audioLevels, setAudioLevels] = useState([]);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [noiseCancellation, setNoiseCancellation] = useState(true);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [showNewRecordingConfirm, setShowNewRecordingConfirm] = useState(false);
  const [isAppInBackground, setIsAppInBackground] = useState(false);
  const [_isStartingNewRecording, setIsStartingNewRecording] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayTime, setCurrentPlayTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saveStatus, setSaveStatus] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const notesTextareaRef = useRef(null);
  const audioRef = useRef(null);

  // Audio playback functions
  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentPlayTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleTimelineClick = (e) => {
    if (!audioRef.current || !duration) return;
    
    const timeline = e.currentTarget;
    const rect = timeline.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentPlayTime(newTime);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Background theke fire ashar por jate recording continue kore
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('📱 App backgrounded - recording continues');
        setIsAppInBackground(true);
      } else {
        console.log('📱 App foregrounded - recording active');
        setIsAppInBackground(false);
      }
    };

    const handleBlur = () => {
      console.log('📱 Window blur - recording protected');
    };

    const handleFocus = () => {
      console.log('📱 Window focus - recording active');
    };

    const handlePageHide = () => {
      console.log('📱 Page hiding - recording continues in background');
    };

    const handlePageShow = () => {
      console.log('📱 Page showing - recording was active in background');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  // Background e thakleo timer continue korbe - Optimized for long recordings
  useEffect(() => {
    if (isRecording && !isPaused) {
      // Use a more efficient timer that doesn't cause re-renders every second
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          // Only update if recording is still active (prevents memory leaks)
          if (isRecording && !isPaused) {
            return prev + 1;
          }
          return prev;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRecording, isPaused]);

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAudioConstraints = () => {
    return {
      audio: {
        echoCancellation: { ideal: true, exact: true },
        noiseSuppression: { ideal: true, exact: true },
        autoGainControl: { ideal: true, exact: true },
        channelCount: 1,
        sampleRate: 48000,
        sampleSize: 16,
        latency: 0,
        ...(noiseCancellation && {
          googEchoCancellation: { ideal: true },
          googNoiseSuppression: { ideal: true },
          googAutoGainControl: { ideal: true },
          googHighpassFilter: { ideal: true },
          googNoiseSuppression2: { ideal: true },
          googEchoCancellation2: { ideal: true },
          mozNoiseSuppression: { ideal: true },
          mozEchoCancellation: { ideal: true },
          mozAutoGainControl: { ideal: true },
          voiceIsolation: true,
          experimentalNoiseSuppression: true,
          suppressLocalAudioPlayback: true
        })
      }
    };
  };

  const setupAudioProcessing = (stream) => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      analyserRef.current.fftSize = 1024;
      analyserRef.current.smoothingTimeConstant = 0.6;
      analyserRef.current.minDecibels = -90;
      analyserRef.current.maxDecibels = -10;
      
      source.connect(analyserRef.current);

      const processAudio = () => {
        if (!isRecording || isPaused) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        const floatArray = new Float32Array(analyserRef.current.frequencyBinCount);
        
        analyserRef.current.getByteFrequencyData(dataArray);
        analyserRef.current.getFloatFrequencyData(floatArray);

        const levels = Array.from({ length: 30 }, (_, i) => {
          let baseValue = dataArray[i * 1.5] || 0;
          
          if (noiseCancellation) {
            if (i >= 4 && i <= 12) {
              baseValue = baseValue * 1.6;
            } else if (i < 3 || i > 20) {
              baseValue = baseValue * 0.2;
            }
            
            if (i < 2) baseValue = baseValue * 0.1;
            if (i > 25) baseValue = baseValue * 0.1;
          }
          
          return Math.max(3, Math.min(baseValue / 2, 70));
        });
        
        setAudioLevels(levels);

        if (noiseCancellation) {
          detectBackgroundNoise(floatArray);
        }

        requestAnimationFrame(processAudio);
      };
      
      processAudio();
    } catch (error) {
      console.warn('Audio processing not available:', error);
    }
  };

  const detectBackgroundNoise = (floatArray) => {
    const lowFreqRange = floatArray.slice(0, 10);
    const voiceFreqRange = floatArray.slice(10, 25);
    const highFreqRange = floatArray.slice(25, 50);
    
    const lowEnergy = lowFreqRange.reduce((sum, val) => sum + Math.abs(val), 0);
    const voiceEnergy = voiceFreqRange.reduce((sum, val) => sum + Math.abs(val), 0);
    const highEnergy = highFreqRange.reduce((sum, val) => sum + Math.abs(val), 0);
    
    if ((lowEnergy + highEnergy) > voiceEnergy * 2) {
      console.log('🔇 Background noise detected and filtered');
    }
  };

  const startRecording = async () => {
    try {
      console.log('🎙️ Starting professional recording...');
      setIsStartingNewRecording(false);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: getAudioConstraints(),
        video: false
      });
      
      streamRef.current = stream;
      setupAudioProcessing(stream);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 192000
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setRecordingTime(0);
      setAudioLevels(Array(30).fill(3));
      setShowSaveForm(false);
      setShowNewRecordingConfirm(false);
      setIsAppInBackground(false);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          // Memory optimization: Log chunk size for monitoring
          console.log(`📦 Chunk received: ${(event.data.size / 1024 / 1024).toFixed(2)} MB`);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          console.log(`🎬 Recording stopped. Total chunks: ${audioChunksRef.current.length}`);
          console.log(`💾 Creating blob from ${audioChunksRef.current.length} chunks...`);
          
          // Use requestIdleCallback for better performance on long recordings
          const createBlob = () => {
            const audioBlob = new Blob(audioChunksRef.current, { 
              type: 'audio/webm;codecs=opus' 
            });
            
            console.log(`✅ Blob created: ${(audioBlob.size / 1024 / 1024).toFixed(2)} MB`);
            
            const audioUrl = URL.createObjectURL(audioBlob);
            setAudioURL(audioUrl);
            
            cleanupAudioSystems();
          };

          // For very long recordings, create blob asynchronously
          if (audioChunksRef.current.length > 1000) {
            setTimeout(createBlob, 100);
          } else {
            createBlob();
          }
        } catch (error) {
          console.error('Error creating blob:', error);
          cleanupAudioSystems();
        }
      };

      // Optimized timeslice for long recordings (2-3 hours):
      // Using 1000ms (1 second) instead of 50ms reduces memory chunks by 20x
      // This prevents browser hang on very long recordings
      const timeslice = 1000; // 1 second chunks - optimal for 2-3 hour recordings
      mediaRecorder.start(timeslice);
      console.log(`🎙️ Recording started with ${timeslice}ms timeslice (optimized for long recordings)`);
      setIsRecording(true);
      setIsPaused(false);

    } catch (error) {
      console.error('Recording failed:', error);
      setIsStartingNewRecording(false);
      if (error.name === 'NotAllowedError') {
        alert('❌ Microphone access denied. Please allow microphone permissions.');
      } else if (error.name === 'NotFoundError') {
        alert('❌ No microphone found. Please check your audio device.');
      } else {
        alert('❌ Recording failed. Please try again.');
      }
    }
  };

  const cleanupAudioSystems = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    setShowStopConfirm(true);
  };

  const confirmStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      setShowSaveForm(true);
      setShowStopConfirm(false);
    }
  };

  const cancelStopRecording = () => {
    setShowStopConfirm(false);
  };

  const handleNewRecording = () => {
    if (showSaveForm) {
      setShowNewRecordingConfirm(true);
    } else {
      setShowPasswordModal(true);
    }
  };

  const confirmNewRecording = () => {
    resetRecording();
    setShowNewRecordingConfirm(false);
    setIsStartingNewRecording(true);
    setShowPasswordModal(true);
  };

  const cancelNewRecording = () => {
    setShowNewRecordingConfirm(false);
  };

  const handleRecordButtonClick = () => {
    if (showSaveForm) {
      setShowNewRecordingConfirm(true);
    } else {
      setShowPasswordModal(true);
    }
  };

  const handlePasswordSubmit = () => {
    if (password === 'robayet') {
      setShowPasswordModal(false);
      setPassword('');
      setPasswordError('');
      startRecording();
    } else {
      setPasswordError('❌ Incorrect password. Please try again.');
      setPassword('');
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    setPassword('');
    setPasswordError('');
  };

  const formatText = (format) => {
    if (!notesTextareaRef.current) return;

    const textarea = notesTextareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = lectureNotes.substring(start, end);
    let newText = lectureNotes;
    let newCursorStart = start;
    let newCursorEnd = end;

    switch (format) {
      case 'bold':
        if (selectedText) {
          newText = lectureNotes.substring(0, start) + `( ${selectedText} )` + lectureNotes.substring(end);
          newCursorStart = start + 2;
          newCursorEnd = start + 2 + selectedText.length;
        } else {
          newText = lectureNotes.substring(0, start) + '( param )' + lectureNotes.substring(end);
          newCursorStart = start + 2;
          newCursorEnd = start + 7;
        }
        break;
      
      case 'heading':
        if (selectedText) {
          newText = lectureNotes.substring(0, start) + `## ${selectedText}\n` + lectureNotes.substring(end);
          newCursorStart = start + 3;
          newCursorEnd = start + 3 + selectedText.length;
        } else {
          newText = lectureNotes.substring(0, start) + '## Heading\n' + lectureNotes.substring(end);
          newCursorStart = start + 3;
          newCursorEnd = start + 10;
        }
        break;
      
      case 'bullet':
        if (selectedText) {
          const bulleted = selectedText.split('\n').map(line => line.trim() ? `• ${line}` : '').join('\n');
          newText = lectureNotes.substring(0, start) + bulleted + lectureNotes.substring(end);
          newCursorStart = start;
          newCursorEnd = start + bulleted.length;
        } else {
          newText = lectureNotes.substring(0, start) + '• ' + lectureNotes.substring(end);
          newCursorStart = start + 2;
          newCursorEnd = start + 2;
        }
        break;
      
      default:
        break;
    }

    setLectureNotes(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorStart, newCursorEnd);
    }, 0);
  };

  // UPDATED: saveRecording function for MongoDB - Optimized for long recordings
  const saveRecording = async () => {
    if (audioURL && lectureTitle.trim()) {
      try {
        setIsSaving(true);
        setUploadProgress(0);
        setSaveStatus('Creating audio file...');
        
        // Show progress for blob creation on long recordings
        const totalChunks = audioChunksRef.current.length;
        console.log(`📦 Creating blob from ${totalChunks} chunks (${(recordingTime / 60).toFixed(1)} minutes)...`);
        
        // Create audio blob with progress indication
        let blobCreationStart = Date.now();
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        });
        let blobCreationTime = Date.now() - blobCreationStart;
        
        const fileSizeMB = (audioBlob.size / 1024 / 1024).toFixed(2);
        console.log(`✅ Blob created: ${fileSizeMB} MB in ${blobCreationTime}ms`);

        const recordingData = {
          title: lectureTitle.trim(),
          notes: lectureNotes,
          duration: formatTime(recordingTime),
          noiseCancelled: noiseCancellation,
          audioQuality: 'High Definition',
          category: 'Recording'
        };

        setSaveStatus(`Uploading ${fileSizeMB} MB to server...`);
        setUploadProgress(10);

        // Save to MongoDB with progress tracking
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
        console.log('✅ Recording saved to MongoDB:', result);

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
            category: 'Recording',
            noiseCancelled: noiseCancellation,
            audioQuality: 'High Definition'
          });
        }

        // Small delay to show completion
        await new Promise(resolve => setTimeout(resolve, 500));
        
        resetRecording();
        setShowSaveForm(false);
        setUploadProgress(0);
        setSaveStatus('');
        
        alert(`✅ Lecture saved successfully! (${fileSizeMB} MB)`);

      } catch (error) {
        console.error('❌ Error saving recording:', error);
        setSaveStatus('Upload failed!');
        alert(`❌ Failed to save recording: ${error.message || 'Please check if backend is running.'}`);
      } finally {
        setIsSaving(false);
        setUploadProgress(0);
        setSaveStatus('');
      }
    } else {
      alert('Please enter a title for your lecture');
    }
  };

  const resetRecording = () => {
    setAudioURL('');
    setLectureTitle('');
    setLectureNotes('');
    setRecordingTime(0);
    setIsRecording(false);
    setIsPaused(false);
    setShowSaveForm(false);
    setAudioLevels(Array(30).fill(3));
    setIsAppInBackground(false);
    setIsStartingNewRecording(false);
    setIsSaving(false);
    setIsPlaying(false);
    setCurrentPlayTime(0);
    setDuration(0);
    setUploadProgress(0);
    setSaveStatus('');
    
    cleanupAudioSystems();
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isRecording) {
        e.preventDefault();
        e.returnValue = 'You are currently recording. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isRecording]);

  useEffect(() => {
    return () => {
      cleanupAudioSystems();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <section id="record" className="px-4 py-20 bg-gradient-to-b from-gray-50/50 to-white">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16 text-center">
          <h2 className="mb-6 text-4xl font-bold text-gray-900 sm:text-5xl">
            Professional Voice Recording
          </h2>
          <p className="max-w-2xl mx-auto text-xl font-light text-gray-600">
            Crystal clear audio with advanced noise cancellation
          </p>
        </div>

        {showStopConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md p-6 mx-4 bg-white shadow-2xl rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Stop Recording?</h3>
                <button
                  onClick={cancelStopRecording}
                  className="p-1 text-gray-400 transition-colors hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              
              <p className="mb-2 text-gray-600">
                Are you sure you want to stop recording?
              </p>
              <p className="mb-6 text-lg font-semibold text-blue-600">
                Duration: {formatTime(recordingTime)}
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={cancelStopRecording}
                  className="flex-1 px-4 py-3 font-semibold text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Continue Recording
                </button>
                <button
                  onClick={confirmStopRecording}
                  className="flex-1 px-4 py-3 font-semibold text-white transition-colors bg-red-500 rounded-lg hover:bg-red-600"
                >
                  Stop & Save
                </button>
              </div>
            </div>
          </div>
        )}

        {showNewRecordingConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md p-6 mx-4 bg-white shadow-2xl rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Start New Recording?</h3>
                <button
                  onClick={cancelNewRecording}
                  className="p-1 text-gray-400 transition-colors hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              
              <p className="mb-4 text-gray-600">
                You are about to start a new recording. This will clear your current recording data.
              </p>
              
              <div className="p-4 mb-4 border border-yellow-200 rounded-lg bg-yellow-50">
                <p className="text-sm font-semibold text-yellow-800">⚠️ Current recording will be lost:</p>
                <ul className="mt-2 ml-4 text-sm text-yellow-700 list-disc">
                  <li>Recording duration: {formatTime(recordingTime)}</li>
                  <li>Lecture title and notes</li>
                  <li>All audio data</li>
                </ul>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={cancelNewRecording}
                  className="flex-1 px-4 py-3 font-semibold text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmNewRecording}
                  className="flex-1 px-4 py-3 font-semibold text-white transition-colors bg-green-500 rounded-lg hover:bg-green-600"
                >
                  Start New Recording
                </button>
              </div>
            </div>
          </div>
        )}

        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md p-6 mx-4 bg-white shadow-2xl rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center text-xl font-bold text-gray-900">
                  <Lock className="mr-2 text-blue-600" size={24} />
                  Enter Password to Record
                </h3>
                <button
                  onClick={handlePasswordCancel}
                  className="p-1 text-gray-400 transition-colors hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              
              <p className="mb-4 text-gray-600">
                Please enter the security password to start recording.
              </p>
              
              <div className="mb-4">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handlePasswordSubmit();
                    }
                  }}
                />
                {passwordError && (
                  <p className="mt-2 text-sm text-red-600">{passwordError}</p>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handlePasswordCancel}
                  className="flex-1 px-4 py-3 font-semibold text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  disabled={!password.trim()}
                  className="flex-1 px-4 py-3 font-semibold text-white transition-colors bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Recording
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="p-6 border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
              <h3 className="flex items-center mb-4 text-xl font-bold text-gray-900">
                <Cpu className="mr-3 text-blue-600" size={24} />
                Audio Quality Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <VolumeX className="mr-3 text-red-500" size={20} />
                    <div>
                      <span className="font-semibold text-gray-800">Advanced Noise Cancellation</span>
                      <p className="text-sm text-gray-600">
                        Removes background noise, fan sounds, and side conversations
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setNoiseCancellation(!noiseCancellation)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      noiseCancellation ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        noiseCancellation ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="p-3 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">Audio Quality:</span>
                    <span className={`font-semibold ${
                      noiseCancellation ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {noiseCancellation ? '🎯 Professional' : '🎙️ Standard'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {noiseCancellation 
                      ? 'Background noise filtered • Voice enhanced • Crystal clear' 
                      : 'Standard recording • Some background noise may be present'
                    }
                  </p>
                </div>

                {isRecording && (
                  <div className="p-3 border border-green-200 rounded-lg bg-green-50">
                    <p className="text-sm text-green-800">
                      🔄 <strong>Background Recording:</strong> Recording continues even when app is minimized or device is locked.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 bg-white border shadow-2xl rounded-3xl border-gray-200/60">
              <div className="mb-8 text-center">
                <div className="mb-8 font-mono text-6xl font-bold text-gray-900 sm:text-7xl">
                  {formatTime(recordingTime)}
                </div>

                <div className="flex items-end justify-center h-24 mb-8 space-x-0.5">
                  {audioLevels.map((level, index) => (
                    <div
                      key={index}
                      className="w-1.5 transition-all duration-20 rounded-t-lg bg-gradient-to-t from-blue-500 via-purple-500 to-pink-500"
                      style={{ height: `${level}px` }}
                    />
                  ))}
                </div>

                {isRecording && (
                  <div className="mb-6 text-center">
                    <div className="flex items-center justify-center mb-3 text-lg font-semibold">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'
                      }`}></div>
                      Professional Recording Active
                      {noiseCancellation && (
                        <span className="px-2 py-1 ml-2 text-xs text-green-800 bg-green-100 border border-green-200 rounded-full">
                          Noise Cancellation ON
                        </span>
                      )}
                      {isAppInBackground && (
                        <span className="px-2 py-1 ml-2 text-xs text-blue-800 bg-blue-100 border border-blue-200 rounded-full">
                          Background Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {noiseCancellation 
                        ? 'Background noise is being filtered in real-time' 
                        : 'Standard recording mode'
                      }
                      {isAppInBackground && ' • Recording continues in background'}
                    </p>
                  </div>
                )}

                <div className="flex justify-center space-x-4">
                  {!isRecording ? (
                    <button
                      onClick={handleRecordButtonClick}
                      className="p-6 text-white transition-all duration-300 transform shadow-xl bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl hover:shadow-2xl hover:scale-105 active:scale-95"
                    >
                      <Mic size={32} />
                    </button>
                  ) : (
                    <>
                      {isPaused ? (
                        <button
                          onClick={resumeRecording}
                          className="p-6 text-white transition-all duration-300 transform shadow-xl bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl hover:shadow-2xl hover:scale-105 active:scale-95"
                        >
                          <Play size={32} />
                        </button>
                      ) : (
                        <button
                          onClick={pauseRecording}
                          className="p-6 text-white transition-all duration-300 transform shadow-xl bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl hover:shadow-2xl hover:scale-105 active:scale-95"
                        >
                          <Pause size={32} />
                        </button>
                      )}
                      <button
                        onClick={stopRecording}
                        className="p-6 text-white transition-all duration-300 transform shadow-xl bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl hover:shadow-2xl hover:scale-105 active:scale-95"
                      >
                        <Square size={32} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {isRecording && (
                <div className="p-4 text-center border border-green-200 bg-green-50 rounded-2xl">
                  <p className="text-sm font-medium text-green-800">
                    🛡️ Protected Recording • 🔇 Noise Filtering Active • 📱 Background Recording Enabled
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-white border shadow-lg rounded-2xl border-gray-200/60 sm:p-6">
              <h3 className="flex items-center mb-4 text-xl font-bold text-gray-900">
                <Type className="mr-3 text-purple-600" size={24} />
                Professional Notes Editor
              </h3>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => formatText('bold')}
                  className="flex items-center px-3 py-2 space-x-2 text-sm text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200 sm:px-4 sm:text-base"
                >
                  <Bold size={16} />
                  <span>Param</span>
                </button>
                
                <button
                  onClick={() => formatText('heading')}
                  className="flex items-center px-3 py-2 space-x-2 text-sm text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200 sm:px-4 sm:text-base"
                >
                  <Heading size={16} />
                  <span>Heading</span>
                </button>
                
                <button
                  onClick={() => formatText('bullet')}
                  className="flex items-center px-3 py-2 space-x-2 text-sm text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200 sm:px-4 sm:text-base"
                >
                  <span>•</span>
                  <span>List</span>
                </button>
              </div>

              {/* Enhanced Textarea for Mobile */}
              <div className="relative">
                <textarea
                  ref={notesTextareaRef}
                  value={lectureNotes}
                  onChange={(e) => setLectureNotes(e.target.value)}
                  placeholder="Start typing your professional notes here...

## Key Topics
• Main concepts covered
• Important definitions

## Important Points
• ( Critical information ) that needs emphasis
• Key takeaways

## Action Items
• Practice exercises
• Follow-up tasks"
                  rows="16"
                  className="w-full px-4 py-4 font-mono text-base transition-all duration-300 border-2 border-gray-300 resize-none rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 min-h-[400px] sm:min-h-[300px] md:min-h-[350px] lg:min-h-[400px] text-lg leading-relaxed"
                  disabled={showSaveForm}
                  style={{
                    fontSize: '18px',
                    lineHeight: '1.6',
                    WebkitTextSizeAdjust: '100%'
                  }}
                />
                
                {/* Mobile Optimization Indicator */}
                <div className="absolute bottom-3 right-3">
                  <div className="flex items-center px-2 py-1 text-xs text-gray-500 bg-white rounded-lg opacity-70">
                    <span className="sm:hidden">📱 Mobile Optimized</span>
                    <span className="hidden sm:inline">💻 Desktop Ready</span>
                  </div>
                </div>
              </div>

              {/* Enhanced Formatting Guide */}
              <div className="p-3 mt-4 border border-gray-200 rounded-lg bg-gray-50">
                <p className="mb-2 text-sm font-semibold text-gray-800">📝 Formatting Guide:</p>
                <div className="grid grid-cols-1 gap-1 text-xs text-gray-600 sm:grid-cols-3 sm:text-sm">
                  <div className="flex items-center">
                    <span className="mr-2">•</span>
                    <code>( param )</code>
                    <span className="ml-1">→ <strong>(Bold)</strong></span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">•</span>
                    <code>## Heading</code>
                    <span className="ml-1">→ Title</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">•</span>
                    <code>• item</code>
                    <span className="ml-1">→ List</span>
                  </div>
                </div>
              </div>

              {/* Character Count */}
              <div className="flex justify-between mt-3 text-sm text-gray-500">
                <span>
                  📄 Lines: {lectureNotes.split('\n').length}
                </span>
                <span>
                  ✍️ Characters: {lectureNotes.length}
                </span>
              </div>
            </div>

            {/* Mobile Tips Section */}
            <div className="p-4 border border-blue-200 bg-blue-50 rounded-2xl sm:p-6">
              <h4 className="flex items-center mb-3 font-semibold text-blue-900">
                <span className="mr-2">📱</span>
                Mobile Recording Tips
              </h4>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>Large Text Area:</strong> Comfortable typing on touchscreen</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>Quick Formatting:</strong> Use buttons for bold, headings, lists</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>Background Recording:</strong> Continue recording while typing notes</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>Auto-save:</strong> All data saved securely to database</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>Voice Focus:</strong> Speak clearly, phone will capture clean audio</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {showSaveForm && (
          <div className="p-8 mt-8 bg-white border shadow-2xl rounded-3xl border-gray-200/60">
            <div className="mb-8 text-center">
              <h3 className="mb-2 text-3xl font-bold text-gray-900">
                Save Professional Recording
              </h3>
              <p className="text-xl text-gray-600">
                Duration: {formatTime(recordingTime)} 
                <span className="ml-2 font-semibold text-green-600">
                  • {noiseCancellation ? 'Crystal Clear Audio' : 'Standard Audio'}
                </span>
              </p>
            </div>

            {/* Audio Player Section */}
            {audioURL && (
              <div className="max-w-2xl p-6 mx-auto mb-8 bg-gray-50 rounded-2xl">
                <h4 className="mb-4 text-lg font-semibold text-center text-gray-900">
                  Preview Recording
                </h4>
                
                {/* Audio Player */}
                <div className="space-y-4">
                  {/* Timeline */}
                  <div 
                    className="relative h-3 bg-gray-300 rounded-full cursor-pointer"
                    onClick={handleTimelineClick}
                  >
                    <div 
                      className="absolute h-full transition-all duration-100 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                      style={{ 
                        width: duration ? `${(currentPlayTime / duration) * 100}%` : '0%' 
                      }}
                    />
                    <div 
                      className="absolute w-4 h-4 -ml-2 transition-all duration-100 bg-white border-2 border-blue-500 rounded-full shadow-lg -top-1"
                      style={{ 
                        left: duration ? `${(currentPlayTime / duration) * 100}%` : '0%' 
                      }}
                    />
                  </div>

                  {/* Time Display and Controls */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-gray-600">
                      {formatTime(currentPlayTime)}
                    </span>
                    
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={handlePlayPause}
                        className="p-3 text-white transition-colors bg-blue-500 rounded-full hover:bg-blue-600"
                      >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                      </button>
                    </div>
                    
                    <span className="font-mono text-sm text-gray-600">
                      {formatTime(duration)}
                    </span>
                  </div>

                  {/* Hidden Audio Element */}
                  <audio
                    ref={audioRef}
                    src={audioURL}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                </div>
              </div>
            )}

            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <label className="block mb-3 text-lg font-semibold text-gray-900">
                  Lecture Title *
                </label>
                <input
                  type="text"
                  value={lectureTitle}
                  onChange={(e) => setLectureTitle(e.target.value)}
                  placeholder="e.g., Advanced IELTS Grammar - Perfect Tenses"
                  className="w-full px-6 py-4 text-lg transition-all duration-300 border-2 border-gray-300 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  disabled={isSaving}
                />
              </div>

              {/* Upload Progress Indicator */}
              {isSaving && (
                <div className="p-6 border border-blue-200 bg-blue-50 rounded-2xl">
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-blue-900">
                        {saveStatus || 'Saving...'}
                      </span>
                      <span className="text-sm font-bold text-blue-700">
                        {Math.round(uploadProgress)}%
                      </span>
                    </div>
                    <div className="w-full h-3 overflow-hidden bg-blue-200 rounded-full">
                      <div 
                        className="h-full transition-all duration-300 ease-out bg-gradient-to-r from-blue-500 to-green-500"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-blue-700">
                    {recordingTime > 3600 
                      ? '⏳ Large file detected - this may take several minutes. Please keep this tab open.'
                      : '📤 Uploading your recording to the server...'}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  onClick={saveRecording}
                  disabled={!lectureTitle.trim() || isSaving}
                  className="flex items-center justify-center px-8 py-4 space-x-3 text-lg font-semibold text-white transition-all duration-300 transform bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={24} />
                      <span>Save to Database</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleNewRecording}
                  className="flex items-center justify-center px-8 py-4 space-x-3 text-lg font-semibold text-white transition-all duration-300 transform bg-gradient-to-r from-gray-500 to-gray-600 rounded-2xl hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  <RotateCcw size={24} />
                  <span>New Recording</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AudioRecorder;