import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">IA</span>
              </div>
              <span className="text-2xl font-bold text-white">IELTS.AI</span>
            </div>
            <p className="text-gray-400 text-lg leading-relaxed max-w-md">
              Revolutionizing IELTS preparation with AI-powered smart recording and automated note generation for students and teachers.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Product</h3>
            <ul className="space-y-4">
              <li><a href="#features" className="text-gray-400 hover:text-white transition-colors duration-300">Features</a></li>
              <li><a href="#record" className="text-gray-400 hover:text-white transition-colors duration-300">Recording</a></li>
              <li><a href="#lectures" className="text-gray-400 hover:text-white transition-colors duration-300">Lectures</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Support</h3>
            <ul className="space-y-4">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Help Center</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Contact</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-lg">
            © 2024 IELTS.AI. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300 text-lg">Twitter</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300 text-lg">LinkedIn</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300 text-lg">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;