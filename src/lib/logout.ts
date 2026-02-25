import { type SupabaseClient } from "@supabase/supabase-js";

export async function signOutAndRedirect(
  supabase: SupabaseClient,
  redirectTo: string = "/portal-login"
) {
  try {
    console.log("Starting logout process...");
    
    // Use scope: 'local' to avoid "Auth session missing" errors
    // This clears the local session without requiring a server call
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    
    if (error) {
      // "Auth session missing" is expected if already logged out
      if (!error.message?.includes('session missing')) {
        console.error("Supabase signOut error:", error);
      }
    } else {
      console.log("Supabase signOut successful");
    }
    
    // Clear ONLY auth-related cookies (not all cookies)
    document.cookie.split(";").forEach(cookie => {
      const name = cookie.split("=")[0].trim();
      if (name.includes('supabase') || name.includes('auth') || name.includes('sb-')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });
    
    // Clear ONLY auth-related session storage
    try { 
      sessionStorage.removeItem('user_role');
      sessionStorage.removeItem('user_role_timestamp');
      console.log("Session storage auth keys cleared");
    } catch (e) {
      console.error("Session storage clear failed:", e);
    }
    
    // Clear ONLY auth-related localStorage keys
    try { 
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('auth') || key.includes('sb-') || key.includes('greenscape-lux'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log("Local storage auth keys cleared");
    } catch (e) {
      console.error("Local storage clear failed:", e);
    }

    // Force redirect with full page reload
    console.log("Redirecting to:", redirectTo);
    window.location.replace(redirectTo);
    
  } catch (error) {
    console.error("Logout process failed:", error);
    window.location.replace(redirectTo);
  }
}
