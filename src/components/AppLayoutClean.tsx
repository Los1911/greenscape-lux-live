import React from 'react';

interface AppLayoutCleanProps {
  children: React.ReactNode;
}

export default function AppLayoutClean({ children }: AppLayoutCleanProps) {
  return (
    <div className="bg-black text-white min-h-screen">
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}