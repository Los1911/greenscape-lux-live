import React from "react";
import UnifiedPortalAuth from "@/components/auth/UnifiedPortalAuth";

/**
 * GreenScape Lux Portal Login Page
 * 
 * Consolidated single entry point for all user authentication.
 * This page renders the UnifiedPortalAuth component which handles
 * both client and landscaper login/signup flows with proper
 * redirect behavior using React Router navigate.
 */
const PortalLogin: React.FC = () => {
  return <UnifiedPortalAuth />;
};

export default PortalLogin;
