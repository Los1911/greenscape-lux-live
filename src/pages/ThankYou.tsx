import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RefreshCw, CheckCircle, Clock, Mail, FileText, CalendarCheck } from 'lucide-react';

// =============================================================================
// TIMELINE STEP COMPONENT
// =============================================================================

interface TimelineStepProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming';
  isLast?: boolean;
}

function TimelineStep({ icon, title, description, status, isLast = false }: TimelineStepProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'completed':
        return {
          iconBg: 'bg-green-500',
          iconColor: 'text-white',
          lineColor: 'bg-green-500',
          titleColor: 'text-green-400',
          descColor: 'text-gray-400'
        };
      case 'current':
        return {
          iconBg: 'bg-green-500/20 ring-2 ring-green-500 ring-offset-2 ring-offset-black',
          iconColor: 'text-green-400',
          lineColor: 'bg-gray-700',
          titleColor: 'text-white',
          descColor: 'text-gray-300'
        };
      case 'upcoming':
        return {
          iconBg: 'bg-gray-800',
          iconColor: 'text-gray-500',
          lineColor: 'bg-gray-700',
          titleColor: 'text-gray-400',
          descColor: 'text-gray-500'
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <div className="flex items-start gap-3 sm:gap-4">
      {/* Icon and Line */}
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${styles.iconBg} transition-all duration-300`}>
          <div className={styles.iconColor}>
            {icon}
          </div>
        </div>
        {!isLast && (
          <div className={`w-0.5 h-12 sm:h-16 mt-2 ${styles.lineColor} transition-all duration-300`} />
        )}
      </div>
      
      {/* Content */}
      <div className="pt-1 sm:pt-2 pb-4">
        <h4 className={`font-semibold text-sm sm:text-base ${styles.titleColor} transition-colors`}>
          {title}
          {status === 'completed' && (
            <CheckCircle className="w-4 h-4 inline-block ml-2 text-green-500" />
          )}
        </h4>
        <p className={`text-xs sm:text-sm mt-1 ${styles.descColor} max-w-[200px] sm:max-w-none`}>
          {description}
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ThankYou() {
  const { user, loading: authLoading } = useAuth();
  const [countdown, setCountdown] = useState(10);
  const [showCountdown, setShowCountdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Don't start countdown until auth is resolved
    if (authLoading) return;
    
    // Only start countdown if user is logged in
    if (user) {
      setShowCountdown(true);
      
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

      const fadeTimer = setTimeout(() => {
        setShowCountdown(false);
      }, 8000);

      return () => {
        clearInterval(timer);
        clearTimeout(fadeTimer);
      };
    }
  }, [authLoading, user, navigate]);

  // Auth loading guard
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-black/90 backdrop-blur-sm rounded-2xl border border-green-500/20 p-6 sm:p-8 md:p-12 shadow-2xl shadow-green-500/10">
          <div className="text-center space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse">
                <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-400" />
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-green-400 mb-4 sm:mb-6">
              Your estimate request is on its way!
            </h1>
            
            <p className="text-gray-300 text-base sm:text-lg max-w-lg mx-auto">
              We've received your request and our team is ready to prepare your personalized estimate.
            </p>

            {/* Visual Timeline */}
            <div className="bg-gray-900/50 border border-green-500/20 rounded-xl p-5 sm:p-6 mt-6 sm:mt-8 text-left">
              <h3 className="text-green-400 font-semibold text-center mb-6 text-sm sm:text-base">
                What Happens Next
              </h3>
              
              <div className="space-y-0">
                <TimelineStep
                  icon={<CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />}
                  title="Request Received"
                  description="Your estimate request has been submitted successfully."
                  status="completed"
                />
                
                <TimelineStep
                  icon={<Clock className="w-5 h-5 sm:w-6 sm:h-6" />}
                  title="Review (24-48 hours)"
                  description="Our team evaluates your property and service needs."
                  status="current"
                />
                
                <TimelineStep
                  icon={<Mail className="w-5 h-5 sm:w-6 sm:h-6" />}
                  title="Estimate Sent"
                  description="You'll receive a detailed, personalized estimate via email."
                  status="upcoming"
                />
                
                <TimelineStep
                  icon={<CalendarCheck className="w-5 h-5 sm:w-6 sm:h-6" />}
                  title="Book Service"
                  description="Review your estimate and schedule your service."
                  status="upcoming"
                  isLast
                />
              </div>
            </div>

            {/* Confirmation Email Notice */}
            <div className="flex items-center justify-center gap-3 text-gray-400 text-sm bg-gray-900/30 rounded-lg p-3 mt-4">
              <FileText className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span>A confirmation email has been sent to your inbox.</span>
            </div>

            {isLoggedIn && showCountdown && (
              <div className={`transition-opacity duration-1000 ${showCountdown ? 'opacity-100' : 'opacity-0'}`}>
                <p className="text-green-300 text-sm">
                  Redirecting to your dashboard in {countdown} seconds...
                </p>
              </div>
            )}
            
            <div className="pt-6 sm:pt-8 space-y-3 sm:space-y-4">
              {isLoggedIn && (
                <div className="animate-fade-in">
                  <Link to="/client-dashboard">
                    <Button 
                      className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white px-6 sm:px-8 py-3 rounded-xl text-base sm:text-lg font-semibold transition-all duration-300 shadow-lg shadow-green-500/40 hover:shadow-green-400/60 hover:scale-105 border border-green-400/30 hover:border-green-300/50 glow-green mb-3 sm:mb-4"
                    >
                      Back to Dashboard
                    </Button>
                  </Link>
                </div>
              )}
              
              <div className="animate-fade-in-delayed">
                <Link to="/">
                  <Button 
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-6 sm:px-8 py-3 rounded-lg text-base sm:text-lg font-semibold transition-all duration-300 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105"
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
