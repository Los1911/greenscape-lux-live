import React from 'react';
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-lg mx-auto">
          <div className="mb-8">
            <h1 className="text-8xl font-bold text-emerald-400 mb-4 drop-shadow-[0_0_20px_rgba(34,197,94,0.6)]">
              404
            </h1>
            <h2 className="text-3xl font-bold text-white mb-4">Page Not Found</h2>
            <p className="text-xl text-gray-300 mb-8">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 px-6 py-3"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Link to="/">
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-black px-6 py-3">
                <Home className="w-4 h-4 mr-2" />
                Return Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default NotFound;