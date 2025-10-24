import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLocation, useNavigate } from "react-router-dom";
// READ-ONLY hook - no profile creation

export function useAuthRedirect(role: "landscaper" | "client" | "admin") {
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setReady(true);
        return;
      }

      try {
        if (role === "landscaper") {
          // READ-ONLY: Only redirect if already on public pages
          if (pathname === "/" || pathname.startsWith("/landscaper-login") || pathname.startsWith("/landscaper-signup")) {
            navigate("/landscaper-dashboard", { replace: true });
          }
        }
        // (Clients/Admins can have similar redirect logic if needed)
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => { cancelled = true; };
  }, [role, pathname, navigate]);

  return ready;
}

export default useAuthRedirect;