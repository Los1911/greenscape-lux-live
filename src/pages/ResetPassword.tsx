import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { logger } from "@/utils/logger";
const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const handleTokenExchange = async () => {
      try {
        logger.debug('Processing password reset token', { hasHash: !!window.location.hash }, 'ResetPassword');
        
        // Get the hash from URL (includes #access_token=...)
        const hash = window.location.hash;
        
        if (!hash) {
          logger.warn('No reset token found in URL', {}, 'ResetPassword');
          setError("No reset token found in URL");
          setInitializing(false);
          return;
        }

        logger.debug('Attempting token exchange', {}, 'ResetPassword');
        
        // Exchange the hash for a session
        const { data, error } = await supabase.auth.exchangeCodeForSession(hash);
        
        if (error) {
          logger.error('Token exchange failed', { error: error.message }, 'ResetPassword');
          setError("Invalid or expired reset link. Please request a new one.");
          setInitializing(false);
          return;
        }

        if (data.session) {
          logger.info('Password reset session established successfully', {}, 'ResetPassword');
          setSessionReady(true);
          // Clear the hash from URL for security
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          logger.warn('Failed to establish reset session', {}, 'ResetPassword');
          setError("Failed to establish session");
        }
      } catch (err: any) {
        logger.error('Token exchange unexpected error', { error: err.message }, 'ResetPassword');
        setError("Failed to process reset link");
      } finally {
        setInitializing(false);
      }
    };

    handleTokenExchange();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      // Update the user's password
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });
      if (error) {
        logger.error('Password update failed', { error: error.message }, 'ResetPassword');
        setError(error.message);
        return;
      }

      // Get current user to fetch their profile
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("Failed to get user information");
        return;
      }

      // Query user's profile to get their role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        logger.warn('Profile fetch failed, redirecting to login', { error: profileError?.message }, 'ResetPassword');
        // Fallback to login if we can't determine role
        alert("Password updated successfully! Please sign in with your new password.");
        navigate("/unified-login");
        return;
      }

      // Success - redirect based on role
      logger.info('Password updated successfully, redirecting user', { role: profile.role }, 'ResetPassword');
      alert("Password updated successfully!");
      
      switch (profile.role) {
        case 'client':
          navigate("/dashboard/client");
          break;
        case 'landscaper':
          navigate("/dashboard/landscaper");
          break;
        case 'admin':
          navigate("/dashboard/admin");
          break;
        default:
          // Fallback for unknown roles
          navigate("/unified-login");
          break;
      }

    } catch (err: any) {
      logger.error('Password update process failed', { error: err.message }, 'ResetPassword');
      setError("Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  if (initializing) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4" />
            <p className="text-gray-300">Processing reset link...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!sessionReady) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="max-w-md mx-auto text-center p-8">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Invalid Reset Link</h1>
            <p className="text-gray-300 mb-6">{error}</p>
            <Button 
              onClick={() => navigate("/forgot-password")}
              className="bg-green-600 hover:bg-green-700"
            >
              Request New Reset Link
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="max-w-md mx-auto p-8">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-green-500/30 rounded-2xl p-8">
            <h1 className="text-2xl font-bold text-center mb-6">
              <span className="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                Set New Password
              </span>
            </h1>

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-900/20 p-3 rounded-lg border border-red-500/30 mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="password" className="text-white font-medium">
                  New Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 bg-gray-800/50 border border-green-500/30 text-white h-12 rounded-lg focus:border-green-400"
                  required
                  minLength={6}
                  disabled={loading}
                  placeholder="Enter your new password"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-white font-medium">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-2 bg-gray-800/50 border border-green-500/30 text-white h-12 rounded-lg focus:border-green-400"
                  required
                  minLength={6}
                  disabled={loading}
                  placeholder="Confirm your new password"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Updating Password...
                  </div>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ResetPassword;