import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";

import GetStarted from "@/pages/GetStarted";
import UnifiedLogin from "@/pages/UnifiedLogin";
import UnifiedPortalAuth from "@/pages/UnifiedPortalAuth";

import GetQuoteEnhanced from "@/pages/GetQuoteEnhanced";  
import QuotePage from "@/pages/ClientQuoteForm";

import ClientDashboardV2 from "@/pages/ClientDashboardV2";
import LandscaperDashboardV2 from "@/pages/LandscaperDashboardV2";
import AdminDashboard from "@/pages/AdminDashboard";

import ResetPassword from "@/pages/ResetPassword";

import AboutUs from "@/pages/AboutUs";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import Professionals from "@/pages/Professionals";

// Your landing page
import Contact from "@/pages/GreenScapeLuxLanding";

import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <Router>
      <Routes>

        {/* Landing Page */}
        <Route path="/" element={<Contact />} />

        {/* Get Started page */}
        <Route path="/get-started" element={<GetStarted />} />

        {/* Auth */}
        <Route path="/portal-login" element={<UnifiedLogin />} />
        <Route path="/login" element={<UnifiedLogin />} />
        <Route path="/register" element={<UnifiedPortalAuth />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Quotes */}
        <Route path="/instant-quote" element={<GetQuoteEnhanced />} />
        <Route path="/quote" element={<QuotePage />} />

        {/* Dashboards */}
        <Route path="/client-dashboard/*" element={<ClientDashboardV2 />} />
        <Route path="/landscaper-dashboard/*" element={<LandscaperDashboardV2 />} />
        <Route path="/admin/*" element={<AdminDashboard />} />

        {/* Misc */}
        <Route path="/about" element={<AboutUs />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/pros" element={<Professionals />} />
        <Route path="/contact" element={<Contact />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}