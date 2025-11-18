import React from 'react';

const Hero = () => {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50/30 py-20 px-4">
      <div className="max-w-6xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center px-6 py-3 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/60 shadow-sm mb-12">
          <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mr-3 animate-pulse"></div>
          <span className="text-gray-700 text-lg font-semibold">AI-Powered Learning Platform</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight">
          Learn IELTS
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-gradient">
            Like Never Before
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
          Revolutionary smart recording technology that captures only your voice, 
          eliminates background noise, and generates perfect AI notes automatically.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-5 justify-center items-center mb-20">
          <button className="bg-gray-900 text-white px-10 py-5 rounded-2xl text-xl font-semibold hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-2xl hover:shadow-2xl">
            Start Recording ›
          </button>
          <button className="border-2 border-gray-300 text-gray-700 px-10 py-5 rounded-2xl text-xl font-semibold hover:bg-gray-50/80 hover:border-gray-400 transition-all duration-300 transform hover:scale-105 active:scale-95 backdrop-blur-sm">
            Watch Demo
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
          {[
            { number: '10K+', label: 'Students Helped' },
            { number: '99%', label: 'Success Rate' },
            { number: '4.9★', label: 'Rating' }
          ].map((stat, index) => (
            <div key={index} className="text-center p-6 rounded-3xl bg-white/60 backdrop-blur-sm border border-gray-200/40 shadow-sm">
              <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;