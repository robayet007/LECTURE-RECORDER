import React, { useState } from 'react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">IA</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                IELTS.AI
              </span>
              <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mt-1"></div>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-10">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors duration-300 font-medium text-lg">Features</a>
            <a href="#record" className="text-gray-600 hover:text-gray-900 transition-colors duration-300 font-medium text-lg">Record</a>
            <a href="#lectures" className="text-gray-600 hover:text-gray-900 transition-colors duration-300 font-medium text-lg">Lectures</a>
            <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-2xl text-lg font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg">
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors duration-300"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <div className="space-y-1.5">
              <div className="w-6 h-0.5 bg-gray-700 rounded-full"></div>
              <div className="w-6 h-0.5 bg-gray-700 rounded-full"></div>
              <div className="w-4 h-0.5 bg-gray-700 rounded-full"></div>
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-6 border-t border-gray-200/60 bg-white/95 backdrop-blur-lg rounded-3xl mt-2 shadow-2xl">
            <div className="flex flex-col space-y-6 px-4">
              <a href="#features" className="text-gray-700 hover:text-gray-900 text-xl font-medium py-2 border-b border-gray-100">Features</a>
              <a href="#record" className="text-gray-700 hover:text-gray-900 text-xl font-medium py-2 border-b border-gray-100">Record</a>
              <a href="#lectures" className="text-gray-700 hover:text-gray-900 text-xl font-medium py-2 border-b border-gray-100">Lectures</a>
              <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:shadow-xl transition-all duration-300 mt-4">
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;