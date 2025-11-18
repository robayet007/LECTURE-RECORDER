import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Clock, Calendar, Volume2 } from 'lucide-react';

const LectureList = ({ savedLectures }) => {
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRefs = useRef({});

  const handlePlayPause = (lectureId) => {
    const audioElement = audioRefs.current[lectureId];

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

      // Play new audio
      if (audioElement) {
        audioElement.play();
        setPlayingAudio(lectureId);
      }
    }
  };

  const handleTimeUpdate = (lectureId) => {
    const audioElement = audioRefs.current[lectureId];
    if (audioElement && playingAudio === lectureId) {
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

  const handleLectureSelect = (lecture) => {
    setSelectedLecture(lecture);
    // Reset current time when selecting new lecture
    setCurrentTime(0);
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
      // Pause all audio when component unmounts
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
          <h2 className="mb-6 text-4xl font-bold text-gray-900 sm:text-5xl">
            Your Lecture Library
          </h2>
          <p className="max-w-3xl mx-auto text-xl font-light text-gray-600">
            Access all your recorded lectures with instant playback and notes
          </p>
        </div>

        {savedLectures.length === 0 ? (
          <div className="py-16 text-center bg-white border shadow-sm rounded-3xl border-gray-200/60">
            <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl">
              <Volume2 size={32} className="text-gray-400" />
            </div>
            <h3 className="mb-3 text-2xl font-bold text-gray-900">
              No Lectures Yet
            </h3>
            <p className="max-w-md mx-auto mb-8 text-gray-600">
              Record your first lecture using the recording section above. 
              Your saved lectures will appear here automatically.
            </p>
            <a 
              href="#record"
              className="inline-block px-8 py-4 text-lg font-semibold text-white transition-all duration-300 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl hover:shadow-xl"
            >
              Start Recording
            </a>
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
                      <audio
                        ref={el => audioRefs.current[lecture.id] = el}
                        src={lecture.audioUrl}
                        preload="metadata"
                        onTimeUpdate={() => handleTimeUpdate(lecture.id)}
                        onLoadedMetadata={() => handleLoadedMetadata(lecture.id)}
                        onEnded={() => setPlayingAudio(null)}
                      />
                      
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="flex-1 pr-2 text-lg font-semibold leading-tight text-gray-900">
                          {lecture.title}
                        </h4>
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
                        </div>
                      </div>
                      <button
                        onClick={() => handlePlayPause(selectedLecture.id)}
                        className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-300 flex items-center mt-4 sm:mt-0 ${
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

                    {/* Audio Progress */}
                    <div className="p-6 mb-8 bg-gray-50 rounded-2xl">
                      <div className="flex items-center justify-between mb-3 text-sm text-gray-600">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full">
                        <div 
                          className="h-3 transition-all duration-100 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                          style={{ 
                            width: duration ? `${(currentTime / duration) * 100}%` : '0%'
                          }}
                        />
                      </div>
                      <p className="mt-3 text-center text-gray-500">
                        {playingAudio === selectedLecture.id ? 'Now Playing' : 'Paused'} - {selectedLecture.duration}
                      </p>
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
                      Choose a lecture from your library to listen, view progress, and read notes
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