import { type SupabaseClient } from "@supabase/supabase-js";

export async function signOutAndRedirect(
  supabase: SupabaseClient,
  redirectTo: string = "/client-login"
) {
  try {
    console.log("Starting logout process...");
    
    // Clear all cookies explicitly
    document.cookie.split(";").forEach(cookie => {
      const name = cookie.split("=")[0].trim();
      if (name.includes('supabase') || name.includes('auth') || name.includes('sb-')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });
    
    // Clear all auth-related data
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Supabase signOut error:", error);
    } else {
      console.log("Supabase signOut successful");
    }
    
    // Clear session storage
    try { 
      sessionStorage.clear(); 
      console.log("Session storage cleared");
    } catch (e) {
      console.error("Session storage clear failed:", e);
    }
    
    // Clear localStorage
    try { 
      localStorage.clear(); 
      console.log("Local storage cleared");
    } catch (e) {
      console.error("Local storage clear failed:", e);
    }

    // Force redirect
    console.log("Redirecting to:", redirectTo);
    window.location.href = redirectTo;
    
  } catch (error) {
    console.error("Logout process failed:", error);
    window.location.href = redirectTo;
  }
}
