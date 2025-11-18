import React from 'react';
import { Mic, Brain, Download, Sparkles } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: <Mic className="w-8 h-8" />,
      title: "Smart Recording",
      description: "Advanced noise cancellation captures only your voice, filters out background noise automatically.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI Notes Generation",
      description: "Automatically converts your lectures into perfect, organized notes with key points highlighted.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Download className="w-8 h-8" />,
      title: "Instant Download",
      description: "Download crystal clear audio recordings and AI-generated notes with a single click.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "Smart Organization",
      description: "Automatically categorizes your lectures and creates structured learning paths.",
      color: "from-orange-500 to-red-500"
    }
  ];

  return (
    <section id="features" className="py-20 bg-gradient-to-b from-white to-gray-50/50 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Revolutionary Features
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light">
            Powered by cutting-edge AI technology to transform how you learn and teach IELTS
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group">
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200/60 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed font-light">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;