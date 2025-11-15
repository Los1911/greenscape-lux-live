import React from "react";
import UnifiedPortalAuth from "@/components/auth/UnifiedPortalAuth";

const PortalLogin: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-emerald-400">
      <div className="w-full max-w-md p-6 text-center">
        <h1 className="text-3xl font-bold mb-6">GreenScape Lux Portal Login</h1>
        <UnifiedPortalAuth />
      </div>
    </div>
  );
};

export default PortalLogin;
