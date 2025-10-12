import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { getRuntimeConfig } from './runtimeConfig';

interface ConfigContextType {
  url: string | null;
  anon: string | null;
  setConfigOpen: (open: boolean) => void;
}

const ConfigContext = createContext<ConfigContextType | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
  // Don't call getRuntimeConfig here as ConfigGate handles validation
  // Just provide a basic context that components can use
  const contextValue = useMemo(() => ({
    url: null, // Will be set by individual components that need it
    anon: null, // Will be set by individual components that need it  
    setConfigOpen: () => {} // No-op since ConfigGate handles this now
  }), []);

  return (
    <ConfigContext.Provider value={contextValue}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within ConfigProvider');
  }
  return context;
}

export function useSupabaseClient() {
  return supabase;
}