import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AnalyticsProvider } from './components/Analytics';
import { VersionChecker } from './components/VersionChecker';
import { supabase } from './lib/supabase';

// =============================================================================
// MARKETING PAGES
// =============================================================================
import AboutUs from './pages/AboutUs';
import GreenScapeLuxLanding from './pages/GreenScapeLuxLanding';
import Professionals from './pages/Professionals';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';

// =============================================================================
// QUOTES
// =============================================================================
import GetQuoteEnhanced from './pages/GetQuoteEnhanced';
import ThankYou from './pages/ThankYou';
import ClientQuoteForm from './pages/ClientQuoteForm';

// =============================================================================
// AUTH
// =============================================================================
import PortalLogin from './pages/portal-login';
import ResetPassword from './pages/ResetPassword';
import AdminLogin from './pages/AdminLogin';

// =============================================================================
// DASHBOARDS
// =============================================================================
import ClientDashboardV2 from './pages/ClientDashboardV2';
import LandscaperDashboardV2 from './pages/LandscaperDashboardV2';
import AdminDashboard from './pages/AdminDashboard';

// =============================================================================
// JOBS
// =============================================================================
import LandscaperJobs from './pages/LandscaperJobs';
import NewRequests from './pages/NewRequests';
import JobComplete from './pages/JobComplete';

// =============================================================================
// ADMIN TOOLS
// =============================================================================
import AdminPanel from './pages/AdminPanel';
import BusinessAutomation from './pages/BusinessAutomation';
import NotificationDashboard from './pages/NotificationDashboard';
import AIQuoteDashboard from './pages/AIQuoteDashboard';

// =============================================================================
// CLIENT
// =============================================================================
import ClientHistory from './pages/ClientHistory';
import ClientProfile from './pages/ClientProfile';
import BillingHistory from './pages/BillingHistory';
import SubscriptionDashboard from './pages/SubscriptionDashboard';
import Chat from './pages/Chat';

// =============================================================================
// PAYMENTS
// =============================================================================
import PaymentOverview from './pages/payments/PaymentOverview';

// =============================================================================
// MISC
// =============================================================================
import SearchPage from './pages/SearchPage';
import NotFound from './pages/NotFound';

// =============================================================================
// ROUTING HELPERS
// =============================================================================
import SimpleProtectedRoute from './components/auth/SimpleProtectedRoute';
import RoleRouter from './router/RoleRouter';

// =============================================================================
// APP
// =============================================================================
const App: React.FC = () => {
  React.useEffect(() => {
    console.log('🚀 [App] Application initialized');
    console.log('🚀 [App] Supabase ready:', !!supabase);
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <AnalyticsProvider>
          <VersionChecker />
          <ScrollToTop />

          <Routes>
            {/* MARKETING */}
            <Route path="/" element={<GreenScapeLuxLanding />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/professionals" element={<Professionals />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />

            {/* ROLE REDIRECT */}
            <Route path="/get-started" element={<RoleRouter />} />

            {/* LOGIN */}
            <Route path="/portal-login" element={<PortalLogin />} />
            <Route path="/login" element={<Navigate to="/portal-login" replace />} />
            <Route path="/signup" element={<Navigate to="/portal-login" replace />} />
            <Route path="/admin-login" element={<AdminLogin />} />

            {/* QUOTES */}
            <Route path="/get-quote" element={<GetQuoteEnhanced />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route
              path="/client-quote"
              element={
                <SimpleProtectedRoute requiredRole="client">
                  <ClientQuoteForm />
                </SimpleProtectedRoute>
              }
            />

            {/* PASSWORD RESET */}
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* DASHBOARDS */}
            <Route
              path="/client-dashboard/*"
              element={
                <SimpleProtectedRoute requiredRole="client">
                  <ClientDashboardV2 />
                </SimpleProtectedRoute>
              }
            />
            <Route
              path="/landscaper-dashboard/*"
              element={
                <SimpleProtectedRoute requiredRole="landscaper">
                  <LandscaperDashboardV2 />
                </SimpleProtectedRoute>
              }
            />
            <Route
              path="/admin-dashboard"
              element={
                <SimpleProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </SimpleProtectedRoute>
              }
            />

            {/* ADMIN */}
            <Route
              path="/admin"
              element={
                <SimpleProtectedRoute requiredRole="admin">
                  <AdminPanel />
                </SimpleProtectedRoute>
              }
            />

            {/* JOBS */}
            <Route
              path="/landscaper-jobs"
              element={
                <SimpleProtectedRoute requiredRole="landscaper">
                  <LandscaperJobs />
                </SimpleProtectedRoute>
              }
            />
            <Route
              path="/new-requests"
              element={
                <SimpleProtectedRoute requiredRole="landscaper">
                  <NewRequests />
                </SimpleProtectedRoute>
              }
            />
            <Route
              path="/job-complete/:jobId"
              element={
                <SimpleProtectedRoute requiredRole="landscaper">
                  <JobComplete />
                </SimpleProtectedRoute>
              }
            />

            {/* ADMIN TOOLS */}
            <Route
              path="/business-automation"
              element={
                <SimpleProtectedRoute requiredRole="admin">
                  <BusinessAutomation />
                </SimpleProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <SimpleProtectedRoute requiredRole="admin">
                  <NotificationDashboard />
                </SimpleProtectedRoute>
              }
            />
            <Route
              path="/ai-quotes"
              element={
                <SimpleProtectedRoute requiredRole="admin">
                  <AIQuoteDashboard />
                </SimpleProtectedRoute>
              }
            />

            {/* CLIENT */}
            <Route
              path="/profile"
              element={
                <SimpleProtectedRoute requiredRole="client">
                  <ClientProfile />
                </SimpleProtectedRoute>
              }
            />
            <Route
              path="/client-history"
              element={
                <SimpleProtectedRoute requiredRole="client">
                  <ClientHistory />
                </SimpleProtectedRoute>
              }
            />
            <Route
              path="/billing/history"
              element={
                <SimpleProtectedRoute requiredRole="client">
                  <BillingHistory />
                </SimpleProtectedRoute>
              }
            />
            <Route
              path="/subscriptions"
              element={
                <SimpleProtectedRoute requiredRole="client">
                  <SubscriptionDashboard />
                </SimpleProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <SimpleProtectedRoute requiredRole="client">
                  <Chat />
                </SimpleProtectedRoute>
              }
            />

            {/* PAYMENTS */}
            <Route
              path="/payments/overview"
              element={
                <SimpleProtectedRoute requiredRole="client">
                  <PaymentOverview />
                </SimpleProtectedRoute>
              }
            />

            {/* SEARCH */}
            <Route path="/search" element={<SearchPage />} />

            {/* FALLBACK */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnalyticsProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
