import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

const JobComplete: React.FC = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-black/60 backdrop-blur-lg border border-green-500/30 rounded-2xl p-8 shadow-2xl shadow-green-500/20">
          
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-400 animate-bounce" />
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-6 animate-pulse">
            Job Marked as Complete!
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl text-green-400 text-center mb-8">
            Your update has been submitted and is now under review.
          </p>
          
          {/* Button */}
          <div className="flex justify-center mb-6">
            <Link to="/landscaper-dashboard">
              <Button className="bg-green-500 hover:bg-green-600 text-black font-semibold px-8 py-3 rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 transition-all duration-300 text-lg">
                Return to Dashboard
              </Button>
            </Link>
          </div>
          
          {/* Thank You Message */}
          <p className="text-gray-400 text-center text-sm">
            Thanks for helping us maintain quality landscaping experiences.
          </p>
        </div>
      </div>
    </div>
  );
};

export default JobComplete;