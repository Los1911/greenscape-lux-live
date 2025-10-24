import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ConfigProvider } from './lib/ConfigContext';
import ConfigGate from './components/ConfigGate';
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

// Setup and debugging components
import { SetupWizard } from './components/setup/SetupWizard';
import { ProductionStatus } from './components/setup/ProductionStatus';
import { IntelligentDashboardRedirect } from './components/routing/IntelligentDashboardRedirect';

// Global error handling
if (typeof window !== "undefined" && !window.__GSL_ONERROR) {
  window.__GSL_ONERROR = true;
  window.addEventListener("error", e => {
    const msg = String(e?.error?.message || e?.message || "Unknown error");
    console.error("Global error", msg, e?.error || e);
  });
  window.addEventListener("unhandledrejection", e => {
    console.error("Unhandled promise rejection", e?.reason);
  });
}

// Wrapper components for ConsolidatedAuth with userType
const ClientAuth = () => <ConsolidatedAuth userType="client" />;
const LandscaperAuth = () => <ConsolidatedAuth userType="landscaper" />;

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ConfigProvider>
        <ConfigGate>
          <Router>
            <AnalyticsProvider>
              <VersionChecker />
              <ScrollToTop />

            <Routes>
              {/* Marketing site pages */}
              <Route path="/" element={<GreenScapeLuxLanding />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/professionals" element={<Professionals />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />

              {/* Get Started page */}
              <Route path="/get-started" element={<GetStarted />} />
              
              {/* Quote system - consolidated routes */}
              <Route path="/get-quote" element={<GetQuoteEnhanced />} />
              <Route path="/get-quote-enhanced" element={<Navigate to="/get-quote" replace />} />
              <Route path="/get-a-quote" element={<Navigate to="/get-quote" replace />} />
              <Route path="/instant-quote" element={<Navigate to="/get-quote" replace />} />
              <Route path="/quote-form" element={<Navigate to="/get-quote" replace />} />
              <Route path="/thank-you" element={<ThankYou />} />

              {/* Search functionality */}
              <Route path="/search" element={<SearchPage />} />
              <Route path="/search-jobs" element={<SearchPage />} />
              <Route path="/find-landscapers" element={<SearchPage />} />

              {/* ===== UNIFIED AUTHENTICATION ROUTES ===== */}
              {/* Client Authentication */}
              <Route path="/client-login" element={<ClientAuth />} />
              <Route path="/client-signup" element={<ClientAuth />} />
              
              {/* Landscaper/Pro Authentication */}
              <Route path="/pro-login" element={<LandscaperAuth />} />
              <Route path="/pro-signup" element={<LandscaperAuth />} />
              <Route path="/landscaper-login" element={<Navigate to="/pro-login" replace />} />
              <Route path="/landscaper-signup" element={<Navigate to="/pro-signup" replace />} />
              
              {/* Generic login/signup routes */}
              <Route path="/login" element={<ClientAuth />} />
              <Route path="/signup" element={<ClientAuth />} />
              
              {/* Admin has separate login */}
              <Route path="/admin-login" element={<AdminLogin />} />
              
              {/* Unified auth fallback */}
              <Route path="/auth" element={<ConsolidatedAuth />} />
              
              {/* Password Reset */}
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/forgot-password" element={<Navigate to="/login" replace />} />

              {/* ===== PROTECTED DASHBOARD ROUTES ===== */}
              <Route path="/client-dashboard/*" element={
                <SimpleProtectedRoute requiredRole="client">
                  <ClientDashboardV2 />
                </SimpleProtectedRoute>
              } />
              
              <Route path="/dashboard/*" element={<IntelligentDashboardRedirect />} />
              <Route path="/dashboard" element={<IntelligentDashboardRedirect />} />
              
              <Route path="/landscaper-dashboard/*" element={
                <SimpleProtectedRoute requiredRole="landscaper">
                  <LandscaperDashboardV2 />
                </SimpleProtectedRoute>
              } />
              
              <Route path="/pro-dashboard/*" element={
                <SimpleProtectedRoute requiredRole="landscaper">
                  <LandscaperDashboardV2 />
                </SimpleProtectedRoute>
              } />

              {/* Job management routes */}
              <Route path="/landscaper-jobs" element={
                <SimpleProtectedRoute requiredRole="landscaper">
                  <LandscaperJobs />
                </SimpleProtectedRoute>
              } />
              <Route path="/new-requests" element={
                <SimpleProtectedRoute requiredRole="landscaper">
                  <NewRequests />
                </SimpleProtectedRoute>
              } />
              <Route path="/job-complete/:jobId" element={
                <SimpleProtectedRoute requiredRole="landscaper">
                  <JobComplete />
                </SimpleProtectedRoute>
              } />
              <Route path="/landscaper-onboarding" element={
                <SimpleProtectedRoute requiredRole="landscaper">
                  <LandscaperOnboarding />
                </SimpleProtectedRoute>
              } />
              <Route path="/landscaper-profile" element={
                <SimpleProtectedRoute requiredRole="landscaper">
                  <LandscaperProfile />
                </SimpleProtectedRoute>
              } />
              <Route path="/landscaper-earnings" element={
                <SimpleProtectedRoute requiredRole="landscaper">
                  <LandscaperEarnings />
                </SimpleProtectedRoute>
              } />
              <Route path="/landscaper-payouts" element={
                <SimpleProtectedRoute requiredRole="landscaper">
                  <LandscaperPayouts />
                </SimpleProtectedRoute>
              } />
              <Route path="/pro-payouts" element={
                <SimpleProtectedRoute requiredRole="landscaper">
                  <LandscaperPayouts />
                </SimpleProtectedRoute>
              } />
              <Route path="/client-quote" element={
                <SimpleProtectedRoute requiredRole="client">
                  <ClientQuoteForm />
                </SimpleProtectedRoute>
              } />

              {/* Admin routes - PROTECTED */}
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
              <Route path="/business-automation" element={
                <SimpleProtectedRoute requiredRole="admin">
                  <BusinessAutomation />
                </SimpleProtectedRoute>
              } />
              <Route path="/notifications" element={
                <SimpleProtectedRoute requiredRole="admin">
                  <NotificationDashboard />
                </SimpleProtectedRoute>
              } />
              <Route path="/ai-quotes" element={
                <SimpleProtectedRoute requiredRole="admin">
                  <AIQuoteDashboard />
                </SimpleProtectedRoute>
              } />

              {/* Setup and debugging routes */}
              <Route path="/setup" element={<SetupWizard onComplete={() => window.location.href = '/'} />} />
              <Route path="/status" element={<ProductionStatus />} />

              {/* Client Profile */}
              <Route path="/profile" element={
                <SimpleProtectedRoute requiredRole="client">
                  <ClientProfile />
                </SimpleProtectedRoute>
              } />
              
              {/* Billing History */}
              <Route path="/billing/history" element={
                <SimpleProtectedRoute requiredRole="client">
                  <BillingHistory />
                </SimpleProtectedRoute>
              } />
              
              {/* Subscription Dashboard */}
              <Route path="/subscriptions" element={
                <SimpleProtectedRoute requiredRole="client">
                  <SubscriptionDashboard />
                </SimpleProtectedRoute>
              } />
              
              {/* Client History */}
              <Route path="/client-history" element={
                <SimpleProtectedRoute requiredRole="client">
                  <ClientHistory />
                </SimpleProtectedRoute>
              } />
              
              {/* Chat - Protected Route */}
              <Route path="/chat" element={
                <SimpleProtectedRoute requiredRole="client">
                  <Chat />
                </SimpleProtectedRoute>
              } />
              
              {/* Payment Management Routes - Protected */}
              <Route path="/payments/overview" element={
                <SimpleProtectedRoute requiredRole="client">
                  <PaymentOverview />
                </SimpleProtectedRoute>
              } />
              <Route path="/payments/methods" element={
                <SimpleProtectedRoute requiredRole="client">
                  <PaymentMethods />
                </SimpleProtectedRoute>
              } />
              <Route path="/payments/subscriptions" element={
                <SimpleProtectedRoute requiredRole="client">
                  <PaymentSubscriptions />
                </SimpleProtectedRoute>
              } />
              <Route path="/payments/security" element={
                <SimpleProtectedRoute requiredRole="client">
                  <PaymentSecurity />
                </SimpleProtectedRoute>
              } />
              <Route path="/payments" element={<Navigate to="/payments/overview" replace />} />
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </AnalyticsProvider>
          </Router>
        </ConfigGate>
      </ConfigProvider>
    </ErrorBoundary>
  );
};

export default App;
