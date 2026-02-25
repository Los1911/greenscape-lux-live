import React, { useState } from "react";
import { globalLogout } from "@/utils/globalLogout";

interface LogoutButtonProps {
  to?: string;
  className?: string;
}

export default function LogoutButton({ to = "/portal-login", className = "" }: LogoutButtonProps) {
  const [busy, setBusy] = useState(false);
  
  return (
    <button
      onClick={async () => { 
        if (busy) return; 
        setBusy(true); 
        await globalLogout(to); 
        // No need to set busy to false - page will redirect
      }}
      disabled={busy}
      className={`rounded-full bg-red-500 text-black px-3 py-1 font-semibold hover:bg-red-400 disabled:opacity-60 ${className}`}
      aria-label="Logout"
    >
      {busy ? "Logging out…" : "Logout"}
    </button>
  );
}
