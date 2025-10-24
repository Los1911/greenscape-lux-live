import React, { useState, useEffect } from "react";
import { getRuntimeConfig } from "@/lib/runtimeConfig";

export default function ConfigGate({ children }: { children: React.ReactNode }) {
  const [configError, setConfigError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initConfig = async () => {
      try {
        const cfg = getRuntimeConfig();
        
        // In production, always allow the app to load with fallback values
        const isProduction = typeof window !== 'undefined' && 
          (window.location.hostname !== 'localhost' && 
           !window.location.hostname.includes('127.0.0.1'));
        
        if (isProduction) {
          console.info("✅ Production mode: Using configuration fallbacks");
          setIsReady(true);
          return;
        }
        
        // In development, validate that we have actual values
        if (!cfg.url || !cfg.anon || cfg.url === 'undefined' || cfg.anon === 'undefined') {
          throw new Error('Development environment requires proper configuration');
        }
        
        console.info("✅ Configuration validated:", { 
          url: cfg.url.replace(/https?:\/\//, '').split('.')[0] + '...', 
          source: cfg.source 
        });
        
        setIsReady(true);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Configuration error';
        console.error("❌ Config validation failed:", errorMsg);
        setConfigError(errorMsg);
        setIsReady(true);
      }
    };

    initConfig();
  }, []);


  if (configError) {
    // Redirect to setup page instead of showing inline error
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/setup')) {
      window.location.href = '/setup';
      return null;
    }
    
    // If we're already on setup page, show error inline
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        zIndex: 9999,
        padding: '1rem'
      }}>
        <div style={{
          maxWidth: '32rem',
          width: '100%',
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚨</div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#dc2626',
              marginBottom: '1rem',
              lineHeight: '1.2'
            }}>
              Environment Configuration Required
            </h1>
            <p style={{
              color: '#374151',
              marginBottom: '1.5rem',
              lineHeight: '1.6',
              fontSize: '1rem'
            }}>
              {configError}
            </p>
            <div style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              backgroundColor: '#f9fafb',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginTop: '1rem',
              textAlign: 'left',
              lineHeight: '1.5'
            }}>
              <strong style={{ color: '#374151' }}>Setup Instructions:</strong><br/><br/>
              1. Go to <strong>Vercel Dashboard</strong><br/>
              2. Select your project → <strong>Settings</strong> → <strong>Environment Variables</strong><br/>
              3. Add these variables:<br/>
              &nbsp;&nbsp;• <code>VITE_SUPABASE_URL</code><br/>
              &nbsp;&nbsp;• <code>VITE_SUPABASE_ANON_KEY</code><br/>
              4. Set for <strong>Production, Preview, and Development</strong><br/>
              5. <strong>Redeploy</strong> your application
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="fixed inset-0 min-h-screen flex items-center justify-center bg-gray-900 text-white z-50">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">🌿</div>
          <div className="text-xl">Loading GreenScape Lux...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}