import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

const services = [
  {
    icon: '🏡',
    title: 'Lawn Care',
    description: 'Premium mowing, edging, and maintenance'
  },
  {
    icon: '🌺',
    title: 'Garden Design',
    description: 'Custom landscape design and installation'
  },
  {
    icon: '🌳',
    title: 'Tree Services',
    description: 'Professional pruning and arborist care'
  },
  {
    icon: '💧',
    title: 'Irrigation Systems',
    description: 'Smart sprinkler and water management'
  }
];

const LuxuryServices: React.FC = () => {
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <section className="py-8 px-4 relative z-10">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-4xl font-bold text-center mb-6 md:mb-8 bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
          Luxury Services
        </h2>

        {/* Service Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-8 md:mb-10">
          {services.map((service, index) => (
            <Card 
              key={index}
              className="bg-gray-900/60 border border-green-500/30 hover:border-green-400 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300 group rounded-2xl"
            >
              <CardContent className="p-4 md:p-6 text-center h-full flex flex-col justify-center">
                <div className="text-xl md:text-2xl mb-2 group-hover:scale-110 transition-transform">
                  {service.icon}
                </div>
                <h3 className="text-base md:text-lg font-bold text-white mb-1">
                  {service.title}
                </h3>
                <p className="text-gray-300 text-xs md:text-sm leading-tight">
                  {service.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Services */}
        <div className="space-y-3 md:space-y-4 mb-8 md:mb-10">

          {/* Core Services */}
          <Card className="bg-gray-900/60 border border-green-500/30 rounded-2xl">
            <CardContent className="p-0">
              <button
                onClick={() => toggleSection('core')}
                className="w-full p-4 md:p-6 text-left hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex justify-between items-start md:items-center">
                  <div className="flex-1 pr-4">
                    <h3 className="text-lg md:text-xl font-bold text-white mb-1 md:mb-2">🌿 Core Year-Round Services</h3>
                    <p className="text-green-400 font-bold text-sm md:text-base shadow-lg shadow-green-500/20 bg-green-500/10 px-2 py-1 rounded-2xl inline-block">Available in NC & FL</p>
                  </div>
                  <span className="text-green-400 text-xl md:text-2xl flex-shrink-0 font-bold">{openSection === 'core' ? '−' : '+'}</span>
                </div>
              </button>

              {openSection === 'core' && (
                <div className="px-4 md:px-6 pb-4 md:pb-6">
                  <ul className="space-y-2 md:space-y-2.5 text-gray-300 text-sm md:text-base">
                    <li className="flex items-start"><span className="text-green-400 mr-2">•</span>Lawn mowing & edging</li>
                    <li className="flex items-start"><span className="text-green-400 mr-2">•</span>Leaf blowing & cleanup</li>
                    <li className="flex items-start"><span className="text-green-400 mr-2">•</span>Mulch installation</li>
                    <li className="flex items-start"><span className="text-green-400 mr-2">•</span>Bush trimming & hedge shaping</li>
                    <li className="flex items-start"><span className="text-green-400 mr-2">•</span>Weed removal & prevention</li>
                    <li className="flex items-start"><span className="text-green-400 mr-2">•</span>Sod installation</li>
                    <li className="flex items-start"><span className="text-green-400 mr-2">•</span>Flower bed maintenance</li>
                    <li className="flex items-start"><span className="text-green-400 mr-2">•</span>Basic to premium landscape design</li>
                    <li className="flex items-start"><span className="text-green-400 mr-2">•</span>Gravel & rock placement</li>
                    <li className="flex items-start"><span className="text-green-400 mr-2">•</span>Pressure washing</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seasonal */}
          <Card className="bg-gray-900/60 border border-green-500/30 rounded-2xl">
            <CardContent className="p-0">
              <button
                onClick={() => toggleSection('seasonal')}
                className="w-full p-4 md:p-6 text-left hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex justify-between items-start md:items-center">
                  <div className="flex-1 pr-4">
                    <h3 className="text-lg md:text-xl font-bold text-white mb-1 md:mb-2">❄️ Seasonal & Winter Services</h3>
                    <p className="text-green-400 font-bold text-sm md:text-base shadow-lg shadow-green-500/20 bg-green-500/10 px-2 py-1 rounded-2xl inline-block">NC Only</p>
                  </div>
                  <span className="text-green-400 text-xl md:text-2xl flex-shrink-0 font-bold">{openSection === 'seasonal' ? '−' : '+'}</span>
                </div>
              </button>

              {openSection === 'seasonal' && (
                <div className="px-4 md:px-6 pb-4 md:pb-6">
                  <ul className="space-y-2 md:space-y-2.5 text-gray-300 text-sm md:text-base">
                    <li className="flex items-start"><span className="text-green-400 mr-2">•</span>Leaf removal</li>
                    <li className="flex items-start"><span className="text-green-400 mr-2">•</span>Gutter cleaning</li>
                    <li className="flex items-start"><span className="text-green-400 mr-2">•</span>Winter pruning</li>
                    <li className="flex items-start"><span className="text-green-400 mr-2">•</span>Holiday lighting install/removal</li>
                    <li className="flex items-start"><span className="text-green-400 mr-2">•</span>Snow removal</li>
                    <li className="flex items-start"><span className="text-green-400 mr-2">•</span>Ice salting</li>
                    <li className="flex items-start"><span className="text-green-400 mr-2">•</span>Seasonal plant protection</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={() => navigate('/get-quote')}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-8 py-3 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/25 text-lg"
          >
            Get Your Quote Today
          </button>
        </div>
      </div>
    </section>
  );
};

export default LuxuryServices;