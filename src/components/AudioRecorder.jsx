import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Save, RotateCcw } from 'lucide-react';

const AudioRecorder = ({ onSaveLecture }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [lectureTitle, setLectureTitle] = useState('');
  const [lectureNotes, setLectureNotes] = useState('');
  const [audioLevels, setAudioLevels] = useState([]);
  const [showSaveForm, setShowSaveForm] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    // যদি save form show হয়, তাহলে নতুন recording start করবে না
    if (showSaveForm) {
      const confirmStartNew = window.confirm(
        'You have an unsaved recording. Do you want to discard it and start a new recording?'
      );
      if (!confirmStartNew) {
        return; // User cancel করলে return করে দেবে
      }
      // User confirm করলে reset করে নতুন recording start করবে
      resetRecording();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setRecordingTime(0);
      setAudioLevels(Array(20).fill(10));
      setShowSaveForm(false); // নতুন recording start করলে save form hide করবে

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Audio visualization simulation
      const animateAudio = () => {
        if (isRecording && !isPaused) {
          const levels = Array.from({ length: 20 }, () => 
            Math.max(10, Math.random() * 50 + 10)
          );
          setAudioLevels(levels);
          setTimeout(animateAudio, 100);
        }
      };
      animateAudio();

    } catch (error) {
      alert('Microphone access required for recording.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      // Restart timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setIsPaused(false);
      clearInterval(timerRef.current);
      
      // Show confirmation alert
      const userConfirmed = window.confirm(
        `Are you sure you want to save this recording?\n\nDuration: ${formatTime(recordingTime)}\n\nClick OK to save with title and notes, or Cancel to record new.`
      );
      
      if (userConfirmed) {
        setShowSaveForm(true);
      } else {
        resetRecording();
      }
    }
  };

  const saveRecording = () => {
    if (audioURL && lectureTitle.trim()) {
      const newLecture = {
        id: Date.now(),
        title: lectureTitle.trim(),
        duration: formatTime(recordingTime),
        date: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        audioUrl: audioURL,
        notes: lectureNotes,
        category: 'Recording'
      };

      onSaveLecture(newLecture);
      resetRecording();
      setShowSaveForm(false);
      alert('Lecture saved successfully!');
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
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleRecordNew = () => {
    if (showSaveForm) {
      const confirmStartNew = window.confirm(
        'You have an unsaved recording. Do you want to discard it and start a new recording?'
      );
      if (confirmStartNew) {
        resetRecording();
      }
    } else {
      resetRecording();
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <section id="record" className="px-4 py-20 bg-gradient-to-b from-gray-50/50 to-white">
      <div className="max-w-4xl mx-auto">
        <div className="mb-16 text-center">
          <h2 className="mb-6 text-4xl font-bold text-gray-900 sm:text-5xl">
            Record Your Lecture
          </h2>
          <p className="max-w-2xl mx-auto text-xl font-light text-gray-600">
            Record, pause, resume, and save your IELTS lectures with notes
          </p>
        </div>

        <div className="overflow-hidden bg-white border shadow-2xl rounded-3xl border-gray-200/60">
          <div className="p-8 sm:p-12">
            
            {/* Recording Timer & Controls */}
            <div className="mb-12 text-center">
              <div className="mb-8 font-mono text-6xl font-bold text-gray-900 sm:text-7xl">
                {formatTime(recordingTime)}
              </div>

              {/* Audio Waveform Animation */}
              <div className="flex items-end justify-center h-20 mb-8 space-x-1">
                {audioLevels.map((level, index) => (
                  <div
                    key={index}
                    className="w-2 transition-all duration-75 rounded-t-lg bg-gradient-to-t from-blue-500 to-purple-600"
                    style={{ height: `${level}px` }}
                  />
                ))}
              </div>

              {/* Recording Controls */}
              <div className="flex justify-center mb-8 space-x-4">
                {!isRecording && !showSaveForm ? (
                  <button
                    onClick={startRecording}
                    className="p-6 text-white transition-all duration-300 transform shadow-xl bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl hover:shadow-2xl hover:scale-105 active:scale-95"
                  >
                    <Mic size={32} />
                  </button>
                ) : !showSaveForm ? (
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
                ) : (
                  // Save form show থাকলে recording controls hide করবে
                  <div className="py-4 text-center">
                    <p className="mb-4 text-gray-600">Complete saving current recording first</p>
                  </div>
                )}
              </div>

              {/* Recording Status */}
              {isRecording && (
                <div className="text-center">
                  <div className="flex items-center justify-center mb-4 text-lg font-semibold">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'
                    }`}></div>
                    {isPaused ? 'Recording Paused' : 'Recording in Progress'}
                  </div>
                  <p className="text-gray-500">
                    {isPaused ? 'Click resume to continue recording' : 'Speak clearly into the microphone'}
                  </p>
                </div>
              )}
            </div>

            {/* Save Recording Form - শুধুমাত্র showSaveForm true হলে দেখাবে */}
            {showSaveForm && audioURL && !isRecording && (
              <div className="pt-12 border-t border-gray-200/60">
                <div className="mb-8 text-center">
                  <h3 className="mb-2 text-3xl font-bold text-gray-900">Save Your Recording</h3>
                  <p className="text-xl text-gray-600">Duration: {formatTime(recordingTime)}</p>
                </div>

                <div className="max-w-2xl mx-auto space-y-6">
                  <div>
                    <label className="block mb-3 text-lg font-semibold text-gray-900">
                      Lecture Title *
                    </label>
                    <input
                      type="text"
                      value={lectureTitle}
                      onChange={(e) => setLectureTitle(e.target.value)}
                      placeholder="e.g., IELTS Grammar - Tenses Masterclass"
                      className="w-full px-6 py-4 text-lg transition-all duration-300 border-2 border-gray-300 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div>
                    <label className="block mb-3 text-lg font-semibold text-gray-900">
                      Lecture Notes
                    </label>
                    <textarea
                      value={lectureNotes}
                      onChange={(e) => setLectureNotes(e.target.value)}
                      placeholder="Add notes about this lecture... (optional)"
                      rows="6"
                      className="w-full px-6 py-4 text-lg transition-all duration-300 border-2 border-gray-300 resize-none rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <button
                      onClick={saveRecording}
                      disabled={!lectureTitle.trim()}
                      className="flex items-center justify-center px-8 py-4 space-x-3 text-lg font-semibold text-white transition-all duration-300 transform bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save size={24} />
                      <span>Save Lecture</span>
                    </button>

                    <button
                      onClick={handleRecordNew}
                      className="flex items-center justify-center px-8 py-4 space-x-3 text-lg font-semibold text-white transition-all duration-300 transform bg-gradient-to-r from-gray-500 to-gray-600 rounded-2xl hover:shadow-xl hover:scale-105 active:scale-95"
                    >
                      <RotateCcw size={24} />
                      <span>Record New</span>
                    </button>
                  </div>

                  <p className="text-sm text-center text-gray-500">
                    * Title is required to save the lecture
                  </p>
                </div>
              </div>
            )}

            {/* Recording Complete কিন্তু save form show না হলে */}
            {audioURL && !isRecording && !showSaveForm && (
              <div className="py-8 text-center">
                <p className="mb-4 text-gray-600">Recording ready to be saved</p>
                <button
                  onClick={() => setShowSaveForm(true)}
                  className="px-8 py-4 text-lg font-semibold text-white transition-all duration-300 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl hover:shadow-xl"
                >
                  Save Recording
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AudioRecorder;