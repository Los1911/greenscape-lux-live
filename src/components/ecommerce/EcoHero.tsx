import React from 'react';
import { ArrowRight, Leaf, Recycle, Heart } from 'lucide-react';

export default function EcoHero() {
  return (
    <section className="relative bg-gradient-to-br from-green-50 to-emerald-100 overflow-hidden">
      <div className="absolute inset-0">
        <img 
          src="https://d64gsuwffb70l.cloudfront.net/68875f8ee1bf860dd7a01934_1756431012288_08352679.webp"
          alt="Sustainable products"
          className="w-full h-full object-cover opacity-20"
        />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Leaf className="h-6 w-6 text-green-600" />
              <span className="text-green-600 font-semibold">100% Sustainable</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Live
              <span className="text-green-600"> Sustainably</span>
              <br />
              Shop Consciously
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Discover eco-friendly products that make a difference. From bamboo essentials to zero-waste solutions, 
              every purchase helps build a greener future.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors duration-200">
                <span>Shop Now</span>
                <ArrowRight className="h-5 w-5" />
              </button>
              
              <button className="border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white px-8 py-4 rounded-lg font-semibold transition-colors duration-200">
                Learn More
              </button>
            </div>
            
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <Recycle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-600">100% Recyclable</span>
              </div>
              <div className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-600">Ethically Sourced</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">This Week's Impact</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">2,847</div>
                  <div className="text-sm text-gray-600">Trees Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">1,234</div>
                  <div className="text-sm text-gray-600">Plastic Reduced</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">567</div>
                  <div className="text-sm text-gray-600">CO₂ Offset</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">890</div>
                  <div className="text-sm text-gray-600">Happy Customers</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}