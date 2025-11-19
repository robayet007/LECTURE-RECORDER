import React, { useState } from 'react';
import { X } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/70 backdrop-blur-2xl border-gray-200/30">
      <div className="px-6 mx-auto max-w-7xl sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center bg-black rounded-lg w-9 h-9">
              <span className="text-base font-semibold text-white">IL</span>
            </div>
            <span className="text-xl font-semibold tracking-tight text-gray-900">
              IELTS Lectures
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="items-center hidden space-x-8 md:flex">
            <a href="#record" className="text-sm font-normal text-gray-800 transition-colors duration-200 hover:text-gray-600">
              Record
            </a>
            <a href="#lectures" className="text-sm font-normal text-gray-800 transition-colors duration-200 hover:text-gray-600">
              Lectures
            </a>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-200">
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="p-1 transition-colors duration-200 rounded-lg md:hidden hover:bg-gray-100"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-800" strokeWidth={2} />
            ) : (
              <div className="space-y-1">
                <div className="w-5 h-0.5 bg-gray-800"></div>
                <div className="w-5 h-0.5 bg-gray-800"></div>
              </div>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="py-4 border-t md:hidden border-gray-200/30">
            <div className="flex flex-col space-y-1">
              <a 
                href="#record" 
                className="px-4 py-3 text-base font-normal text-gray-800 transition-colors duration-200 rounded-lg hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                Record
              </a>
              <a 
                href="#lectures" 
                className="px-4 py-3 text-base font-normal text-gray-800 transition-colors duration-200 rounded-lg hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                Lectures
              </a>
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg text-base font-medium transition-colors duration-200 mt-2"
                onClick={() => setIsMenuOpen(false)}
              >
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