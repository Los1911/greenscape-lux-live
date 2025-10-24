import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

const PremiumServices: React.FC = () => {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <section className="py-16 px-4 relative z-10 bg-black">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
          Premium Services
        </h2>
        
        <div className="space-y-4">
          {/* Core Year-Round Services */}
          <Card className="bg-gray-900/60 border border-green-500/30">
            <CardContent className="p-0">
              <button
                onClick={() => toggleSection('core')}
                className="w-full p-6 text-left hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">🌿 Core Year-Round Services</h3>
                    <p className="text-green-400 font-semibold">Available in NC & FL</p>
                  </div>
                  <span className="text-green-400 text-2xl">{openSection === 'core' ? '−' : '+'}</span>
                </div>
              </button>
              
              {openSection === 'core' && (
                <div className="px-6 pb-6">
                  <ul className="space-y-2 text-gray-300">
                    <li>• Lawn mowing & edging</li>
                    <li>• Leaf blowing & cleanup</li>
                    <li>• Mulch installation</li>
                    <li>• Bush trimming & hedge shaping</li>
                    <li>• Weed removal & prevention</li>
                    <li>• Sod installation</li>
                    <li>• Flower bed maintenance</li>
                    <li>• Basic to premium landscape design</li>
                    <li>• Gravel & rock placement</li>
                    <li>• Pressure washing (driveways, walkways)</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seasonal & Winter Services */}
          <Card className="bg-gray-900/60 border border-green-500/30">
            <CardContent className="p-0">
              <button
                onClick={() => toggleSection('seasonal')}
                className="w-full p-6 text-left hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">❄️ Seasonal & Winter Services</h3>
                    <p className="text-green-400 font-semibold">NC Only</p>
                  </div>
                  <span className="text-green-400 text-2xl">{openSection === 'seasonal' ? '−' : '+'}</span>
                </div>
              </button>
              
              {openSection === 'seasonal' && (
                <div className="px-6 pb-6">
                  <ul className="space-y-2 text-gray-300">
                    <li>• Leaf removal</li>
                    <li>• Gutter cleaning</li>
                    <li>• Winter pruning (shrubs, small trees)</li>
                    <li>• Holiday lighting installation/removal</li>
                    <li>• Snow removal (driveways, walkways)</li>
                    <li>• Ice salting and de-icing</li>
                    <li>• Seasonal plant protection and dormancy prep</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default PremiumServices;