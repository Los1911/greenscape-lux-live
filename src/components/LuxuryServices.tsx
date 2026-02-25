import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

const services = [
  {
    number: 1,
    helperText: 'Start with a quick request. We handle the rest.'
  },
  {
    number: 2,
    helperText: 'Tell us your vision. Receive a tailored proposal.'
  },
  {
    number: 3,
    helperText: 'Request service. We match you with a vetted professional.'
  },
  {
    number: 4,
    helperText: 'Submit details. Smart solutions follow.'
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
          How GreenScape Lux Works
        </h2>

        
        {/* Service Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-8 md:mb-10">
          {services.map((service, index) => (
            <Card 
              key={index}
              className="bg-gray-900/60 border-0 ring-1 ring-emerald-500/20 shadow-lg shadow-emerald-900/20 hover:ring-emerald-400/40 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 group rounded-2xl"
            >
              <CardContent className="p-4 md:p-6 text-center h-full flex flex-col justify-center">
                {/* Large Centered Step Number */}
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gray-900/90 ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
                    <span className="text-emerald-400 text-xl md:text-2xl font-light tracking-wide">{service.number}</span>
                  </div>
                </div>
                <p className="text-white text-sm md:text-base mt-2 leading-relaxed font-medium tracking-wide antialiased">

                  {service.helperText}
                </p>

              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Services */}
        <div className="space-y-3 md:space-y-4 mb-8 md:mb-10">

          {/* Core Year-Round Services */}
          <Card className="bg-gray-900/60 border-0 ring-1 ring-emerald-500/20 shadow-lg shadow-emerald-900/20 hover:ring-emerald-400/50 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 rounded-2xl">
            <CardContent className="p-0">
              <button
                onClick={() => toggleSection('core')}
                className="w-full p-4 md:p-6 text-left hover:bg-emerald-900/10 transition-colors rounded-2xl"
              >
                <div className="flex justify-between items-start md:items-center">
                  <div className="flex-1 pr-4">
                    <h3 className="text-lg md:text-xl font-bold text-white mb-1 md:mb-2">🌿 Core Year-Round Services</h3>
                    <p className="text-emerald-400 font-bold text-sm md:text-base shadow-lg shadow-emerald-500/10 bg-emerald-500/10 px-2 py-1 rounded-2xl inline-block">Available in NC & FL</p>
                  </div>
                  <span className="text-emerald-400 text-xl md:text-2xl flex-shrink-0 font-bold">{openSection === 'core' ? '−' : '+'}</span>
                </div>
              </button>
              
              {openSection === 'core' && (
                <div className="px-4 md:px-6 pb-4 md:pb-6">
                  <ul className="space-y-2 md:space-y-2.5 text-gray-300 text-sm md:text-base">
                    <li className="flex items-start"><span className="text-emerald-400 mr-2">•</span>Lawn mowing & edging</li>
                    <li className="flex items-start"><span className="text-emerald-400 mr-2">•</span>Leaf blowing & cleanup</li>
                    <li className="flex items-start"><span className="text-emerald-400 mr-2">•</span>Mulch installation</li>
                    <li className="flex items-start"><span className="text-emerald-400 mr-2">•</span>Bush trimming & hedge shaping</li>
                    <li className="flex items-start"><span className="text-emerald-400 mr-2">•</span>Weed removal & prevention</li>
                    <li className="flex items-start"><span className="text-emerald-400 mr-2">•</span>Sod installation</li>
                    <li className="flex items-start"><span className="text-emerald-400 mr-2">•</span>Flower bed maintenance</li>
                    <li className="flex items-start"><span className="text-emerald-400 mr-2">•</span>Basic to premium landscape design</li>
                    <li className="flex items-start"><span className="text-emerald-400 mr-2">•</span>Gravel & rock placement</li>
                    <li className="flex items-start"><span className="text-emerald-400 mr-2">•</span>Pressure washing (driveways, walkways)</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seasonal & Winter Services */}
          <Card className="bg-gray-900/60 border-0 ring-1 ring-emerald-500/20 shadow-lg shadow-emerald-900/20 hover:ring-emerald-400/50 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 rounded-2xl">
            <CardContent className="p-0">
              <button
                onClick={() => toggleSection('seasonal')}
                className="w-full p-4 md:p-6 text-left hover:bg-emerald-900/10 transition-colors rounded-2xl"
              >
                <div className="flex justify-between items-start md:items-center">
                  <div className="flex-1 pr-4">
                    <h3 className="text-lg md:text-xl font-bold text-white mb-1 md:mb-2">❄️ Seasonal & Winter Services</h3>
                    <p className="text-emerald-400 font-bold text-sm md:text-base shadow-lg shadow-emerald-500/10 bg-emerald-500/10 px-2 py-1 rounded-2xl inline-block">NC Only</p>
                  </div>
                  <span className="text-emerald-400 text-xl md:text-2xl flex-shrink-0 font-bold">{openSection === 'seasonal' ? '−' : '+'}</span>
                </div>
              </button>
              
              {openSection === 'seasonal' && (
                <div className="px-4 md:px-6 pb-4 md:pb-6">
                  <ul className="space-y-2 md:space-y-2.5 text-gray-300 text-sm md:text-base">
                    <li className="flex items-start"><span className="text-emerald-400 mr-2">•</span>Leaf removal</li>
                    <li className="flex items-start"><span className="text-emerald-400 mr-2">•</span>Gutter cleaning</li>
                    <li className="flex items-start"><span className="text-emerald-400 mr-2">•</span>Winter pruning (shrubs, small trees)</li>
                    <li className="flex items-start"><span className="text-emerald-400 mr-2">•</span>Holiday lighting installation/removal</li>
                    <li className="flex items-start"><span className="text-emerald-400 mr-2">•</span>Snow removal (driveways, walkways)</li>
                    <li className="flex items-start"><span className="text-emerald-400 mr-2">•</span>Ice salting and de-icing</li>
                    <li className="flex items-start"><span className="text-emerald-400 mr-2">•</span>Seasonal plant protection and dormancy prep</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Call to Action */}
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
