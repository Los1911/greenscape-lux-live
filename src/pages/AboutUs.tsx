import React, { useEffect } from 'react';
import SiteChrome from '@/components/SiteChrome';
import AnimatedBackground from '@/components/AnimatedBackground';



const AboutUs: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <SiteChrome>

      <div className="relative">
        <AnimatedBackground />
        
        <div className="relative z-10">
          {/* About Section */}
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                About <span className="text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.5)]">GreenScape Lux</span>
              </h1>
              
              <h2 className="text-xl md:text-2xl text-green-400 mb-8 drop-shadow-[0_0_15px_rgba(74,222,128,0.3)]">
                Elevated Outdoor Living. Backed by Decades of Experience
              </h2>
              
              <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
                <p>
                  At GreenScape Lux, luxury begins outdoors. We transform everyday lawns into high end landscapes that speak to style, comfort, and craftsmanship.
                </p>
                
                <p>
                  Co-founded by Carlos Matthews and Bradley Green, GreenScape Lux is the result of over 25 combined years of professionalism across customer service, operations, and elite landscaping.
                </p>
                
                <p className="text-green-400 font-semibold">
                  We are not just building beautiful yards. We are building a legacy of elevated outdoor living.
                </p>
              </div>
            </div>
          </section>

          {/* Founders Section */}
          <section className="container mx-auto px-4 py-16">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
              <span className="text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.5)]">👔 Meet the Founders</span>
            </h2>
            
            <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-green-400/20">
                <h3 className="text-2xl font-bold text-white mb-2">Carlos Matthews</h3>
                <p className="text-green-400 mb-6 font-semibold">Co-Founder • Director of Customer Relations</p>
                
                <p className="text-gray-300 leading-relaxed mb-4">
                  With over a decade in leadership and client experience, Carlos is the strategic force behind our white glove service. He brings an unmatched passion for people and process, ensuring every GreenScape Lux client feels informed, cared for, and confident throughout their journey.
                </p>
                
                <p className="text-green-400 font-medium">
                  Carlos sets the tone for luxury level communication and professionalism from the first click to the final walkthrough.
                </p>
              </div>

              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-green-400/20">
                <h3 className="text-2xl font-bold text-white mb-2">Bradley Green</h3>
                <p className="text-green-400 mb-6 font-semibold">Co-Founder • Director of Field Operations</p>
                
                <p className="text-gray-300 leading-relaxed mb-4">
                  Bradley has spent more than 15 years mastering the art of landscaping. As the owner of BeGreen Landscaping and now the co-founder of GreenScape Lux, his expertise spans everything from residential lawn care to premium outdoor installations.
                </p>
                
                <p className="text-green-400 font-medium">
                  Bradley leads every project with integrity, excellence, and a reputation that speaks for itself — because he has built it yard by yard.
                </p>
              </div>
            </div>
          </section>


        </div>
        

      </div>
    </SiteChrome>

  );
};

export default AboutUs;