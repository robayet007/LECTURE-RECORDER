import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import AudioRecorder from './components/AudioRecorder';
import LectureList from './components/LectureList';
import Features from './components/Features';
import Footer from './components/Footer';

function App() {
  const [savedLectures, setSavedLectures] = useState([]);

  const handleSaveLecture = (newLecture) => {
    setSavedLectures(prev => [newLecture, ...prev]);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Features />
      <AudioRecorder onSaveLecture={handleSaveLecture} />
      <LectureList savedLectures={savedLectures} />
      <Footer />
    </div>
  );
}

export default App;