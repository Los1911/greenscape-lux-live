// Secure logging utility to prevent sensitive data exposure
const SENSITIVE_KEYS = [
  'password', 'token', 'secret', 'key', 'hash', 'session',
  'anon', 'jwt', 'auth', 'credential', 'private'
];

const isDev = import.meta.env.DEV;

function sanitizeData(data: any): any {
  if (typeof data === 'string') {
    return SENSITIVE_KEYS.some(key => 
      data.toLowerCase().includes(key)
    ) ? '[REDACTED]' : data;
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      const keyLower = key.toLowerCase();
      if (SENSITIVE_KEYS.some(sensitive => keyLower.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeData(value);
      }
    }
    return sanitized;
  }
  
  return data;
}

export const secureLog = {
  info: (...args: any[]) => {
    if (isDev) {
      console.log(...args.map(sanitizeData));
    }
  },
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args.map(sanitizeData));
    }
  },
  error: (...args: any[]) => {
    console.error(...args.map(sanitizeData));
  }
};