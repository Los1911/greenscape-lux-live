import React from 'react';

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * AppLayout - Main layout wrapper for authenticated/protected pages
 * 
 * Provides consistent dark theme styling matching GreenScape Lux branding.
 * Used by client mode pages like ClientQuoteForm, profile pages, etc.
 */
const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="bg-gray-950 text-white min-h-screen w-full overflow-x-hidden">
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};


export default AppLayout;
