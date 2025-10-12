import React, { useState } from "react";
import { useSupabaseClient } from "@/lib/ConfigContext";
import { signOutAndRedirect } from "@/lib/logout";

interface LogoutButtonProps {
  to?: string;
  className?: string;
}

export default function LogoutButton({ to = "/", className = "" }: LogoutButtonProps) {
  const supabase = useSupabaseClient();
  const [busy, setBusy] = useState(false);
  
  return (
    <button
      onClick={async () => { 
        if (busy) return; 
        setBusy(true); 
        await signOutAndRedirect(supabase, to); 
        setBusy(false); 
      }}
      disabled={busy}
      className={`rounded-full bg-red-500 text-black px-3 py-1 font-semibold hover:bg-red-400 disabled:opacity-60 ${className}`}
      aria-label="Logout"
    >
      {busy ? "Logging out…" : "Logout"}
    </button>
  );
}