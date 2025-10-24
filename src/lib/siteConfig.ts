// Site configuration utility
export const getSiteUrl = (): string => {
  // Always use the production URL for consistency
  return 'https://greenscapelux.com';
};

export const getResetPasswordUrl = (email?: string): string => {
  const baseUrl = getSiteUrl();
  const path = '/reset-password';
  
  // Don't add email parameter - Supabase handles tokens via URL hash
  return `${baseUrl}${path}`;
};