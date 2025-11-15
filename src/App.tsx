import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ConfigProvider } from './lib/ConfigContext';
import { AnalyticsProvider } from './components/Analytics';
import { VersionChecker } from './components/VersionChecker';

// Essential pages for marketing site
import AboutUs from './pages/AboutUs';
import GreenScapeLuxLanding from './pages/GreenScapeLuxLanding';
import Professionals from './pages/Professionals';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import GetQuoteEnhanced from './pages/GetQuoteEnhanced';
import ThankYou from './pages/ThankYou';
import NotFound from './pages/NotFound';
import AdminPanel from './pages/AdminPanel';
import AdminLogin from './pages/AdminLogin';

// Password reset pages
import ResetPassword from './pages/ResetPassword';

// Job management pages
import LandscaperJobs from './pages/LandscaperJobs';
import NewRequests from './pages/NewRequests';
import JobComplete from './pages/JobComplete';
import LandscaperOnboarding from './pages/LandscaperOnboarding';
import LandscaperProfile from './pages/LandscaperProfile';
import ClientQuoteForm from './pages/ClientQuoteForm';
import AdminDashboard from './pages/AdminDashboard';

// Unified Authentication
import ConsolidatedAuth from './components/auth/ConsolidatedAuth';
import SimpleProtectedRoute from './components/auth/SimpleProtectedRoute';

// Dashboard pages
import ClientDashboardV2 from './pages/ClientDashboardV2';
import ClientHistory from './pages/ClientHistory';
import ClientProfile from './pages/ClientProfile';
import BillingHistory from './pages/BillingHistory';
import SubscriptionDashboard from './pages/SubscriptionDashboard';
import Chat from './pages/Chat';
import LandscaperDashboardV2 from './pages/LandscaperDashboardV2';
import LandscaperEarnings from './pages/LandscaperEarnings';
import LandscaperPayouts from './pages/LandscaperPayouts';

import SearchPage from './pages/SearchPage';
import BusinessAutomation from './pages/BusinessAutomation';
import GetStarted from './pages/GetStarted';
import NotificationDashboard from './pages/NotificationDashboard';
import AIQuoteDashboard from './pages/AIQuoteDashboard';

// Payment pages
import PaymentOverview from './pages/payments/PaymentOverview';
import PaymentMethods from './pages/payments/PaymentMethods';
import PaymentSubscriptions from './pages/payments/PaymentSubscriptions';
import PaymentSecurity from './pages/payments/PaymentSecurity';

// Routing helpers
import { IntelligentDashboardRedirect } from './components/routing/IntelligentDashboardRedirect';

// Auth wrappers
const ClientAuth = () => <ConsolidatedAuth userType="client" />;
const LandscaperAuth = () => <ConsolidatedAuth userType="landscaper" />;

// Global error logs
if (typeof window !== "undefined" && !window.__GSL_ONERROR) {
  window.__GSL_ONERROR = true;
  window.addEventListener("error", e => {
    console.error("Global error", e?.error || e);
  });
  window.addEventListener("unhandledrejection", e => {
    console.error("Unhandled promise rejection", e?.reason);
  });
}

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ConfigProvider>
        <Router>
          <AnalyticsProvider>
            <VersionChecker />
            <ScrollToTop />

            <Routes>
              <Route path="/" element={<GreenScapeLuxLanding />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/professionals" element={<Professionals />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />

              <Route path="/get-started" element={<GetStarted />} />
              <Route path="/get-quote" element={<GetQuoteEnhanced />} />
              <Route path="/thank-you" element={<ThankYou />} />

              <Route path="/search" element={<SearchPage />} />

              {/* Authentication */}
              <Route path="/client-login" element={<ClientAuth />} />
              <Route path="/client-signup" element={<ClientAuth />} />
              <Route path="/pro-login" element={<LandscaperAuth />} />
              <Route path="/pro-signup" element={<LandscaperAuth />} />
              <Route path="/login" element={<ClientAuth />} />
              <Route path="/signup" element={<ClientAuth />} />
              <Route path="/admin-login" element={<AdminLogin />} />

              {/* Password Reset */}
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Dashboards */}
              <Route path="/client-dashboard/*" element={
                <SimpleProtectedRoute requiredRole="client">
                  <ClientDashboardV2 />
                </SimpleProtectedRoute>
              } />

              <Route path="/landscaper-dashboard/*" element={
                <SimpleProtectedRoute requiredRole="landscaper">
                  <LandscaperDashboardV2 />
                </SimpleProtectedRoute>
              } />

              {/* Admin */}
              <Route path="/admin-dashboard" element={
                <SimpleProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </SimpleProtectedRoute>
              } />
              <Route path="/admin" element={
                <SimpleProtectedRoute requiredRole="admin">
                  <AdminPanel />
                </SimpleProtectedRoute>
              } />

              {/* Payments */}
              <Route path="/payments/overview" element={
                <SimpleProtectedRoute requiredRole="client">
                  <PaymentOverview />
                </SimpleProtectedRoute>
              } />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>

          </AnalyticsProvider>
        </Router>
      </ConfigProvider>
    </ErrorBoundary>
  );
};

export default App;