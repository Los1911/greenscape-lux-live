import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { logger } from "@/utils/logger";
import Logo from "@/components/Logo";
import { 
  markPasswordResetComplete, 
  clearPasswordResetFlag,
  detectAndSetRecoveryIntent,
  clearRecoveryIntent
} from "@/utils/passwordResetGuard";

// Design tokens from spec
const COLORS = {
  background: "#0B0F0D",
  card: "#0F1A14",
  primaryText: "#E5F5EC",
  secondaryText: "#9FB7AC",
  primaryButton: "#2ECC71",
  buttonHover: "#27AE60",
  errorRed: "#E74C3C",
  glow: "rgba(46, 204, 113, 0.35)",
};

type PageState = "loading" | "invalid" | "expired" | "form" | "success";

interface ValidationErrors {
  password?: string;
  confirmPassword?: string;
}

// Shared container styles for all page states
const containerStyles: React.CSSProperties = {
  minHeight: '100dvh',
  backgroundColor: COLORS.background,
  paddingTop: 'env(safe-area-inset-top)',
  paddingBottom: 'env(safe-area-inset-bottom)',
  paddingLeft: 'env(safe-area-inset-left)',
  paddingRight: 'env(safe-area-inset-right)',
  display: 'flex',
  flexDirection: 'column',
};

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  
  // Page state
  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  // Form state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  
  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /**
   * PART 1: Detect and set recovery intent from URL on page load
   * This ensures the guard knows this is an intentional recovery flow
   */
  useEffect(() => {
    // Detect recovery intent from URL parameters
    const hasIntent = detectAndSetRecoveryIntent();
    logger.debug("Reset password page loaded", { hasRecoveryIntent: hasIntent }, "ResetPassword");
  }, []);

  /**
   * Detect and process Supabase recovery flows
   */
  useEffect(() => {
    const processRecoveryFlow = async () => {
      try {
        logger.debug("Processing password reset URL", {
          search: window.location.search,
          hash: window.location.hash,
        }, "ResetPassword");

        const queryParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        // Check for error parameters first (expired/invalid link)
        const errorCode = queryParams.get("error_code") || hashParams.get("error_code");
        const errorDescription = queryParams.get("error_description") || hashParams.get("error_description");

        if (errorCode === "otp_expired") {
          logger.warn("Password reset link expired", { errorCode }, "ResetPassword");
          setErrorMessage("Your password reset link has expired. Please request a new one.");
          setPageState("expired");
          return;
        }

        if (errorCode) {
          logger.warn("Password reset error from URL", { errorCode, errorDescription }, "ResetPassword");
          setErrorMessage(decodeURIComponent(errorDescription || "This reset link is invalid."));
          setPageState("invalid");
          return;
        }

        // FLOW 1: PKCE flow with `code` query parameter
        const code = queryParams.get("code");
        const type = queryParams.get("type");

        if (code) {
          logger.debug("PKCE flow detected, exchanging code for session", {}, "ResetPassword");
          
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            logger.error("PKCE code exchange failed", { error: error.message }, "ResetPassword");
            
            if (error.message.toLowerCase().includes("expired")) {
              setErrorMessage("Your password reset link has expired. Please request a new one.");
              setPageState("expired");
            } else {
              setErrorMessage("This reset link is invalid or has already been used.");
              setPageState("invalid");
            }
            return;
          }

          if (data.session) {
            logger.info("PKCE session established successfully", {}, "ResetPassword");
            // Clear URL for security
            window.history.replaceState({}, document.title, window.location.pathname);
            setPageState("form");
            return;
          }
        }

        // FLOW 2: Token-based flow with hash parameters
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const hashType = hashParams.get("type");

        if (hashType === "recovery" && accessToken && refreshToken) {
          logger.debug("Token-based recovery flow detected", {}, "ResetPassword");
          
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            logger.error("Token session setup failed", { error: error.message }, "ResetPassword");
            
            if (error.message.toLowerCase().includes("expired")) {
              setErrorMessage("Your password reset link has expired. Please request a new one.");
              setPageState("expired");
            } else {
              setErrorMessage("This reset link is invalid or has already been used.");
              setPageState("invalid");
            }
            return;
          }

          if (data.session) {
            logger.info("Token session established successfully", {}, "ResetPassword");
            // Clear URL for security
            window.history.replaceState({}, document.title, window.location.pathname);
            setPageState("form");
            return;
          }
        }

        // FLOW 3: Check if type=recovery exists (alternative format)
        if (type === "recovery" || hashType === "recovery") {
          // Try to get existing session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            logger.info("Existing recovery session found", {}, "ResetPassword");
            setPageState("form");
            return;
          }
        }

        // FLOW 4: Check for existing session (user navigated directly or was redirected by guard)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          logger.info("Existing session found, showing password reset form", {}, "ResetPassword");
          setPageState("form");
          return;
        }

        // No valid recovery flow detected
        logger.warn("No valid recovery flow detected in URL", {}, "ResetPassword");
        setErrorMessage("This reset link is invalid or expired. Please request a new password reset link.");
        setPageState("invalid");

      } catch (err: any) {
        logger.error("Unexpected error processing recovery flow", { error: err.message }, "ResetPassword");
        setErrorMessage("An unexpected error occurred. Please try again.");
        setPageState("invalid");
      }
    };

    processRecoveryFlow();
  }, []);


  /**
   * Validate form fields
   */
  const validateForm = useCallback((): boolean => {
    const errors: ValidationErrors = {};

    // Password validation
    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    // Confirm password validation
    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [password, confirmPassword]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      logger.debug("Updating user password", {}, "ResetPassword");

      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        logger.error("Password update failed", { error: error.message }, "ResetPassword");
        
        // Provide user-friendly error messages
        if (error.message.includes("same as")) {
          setSubmitError("New password must be different from your current password.");
        } else if (error.message.includes("weak")) {
          setSubmitError("Please choose a stronger password.");
        } else {
          setSubmitError("Failed to update password. Please try again.");
        }
        return;
      }

      logger.info("Password updated successfully", {}, "ResetPassword");
      
      // CRITICAL: Mark password reset as complete BEFORE signing out
      markPasswordResetComplete();
      
      setPageState("success");

      // Sign out the user after successful password reset
      // This ensures they log in fresh with the new password
      setTimeout(async () => {
        try {
          // Clear the password reset flag before logout (it will be cleared anyway)
          clearPasswordResetFlag();
          await supabase.auth.signOut();
          navigate("/portal-login");
        } catch (signOutError) {
          logger.error("Error signing out after password reset", { error: signOutError }, "ResetPassword");
          // Still navigate to login even if sign out fails
          navigate("/portal-login");
        }
      }, 3000);

    } catch (err: any) {
      logger.error("Unexpected error updating password", { error: err.message }, "ResetPassword");
      setSubmitError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };


  /**
   * Clear validation error when user types
   */
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (validationErrors.password) {
      setValidationErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (validationErrors.confirmPassword) {
      setValidationErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
  };

  // ============================================
  // RENDER: Loading State
  // ============================================
  if (pageState === "loading") {
    return (
      <div 
        className="flex flex-col items-center justify-center flex-1 px-4"
        style={containerStyles}
      >
        <div className="text-center">
          <div 
            className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: COLORS.primaryButton, borderTopColor: "transparent" }}
          />
          <p style={{ color: COLORS.secondaryText }}>Processing reset link...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: Invalid/Expired Link State
  // ============================================
  if (pageState === "invalid" || pageState === "expired") {
    return (
      <div 
        className="flex flex-col items-center justify-center flex-1 px-4 py-8"
        style={containerStyles}
      >
        <div 
          className="w-full max-w-md rounded-2xl p-8 text-center"
          style={{ 
            backgroundColor: COLORS.card,
            boxShadow: pageState === "expired" 
              ? `0 0 40px ${COLORS.errorRed}30` 
              : `0 0 40px ${COLORS.glow}`,
          }}
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo size="small" />
          </div>

          {/* Icon */}
          <div 
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${COLORS.errorRed}20` }}
          >
            {pageState === "expired" ? (
              // Clock icon for expired
              <svg 
                className="w-8 h-8" 
                fill="none" 
                stroke={COLORS.errorRed} 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            ) : (
              // Warning icon for invalid
              <svg 
                className="w-8 h-8" 
                fill="none" 
                stroke={COLORS.errorRed} 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
            )}
          </div>

          {/* Title */}
          <h1 
            className="text-2xl font-bold mb-3"
            style={{ color: COLORS.errorRed }}
          >
            {pageState === "expired" ? "Link Expired" : "Invalid Reset Link"}
          </h1>

          {/* Message */}
          <p 
            className="mb-8 leading-relaxed"
            style={{ color: COLORS.secondaryText }}
          >
            {errorMessage || "This reset link is invalid or expired."}
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => navigate("/portal-login")}
              className="w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ 
                backgroundColor: COLORS.primaryButton,
                color: "#FFFFFF",
                focusRingColor: COLORS.primaryButton,
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.buttonHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = COLORS.primaryButton}
            >
              Request New Reset Link
            </button>
            
            <button
              onClick={() => navigate("/")}
              className="w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2"
              style={{ 
                backgroundColor: "transparent",
                color: COLORS.secondaryText,
                border: `1px solid ${COLORS.secondaryText}40`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${COLORS.primaryText}10`;
                e.currentTarget.style.color = COLORS.primaryText;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = COLORS.secondaryText;
              }}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: Success State
  // ============================================
  if (pageState === "success") {
    return (
      <div 
        className="flex flex-col items-center justify-center flex-1 px-4 py-8"
        style={containerStyles}
      >
        <div 
          className="w-full max-w-md rounded-2xl p-8 text-center"
          style={{ 
            backgroundColor: COLORS.card,
            boxShadow: `0 0 40px ${COLORS.glow}`,
          }}
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo size="small" />
          </div>

          {/* Success Icon */}
          <div 
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${COLORS.primaryButton}20` }}
          >
            <svg 
              className="w-8 h-8" 
              fill="none" 
              stroke={COLORS.primaryButton} 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>

          {/* Title */}
          <h1 
            className="text-2xl font-bold mb-3"
            style={{ color: COLORS.primaryButton }}
          >
            Password Updated!
          </h1>

          {/* Message */}
          <p 
            className="mb-6 leading-relaxed"
            style={{ color: COLORS.secondaryText }}
          >
            Your password has been successfully updated. You will be redirected to the login page shortly.
          </p>

          {/* Loading indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div 
              className="w-2 h-2 rounded-full animate-bounce"
              style={{ backgroundColor: COLORS.primaryButton, animationDelay: "0ms" }}
            />
            <div 
              className="w-2 h-2 rounded-full animate-bounce"
              style={{ backgroundColor: COLORS.primaryButton, animationDelay: "150ms" }}
            />
            <div 
              className="w-2 h-2 rounded-full animate-bounce"
              style={{ backgroundColor: COLORS.primaryButton, animationDelay: "300ms" }}
            />
          </div>

          {/* Manual redirect button */}
          <button
            onClick={() => navigate("/portal-login")}
            className="py-3 px-6 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2"
            style={{ 
              backgroundColor: "transparent",
              color: COLORS.primaryButton,
              border: `1px solid ${COLORS.primaryButton}40`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${COLORS.primaryButton}10`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Go to Login Now
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: Password Reset Form
  // ============================================
  return (
    <div 
      className="flex flex-col items-center justify-center flex-1 px-4 py-8"
      style={containerStyles}
    >
      <div 
        className="w-full max-w-md rounded-2xl p-8"
        style={{ 
          backgroundColor: COLORS.card,
          boxShadow: `0 0 40px ${COLORS.glow}`,
        }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Logo size="small" />
        </div>

        {/* Title */}
        <h1 
          className="text-2xl font-bold text-center mb-2"
          style={{ color: COLORS.primaryText }}
        >
          Reset Your Password
        </h1>

        {/* Subtext */}
        <p 
          className="text-center mb-8"
          style={{ color: COLORS.secondaryText }}
        >
          Enter your new password below. Make sure it's at least 8 characters long.
        </p>

        {/* Submit Error */}
        {submitError && (
          <div 
            className="mb-6 p-4 rounded-lg text-sm"
            style={{ 
              backgroundColor: `${COLORS.errorRed}15`,
              border: `1px solid ${COLORS.errorRed}30`,
              color: COLORS.errorRed,
            }}
          >
            {submitError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Password Field */}
          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium mb-2"
              style={{ color: COLORS.primaryText }}
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                disabled={isSubmitting}
                placeholder="Enter your new password"
                className="w-full h-12 px-4 pr-12 rounded-lg text-base transition-all duration-200 focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: `${COLORS.background}`,
                  border: validationErrors.password 
                    ? `1px solid ${COLORS.errorRed}` 
                    : `1px solid ${COLORS.primaryButton}30`,
                  color: COLORS.primaryText,
                  focusRingColor: COLORS.primaryButton,
                }}
                aria-invalid={!!validationErrors.password}
                aria-describedby={validationErrors.password ? "password-error" : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                style={{ color: COLORS.secondaryText }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {validationErrors.password && (
              <p 
                id="password-error" 
                className="mt-2 text-sm"
                style={{ color: COLORS.errorRed }}
              >
                {validationErrors.password}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label 
              htmlFor="confirmPassword" 
              className="block text-sm font-medium mb-2"
              style={{ color: COLORS.primaryText }}
            >
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                disabled={isSubmitting}
                placeholder="Confirm your new password"
                className="w-full h-12 px-4 pr-12 rounded-lg text-base transition-all duration-200 focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: `${COLORS.background}`,
                  border: validationErrors.confirmPassword 
                    ? `1px solid ${COLORS.errorRed}` 
                    : `1px solid ${COLORS.primaryButton}30`,
                  color: COLORS.primaryText,
                  focusRingColor: COLORS.primaryButton,
                }}
                aria-invalid={!!validationErrors.confirmPassword}
                aria-describedby={validationErrors.confirmPassword ? "confirm-password-error" : undefined}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                style={{ color: COLORS.secondaryText }}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {validationErrors.confirmPassword && (
              <p 
                id="confirm-password-error" 
                className="mt-2 text-sm"
                style={{ color: COLORS.errorRed }}
              >
                {validationErrors.confirmPassword}
              </p>
            )}
          </div>

          {/* Password Requirements Hint */}
          <div 
            className="text-xs p-3 rounded-lg"
            style={{ 
              backgroundColor: `${COLORS.primaryButton}10`,
              color: COLORS.secondaryText,
            }}
          >
            <p className="font-medium mb-1" style={{ color: COLORS.primaryText }}>
              Password requirements:
            </p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>At least 8 characters long</li>
              <li>Both passwords must match</li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: COLORS.primaryButton,
              color: "#FFFFFF",
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = COLORS.buttonHover;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.primaryButton;
            }}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg 
                  className="w-5 h-5 animate-spin" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Updating Password...
              </span>
            ) : (
              "Set New Password"
            )}
          </button>
        </form>

        {/* Secondary Actions */}
        <div 
          className="mt-6 pt-6 text-center"
          style={{ borderTop: `1px solid ${COLORS.secondaryText}20` }}
        >
          <button
            onClick={() => navigate("/")}
            className="text-sm transition-colors duration-200"
            style={{ color: COLORS.secondaryText }}
            onMouseEnter={(e) => e.currentTarget.style.color = COLORS.primaryText}
            onMouseLeave={(e) => e.currentTarget.style.color = COLORS.secondaryText}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
