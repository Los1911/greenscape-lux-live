import React from 'react';

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * AppLayout - Main layout wrapper for authenticated/protected pages
 * 
 * Provides consistent dark theme styling matching GreenScape Lux branding.
 * Uses 100dvh for proper mobile viewport handling (iOS Safari address bar).
 * Safe area insets handled globally via index.css on body.
 */
const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div
      className="bg-gray-950 text-white w-full overflow-x-hidden relative"
      style={{
        minHeight: '100dvh',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};


export default AppLayout;
