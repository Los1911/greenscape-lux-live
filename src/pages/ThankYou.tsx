import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function ThankYou() {
  const { user } = useAuth(); // Use AuthContext instead of direct supabase call
  const [countdown, setCountdown] = useState(8);
  const [showCountdown, setShowCountdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Only start countdown if user is logged in
    if (user) {
      setShowCountdown(true);
      
      // Start countdown timer
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/client-dashboard');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Fade out countdown message after 6 seconds
      const fadeTimer = setTimeout(() => {
        setShowCountdown(false);
      }, 6000);

      return () => {
        clearInterval(timer);
        clearTimeout(fadeTimer);
      };
    }
  }, [user, navigate]); // Depend on user from AuthContext

  const isLoggedIn = !!user; // Derive from AuthContext user

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-black/90 backdrop-blur-sm rounded-2xl border border-green-500/20 p-8 md:p-12 shadow-2xl shadow-green-500/10">
          <div className="text-center space-y-6">
            {/* Thank You Heading */}
            <h1 className="text-4xl md:text-5xl font-bold text-green-400 mb-6 animate-pulse">
              Thank You!
            </h1>
            
            {/* Confirmation Message */}
            <div className="space-y-4">
              <p className="text-white text-lg md:text-xl leading-relaxed">
                Your quote request has been received.
              </p>
              <p className="text-gray-300 text-base md:text-lg">
                We'll follow up with your personalized estimate shortly.
              </p>
            </div>

            {/* Countdown Message */}
            {isLoggedIn && showCountdown && (
              <div className={`transition-opacity duration-1000 ${showCountdown ? 'opacity-100' : 'opacity-0'}`}>
                <p className="text-green-300 text-sm">
                  Redirecting to your dashboard in {countdown} seconds...
                </p>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="pt-8 space-y-4">
              {/* Back to Dashboard Button - Only for logged in users */}
              {isLoggedIn && (
                <div className="animate-fade-in">
                  <Link to="/client-dashboard">
                    <Button 
                      className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white px-8 py-3 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg shadow-green-500/40 hover:shadow-green-400/60 hover:scale-105 border border-green-400/30 hover:border-green-300/50 glow-green mb-4"
                    >
                      Back to Dashboard
                    </Button>
                  </Link>
                </div>
              )}
              
              {/* Return Home Button */}
              <div className="animate-fade-in-delayed">
                <Link to="/">
                  <Button 
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-all duration-300 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105"
                  >
                    Return to Home
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}