import React from 'react';
import AppLayout from '../components/AppLayout';
import { Card } from '../components/ui/card';

const Professionals: React.FC = () => {
  return (
    <AppLayout>
      <div className="min-h-screen bg-black text-white py-12 pb-6">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header Section */}
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-5xl font-bold mb-6">
              🔍 <span className="text-white">Find a</span>{' '}
              <span className="text-green-400 glow-text">Landscaping Professional</span>{' '}
              <br />
              <span className="text-white">You Can Trust</span>
            </h1>
            <h2 className="text-lg md:text-xl text-white mb-6">
              Connecting You With Charlotte's Most Trusted Landscape Experts
            </h2>
            <p className="text-gray-300 text-base max-w-3xl mx-auto leading-relaxed">
              GreenScape Lux partners with certified, vetted landscapers who take pride in delivering premium outdoor results. Whether you need a one time service or a full landscape renovation, our platform connects you with professionals ready to exceed your expectations.
            </p>
          </div>

          {/* How It Works Section */}
          <div className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
              💼 <span className="text-green-400 glow-text">How It Works</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-gray-900/50 border-green-500/30 p-8 text-center hover:border-green-400/50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(74,222,128,0.2)] h-full flex flex-col">
                <div className="text-green-400 text-4xl mb-4">1️⃣</div>
                <h3 className="text-white font-bold text-xl mb-4">Request an Estimate</h3>
                <p className="text-gray-300 text-sm flex-1">Fill out our estimate request form with details about your property, needs, and timeline.</p>
              </Card>


              <Card className="bg-gray-900/50 border-green-500/30 p-8 text-center hover:border-green-400/50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(74,222,128,0.2)] h-full flex flex-col">
                <div className="text-green-400 text-4xl mb-4">2️⃣</div>
                <h3 className="text-white font-bold text-xl mb-4">Get Matched</h3>
                <p className="text-gray-300 text-sm flex-1">We assign your request to a top-rated landscaper in our network based on location, availability, and service type.</p>
              </Card>

              <Card className="bg-gray-900/50 border-green-500/30 p-8 text-center hover:border-green-400/50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(74,222,128,0.2)] h-full flex flex-col">
                <div className="text-green-400 text-4xl mb-4">3️⃣</div>
                <h3 className="text-white font-bold text-xl mb-4">Review and Approve</h3>
                <p className="text-gray-300 text-sm flex-1">You receive a detailed quote, schedule a consultation, and approve the job when ready.</p>
              </Card>
            </div>
          </div>

          {/* Services & Benefits Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            {/* Left Column - Services Offered */}
            <Card className="bg-gray-900/50 border-green-500/30 p-8 hover:border-green-400/50 transition-all duration-300 h-full">
              <h3 className="text-xl font-bold mb-6">
                🛠️ <span className="text-green-400 glow-text">Services Offered</span>
              </h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center">
                  <span className="text-green-400 mr-3 text-lg">•</span>
                  <span>Lawn Maintenance</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-3 text-lg">•</span>
                  <span>Mulch and Rock Installation</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-3 text-lg">•</span>
                  <span>Seasonal Cleanups</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-3 text-lg">•</span>
                  <span>Hardscaping and Custom Features</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-3 text-lg">•</span>
                  <span>Tree and Shrub Care</span>
                </li>
              </ul>
            </Card>


            {/* Right Column - Why Choose */}
            <Card className="bg-gray-900/50 border-green-500/30 p-8 hover:border-green-400/50 transition-all duration-300 h-full">
              <h3 className="text-xl font-bold mb-6">
                🌟 <span className="text-green-400 glow-text">Why Choose Our Professionals?</span>
              </h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center">
                  <span className="text-green-400 mr-3 text-lg">•</span>
                  <span>Verified skills and local reputation</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-3 text-lg">•</span>
                  <span>Licensed and insured</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-3 text-lg">•</span>
                  <span>Fast response times</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-3 text-lg">•</span>
                  <span>High-end results with no stress</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-3 text-lg">•</span>
                  <span>Competitive pricing</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-3 text-lg">•</span>
                  <span>Quality guarantee on all work</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Professionals;