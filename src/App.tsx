import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ConfigProvider } from './lib/ConfigContext';

import { AnalyticsProvider } from './components/Analytics';
import { VersionChecker } from './components/VersionChecker';

// Marketing pages
import AboutUs from './pages/AboutUs';
import GreenScapeLuxLanding from './pages/GreenScapeLuxLanding';
import Professionals from './pages/Professionals';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';

// Quote system
import GetQuoteEnhanced from './pages/GetQuoteEnhanced';
import ThankYou from './pages/ThankYou';
import ClientQuoteForm from './pages/ClientQuoteForm';

// Auth
import PortalLogin from './pages/portal-login';
import ResetPassword from './pages/ResetPassword';

// Dashboards
import ClientDashboardV2 from './pages/ClientDashboardV2';
import LandscaperDashboardV2 from './pages/LandscaperDashboardV2';
import AdminDashboard from './pages/AdminDashboard';

// Job management
import LandscaperJobs from './pages/LandscaperJobs';
import NewRequests from './pages/NewRequests';
import JobComplete from './pages/JobComplete';

// Admin pages
import AdminPanel from './pages/AdminPanel';
import BusinessAutomation from './pages/BusinessAutomation';
import NotificationDashboard from './pages/NotificationDashboard';
import AIQuoteDashboard from './pages/AIQuoteDashboard';

// Client pages
import ClientHistory from './pages/ClientHistory';
import ClientProfile from './pages/ClientProfile';
import BillingHistory from './pages/BillingHistory';
import SubscriptionDashboard from './pages/SubscriptionDashboard';
import Chat from './pages/Chat';

// Payments
import PaymentOverview from './pages/payments/PaymentOverview';
import PaymentMethods from './pages/payments/PaymentMethods';
import PaymentSubscriptions from './pages/payments/PaymentSubscriptions';
import PaymentSecurity from './pages/payments/PaymentSecurity';

// Search / misc
import SearchPage from './pages/SearchPage';
import NotFound from './pages/NotFound';

// Protected route
import SimpleProtectedRoute from './components/auth/SimpleProtectedRoute';

// Dashboard auto-router
import RoleRouter from './router/RoleRouter';

// Setup
import { SetupWizard } from './components/setup/SetupWizard';
import { ProductionStatus } from './components/setup/ProductionStatus';

// Global error + auth listeners
if (typeof window !== 'undefined' && !window.__GSL_ONERROR) {
  window.__GSL_ONERROR = true;
  window.addEventListener('error', (e) => {
    console.error('Global error', e?.error || e);
  });
  window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection', e?.reason);
  });
}

if (typeof window !== 'undefined' && !window.__GSL_AUTH_LISTENER) {
  window.__GSL_AUTH_LISTENER = true;
  import('@/lib/supabase').then(({ supabase }) => {
    supabase.auth.onAuthStateChange((event) => {
      console.log('[AUTH GLOBAL]', event);
    });
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

              {/* MARKETING */}
              <Route path="/" element={<GreenScapeLuxLanding />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/professionals" element={<Professionals />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />

              {/* ROLE ROUTER */}
              <Route path="/get-started" element={<RoleRouter />} />

              {/* AUTH */}
              <Route path="/portal-login" element={<PortalLogin />} />
              <Route path="/login" element={<Navigate to="/portal-login" replace />} />
              <Route path="/signup" element={<Navigate to="/portal-login" replace />} />
              <Route path="/client-login" element={<Navigate to="/portal-login" replace />} />
              <Route path="/landscaper-login" element={<Navigate to="/portal-login" replace />} />

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

              {/* PASSWORD */}
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
                path="/admin"
                element={
                  <SimpleProtectedRoute requiredRole="admin">
                    <AdminPanel />
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

              {/* ADMIN */}
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
              <Route
                path="/payments/methods"
                element={
                  <SimpleProtectedRoute requiredRole="client">
                    <PaymentMethods />
                  </SimpleProtectedRoute>
                }
              />
              <Route
                path="/payments/subscriptions"
                element={
                  <SimpleProtectedRoute requiredRole="client">
                    <PaymentSubscriptions />
                  </SimpleProtectedRoute>
                }
              />
              <Route
                path="/payments/security"
                element={
                  <SimpleProtectedRoute requiredRole="client">
                    <PaymentSecurity />
                  </SimpleProtectedRoute>
                }
              />

              {/* SETUP */}
              <Route path="/setup" element={<SetupWizard onComplete={() => (window.location.href = '/')} />} />
              <Route path="/status" element={<ProductionStatus />} />

              {/* SEARCH */}
              <Route path="/search" element={<SearchPage />} />

              {/* FALLBACK */}
              <Route path="*" element={<NotFound />} />

            </Routes>
          </AnalyticsProvider>
        </Router>
      </ConfigProvider>
    </ErrorBoundary>
  );
};

export default App;
