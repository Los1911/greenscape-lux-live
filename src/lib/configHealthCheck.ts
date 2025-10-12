export interface SupabaseConfigHealth {
  envVars: { url: string | undefined; anonKey: string | undefined };
  localStorage: { url: string | undefined; anonKey: string | undefined };
  queryParams: { url: string | undefined; anonKey: string | undefined };
  activeSource: 'ENV' | 'LOCAL' | 'QUERY' | 'MISSING';
  errors: string[];
}

function maskKey(key: string | undefined): string | undefined {
  if (!key || key.length < 8) return key;
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

function getFromLocalStorage(): { url: string | undefined; anonKey: string | undefined } {
  try {
    return {
      url: localStorage.getItem('supabaseUrl') || localStorage.getItem('GSL_SUPABASE_URL') || undefined,
      anonKey: localStorage.getItem('supabaseAnonKey') || localStorage.getItem('GSL_SUPABASE_ANON') || undefined
    };
  } catch {
    return { url: undefined, anonKey: undefined };
  }
}

function getFromQueryParams(): { url: string | undefined; anonKey: string | undefined } {
  try {
    const params = new URLSearchParams(window.location.search);
    return {
      url: params.get('url') || undefined,
      anonKey: params.get('anon') || undefined
    };
  } catch {
    return { url: undefined, anonKey: undefined };
  }
}

export function checkSupabaseConfigHealth(): SupabaseConfigHealth {
  const env = (import.meta as any).env || {};
  
  const envVars = {
    url: env.VITE_SUPABASE_URL || env.VITE_database_URL || undefined,
    anonKey: env.VITE_SUPABASE_ANON_KEY || env.VITE_database_ANON_KEY || env.VITE_SUPABASE_ANON || undefined
  };

  const localStorage = getFromLocalStorage();
  const queryParams = getFromQueryParams();
  
  const errors: string[] = [];
  let activeSource: 'ENV' | 'LOCAL' | 'QUERY' | 'MISSING' = 'MISSING';

  // Determine active source
  if (envVars.url && envVars.anonKey) {
    activeSource = 'ENV';
  } else if (queryParams.url && queryParams.anonKey) {
    activeSource = 'QUERY';
  } else if (localStorage.url && localStorage.anonKey) {
    activeSource = 'LOCAL';
  } else {
    errors.push('No valid Supabase configuration found');
  }

  // Add specific errors
  if (!envVars.url && !envVars.anonKey) {
    errors.push('Environment variables not set');
  }
  if (!localStorage.url && !localStorage.anonKey) {
    errors.push('LocalStorage credentials not found');
  }

  return {
    envVars: {
      url: maskKey(envVars.url),
      anonKey: maskKey(envVars.anonKey)
    },
    localStorage: {
      url: maskKey(localStorage.url),
      anonKey: maskKey(localStorage.anonKey)
    },
    queryParams: {
      url: maskKey(queryParams.url),
      anonKey: maskKey(queryParams.anonKey)
    },
    activeSource,
    errors
  };
}