import React, { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfigGateProps {
  children: ReactNode;
}

export function ConfigGate({ children }: ConfigGateProps) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const hasRequiredConfig = supabaseUrl && supabaseKey;

  if (!hasRequiredConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-gray-800/50 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <h1 className="text-2xl font-bold text-white">Configuration Required</h1>
          </div>
          
          <div className="space-y-4 text-gray-300">
            <p className="text-lg">Your application is missing required environment variables.</p>
            
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-white">Missing Variables:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {!supabaseUrl && <li>VITE_SUPABASE_URL</li>}
                {!supabaseKey && <li>VITE_SUPABASE_PUBLISHABLE_KEY</li>}
              </ul>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <p className="font-semibold text-blue-300 mb-2">For Vercel Deployment:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-200">
                <li>Go to your Vercel Dashboard</li>
                <li>Navigate to Settings → Environment Variables</li>
                <li>Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY</li>
                <li>Set for Production, Preview, and Development</li>
                <li>Redeploy your application</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
