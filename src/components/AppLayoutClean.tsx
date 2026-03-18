import React from 'react';

interface AppLayoutCleanProps {
  children: React.ReactNode;
}

export default function AppLayoutClean({ children }: AppLayoutCleanProps) {
  return (
    <div
      className="bg-black text-white w-full overflow-x-hidden relative"
      style={{
        minHeight: '100dvh',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <main className="relative z-10 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
