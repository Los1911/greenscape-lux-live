import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface SiteChromeProps {
  children: React.ReactNode;
}

const SiteChrome: React.FC<SiteChromeProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#050b08] flex flex-col">
      {/* Emerald glow background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/5 via-transparent to-emerald-800/5" />
      </div>
      
      <Header />
      
      <main className="flex-1 relative z-10">
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SiteChrome;