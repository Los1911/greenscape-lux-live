import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayoutClean from '@/components/AppLayoutClean';
import AppLayout from '@/components/AppLayout';
import AnimatedBackground from '@/components/AnimatedBackground';
import Logo from '@/components/Logo';
import ServiceCheckboxList from '@/components/ServiceCheckboxList';
import { StandardizedButton } from '@/components/ui/standardized-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  CalendarIcon, 
  RefreshCw, 
  MapPin, 
  ClipboardCheck, 
  Users, 
  ChevronDown, 
  ChevronUp,
  User,
  Check,
  AlertTriangle
} from 'lucide-react';
import { trackEvent, trackQuoteSubmission } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { calculatePriceEstimate } from '@/utils/quoteEstimator';
import GlobalNavigation from '@/components/navigation/GlobalNavigation';
import Breadcrumb from '@/components/navigation/Breadcrumb';
import { useAuth } from '@/contexts/AuthContext';
import { 
  parseQuoteSubmissionError, 
  validateAuthSession, 
  validateQuoteFields,
  formatQuoteError,
  type QuoteSubmissionError 
} from '@/lib/quoteSubmissionErrorHandler';
import { QuoteFormProgress, QUOTE_FORM_STEPS } from '@/components/quote/QuoteFormProgress';

const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';


// =============================================================================

export type RequestServiceMode = 'guest' | 'client';

interface RequestServiceFormProps {
  mode: RequestServiceMode;
}

interface ValidationErrors {
  [key: string]: string;
}

interface ValidationRule {
  required?: boolean;
  pattern?: RegExp;
  message?: string;
}

interface ClientProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
}

// =============================================================================
// VALIDATION RULES
// =============================================================================

const nameValidation: ValidationRule = { 
  required: true, 
  message: 'Please enter your full name' 
};

const emailValidation: ValidationRule = { 
  required: true, 
  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 
  message: 'Please enter a valid email address' 
};

const phoneValidation: ValidationRule = { 
  pattern: /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/, 
  message: 'Please enter a valid phone number' 
};

const addressValidation: ValidationRule = { 
  required: true, 
  message: 'Please enter your service address' 
};

const validateField = (value: string, validation: ValidationRule): string | null => {
  if (validation.required && !value.trim()) {
    return validation.message || 'This field is required';
  }
  if (validation.pattern && value && !validation.pattern.test(value)) {
    return validation.message || 'Invalid format';
  }
  return null;
};

// =============================================================================
// FORM ERROR COMPONENT
// =============================================================================

const FormError: React.FC<{ error: string }> = ({ error }) => (
  <div className="text-red-400 text-sm mt-1">{error}</div>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function RequestServiceForm({ mode }: RequestServiceFormProps) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const serviceTypeRef = useRef<HTMLDivElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    propertyAddress: '',
    propertySize: '',
    serviceType: '',
    serviceFrequency: '',
    selectedServices: [] as string[],
    otherService: '',
    date: '',
    comments: '',
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(mode === 'client');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [submissionError, setSubmissionError] = useState<QuoteSubmissionError | null>(null);
  
  // Client mode specific state
  const [contactSectionOpen, setContactSectionOpen] = useState(mode === 'guest');
  const [useDifferentAddress, setUseDifferentAddress] = useState(false);
  const [savedProfile, setSavedProfile] = useState<ClientProfile | null>(null);
  const [profileFieldsEdited, setProfileFieldsEdited] = useState<Set<string>>(new Set());

  // =============================================================================
  // CLIENT MODE: FETCH PROFILE DATA
  // =============================================================================

  useEffect(() => {
    if (mode !== 'client') {
      setDataLoading(false);
      return;
    }

    if (authLoading) return;

    if (!user) {
      // Redirect to login if not authenticated in client mode
      navigate('/portal-login');
      return;
    }

    const fetchClientProfile = async () => {
      try {
        console.log('[RequestServiceForm] Fetching client profile for user:', user.id);
        
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, email, phone, address')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('[RequestServiceForm] Error fetching profile:', error);
        }

        const profile: ClientProfile = {
          firstName: profileData?.first_name || '',
          lastName: profileData?.last_name || '',
          email: profileData?.email || user.email || '',
          phone: profileData?.phone || '',
          address: profileData?.address || ''
        };

        setSavedProfile(profile);

        // Auto-fill form with profile data
        const fullName = `${profile.firstName} ${profile.lastName}`.trim();
        setFormData(prev => ({
          ...prev,
          name: fullName || user.user_metadata?.name || '',
          email: profile.email,
          phone: profile.phone,
          propertyAddress: profile.address
        }));

        console.log('[RequestServiceForm] Profile loaded successfully');
      } catch (err) {
        console.error('[RequestServiceForm] Error fetching client data:', err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchClientProfile();
  }, [mode, authLoading, user, navigate]);

  // =============================================================================
  // CLIENT MODE: AUTO-FOCUS ON SERVICE TYPE
  // =============================================================================

  useEffect(() => {
    if (mode === 'client' && !dataLoading && serviceTypeRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        serviceTypeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [mode, dataLoading]);

  // =============================================================================
  // TRACK FORM START
  // =============================================================================

  useEffect(() => {
    trackEvent('form_start', 'quote_form', mode === 'client' ? 'client_request_service' : 'guest_get_quote');
  }, [mode]);


  // =============================================================================
  // CALCULATE CURRENT FORM STEP (for progress indicator)
  // =============================================================================

  const currentFormStep = useMemo(() => {
    // Step 1: Contact Info - complete if name and email are filled
    const contactComplete = formData.name.trim() !== '' && formData.email.trim() !== '';
    
    // Step 2: Service Type - complete if service type is selected
    const serviceTypeComplete = formData.serviceType !== '';
    
    // Step 3: Services - complete if at least one service is selected
    const servicesComplete = formData.selectedServices.length > 0 || formData.otherService.trim() !== '';
    
    // Step 4: Property - complete if address is filled
    const propertyComplete = formData.propertyAddress.trim() !== '';
    
    // Determine current step based on completion
    if (!contactComplete) return 1;
    if (!serviceTypeComplete) return 2;
    if (!servicesComplete) return 3;
    if (!propertyComplete) return 4;
    return 4; // All complete, show step 4
  }, [formData]);

  // =============================================================================
  // FORM VALIDATION
  // =============================================================================

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    const nameError = validateField(formData.name, nameValidation);
    if (nameError) newErrors.name = nameError;
    
    const emailError = validateField(formData.email, emailValidation);
    if (emailError) newErrors.email = emailError;
    
    if (formData.phone) {
      const phoneError = validateField(formData.phone, phoneValidation);
      if (phoneError) newErrors.phone = phoneError;
    }
    
    const addressError = validateField(formData.propertyAddress, addressValidation);
    if (addressError) newErrors.propertyAddress = addressError;
    
    if (formData.selectedServices.length === 0 && !formData.otherService) {
      newErrors.services = 'Please select at least one service';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // =============================================================================
  // FORM HANDLERS
  // =============================================================================

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Track profile field edits in client mode
    if (mode === 'client' && ['name', 'email', 'phone', 'propertyAddress'].includes(field)) {
      setProfileFieldsEdited(prev => new Set(prev).add(field));
    }
    
    if (touched[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const handleServiceChange = (service: string, checked: boolean) => {
    const newServices = checked
      ? [...formData.selectedServices, service]
      : formData.selectedServices.filter(s => s !== service);
    
    setFormData(prev => ({ ...prev, selectedServices: newServices }));
    setTouched(prev => ({ ...prev, services: true }));
    
    trackEvent(checked ? 'service_selected' : 'service_deselected', 'quote_form', service);
    
    if (newServices.length > 0 || formData.otherService) {
      const newErrors = { ...errors };
      delete newErrors.services;
      setErrors(newErrors);
    }
  };

  const handleUseDifferentAddress = () => {
    setUseDifferentAddress(true);
    setFormData(prev => ({ ...prev, propertyAddress: '' }));
  };

  const handleUseSavedAddress = () => {
    setUseDifferentAddress(false);
    if (savedProfile) {
      setFormData(prev => ({ ...prev, propertyAddress: savedProfile.address }));
    }
  };

  // =============================================================================
  // SAVE PROFILE UPDATES (CLIENT MODE)
  // =============================================================================

  const saveProfileUpdates = async () => {
    if (mode !== 'client' || !user || profileFieldsEdited.size === 0) return;

    try {
      const updates: Record<string, string> = {};
      
      if (profileFieldsEdited.has('name')) {
        const nameParts = formData.name.trim().split(' ');
        updates.first_name = nameParts[0] || '';
        updates.last_name = nameParts.slice(1).join(' ') || '';
      }
      if (profileFieldsEdited.has('email')) {
        updates.email = formData.email;
      }
      if (profileFieldsEdited.has('phone')) {
        updates.phone = formData.phone;
      }
      if (profileFieldsEdited.has('propertyAddress') && !useDifferentAddress) {
        updates.address = formData.propertyAddress;
      }

      if (Object.keys(updates).length > 0) {
        console.log('[RequestServiceForm] Saving profile updates:', updates);
        await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);
      }
    } catch (err) {
      console.error('[RequestServiceForm] Error saving profile updates:', err);
      // Non-critical - don't block form submission
    }
  };

  // =============================================================================
  // FORM SUBMISSION
  // =============================================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setSubmissionError(null);
    setErrors({});
    
    if (loading) {
      console.log('⚠️ Submission already in progress, ignoring...');
      return;
    }
    
    const allFields = ['name', 'email', 'phone', 'propertyAddress', 'services'];
    setTouched(allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}));
    
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }
    
    // For client mode, validate auth session before submission
    if (mode === 'client') {
      console.log('🔐 Validating auth session for client mode...');
      const sessionValidation = await validateAuthSession(user, supabase);
      if (!sessionValidation.valid) {
        console.error('❌ Auth session validation failed:', sessionValidation.error);
        setErrors({ submit: sessionValidation.error || 'Please sign in again to continue.' });
        return;
      }
      console.log('✅ Auth session valid');
    }
    
    // Pre-submission field validation
    const fieldValidation = validateQuoteFields({
      name: formData.name,
      email: formData.email,
      propertyAddress: formData.propertyAddress,
      selectedServices: formData.selectedServices,
      otherService: formData.otherService
    });
    
    if (!fieldValidation.valid) {
      console.error('❌ Field validation failed:', fieldValidation.errors);
      setErrors(fieldValidation.errors);
      return;
    }
    
    console.log('🚀 Starting estimate request submission...');
    setLoading(true);
    
    // Track submission success separately to ensure navigation only happens on success
    let submissionSuccessful = false;
    
    try {
      const allServices = [...formData.selectedServices];
      if (formData.otherService) allServices.push(formData.otherService);
      
      // Calculate internal estimate for admin review (NOT shown to user)
      const internalEstimate = calculatePriceEstimate({
        services: allServices,
        zipCode: formData.propertyAddress,
        preferredDate: formData.date,
        comments: formData.comments,
        propertySize: formData.propertySize
      });
      
      console.log('📝 Submitting estimate request via Edge Function...', {
        name: formData.name,
        email: formData.email,
        services: allServices,
        mode,
        userId: mode === 'client' && user ? user.id : null
      });
      
      // Get the current session for authenticated requests
      // CRITICAL: Supabase edge functions require BOTH Authorization AND apikey headers
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mwvcbedvnimabfwubazz.supabase.co';
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2XfXwRvar5UqQSZVK5WTtFfmPZ0HskSY';
      
      let authHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': anonKey  // REQUIRED: Supabase edge functions need the apikey header
      };
      
      if (mode === 'client' && user) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          authHeaders['Authorization'] = `Bearer ${session.access_token}`;
          console.log('🔐 Including auth token in request');
        } else {
          console.warn('⚠️ No access token available for authenticated user');
        }
      }
      
      // Use the public endpoint that works for both guests and authenticated users
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/create-quote-and-job-public`;
      
      const requestPayload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        property_address: formData.propertyAddress,
        property_size: formData.propertySize || null,
        service_type: formData.serviceType || null,
        service_frequency: formData.serviceFrequency || null,
        preferred_date: formData.date || null,
        services: allServices,
        comments: formData.comments || null,
        internal_estimate: internalEstimate,
        // Include user_id for client mode to link the request
        user_id: mode === 'client' && user ? user.id : null
      };
      
      // Log full payload in dev mode
      if (isDev) {
        console.log('[DEV] Full request payload:', JSON.stringify(requestPayload, null, 2));
        console.log('[DEV] Request headers:', JSON.stringify({ ...authHeaders, apikey: '[REDACTED]' }));
        console.log('[DEV] Edge function URL:', edgeFunctionUrl);
      }
      
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(requestPayload)
      });



      const responseData = await response.json();

      // Log full response in dev mode
      if (isDev) {
        console.log('[DEV] Edge Function Response:', {
          status: response.status,
          ok: response.ok,
          data: responseData
        });
      }

      if (!response.ok) {
        // Parse the error using our error handler
        const parsedError = parseQuoteSubmissionError({
          code: responseData.code || response.status.toString(),
          message: responseData.error || responseData.message || 'Failed to create quote',
          details: responseData.details
        });
        
        setSubmissionError(parsedError);
        
        const formattedError = formatQuoteError(parsedError);
        
        // Show detailed error in dev mode
        if (isDev && formattedError.devInfo) {
          console.error('[DEV] Quote submission error:', formattedError.devInfo);
        }
        
        throw new Error(formattedError.message);
      }
      
      // Verify the response indicates success
      if (!responseData.success && !responseData.quoteId) {
        const parsedError = parseQuoteSubmissionError({
          message: 'Quote creation did not return success confirmation',
          details: JSON.stringify(responseData)
        });
        setSubmissionError(parsedError);
        throw new Error('Unable to confirm quote was created. Please try again.');
      }
      
      console.log('✅ Estimate request created successfully:', responseData);
      
      // Mark submission as successful ONLY after confirmed success
      submissionSuccessful = true;

      // Save profile updates if in client mode (non-blocking)
      saveProfileUpdates().catch(err => {
        console.warn('⚠️ Profile update failed (non-critical):', err);
      });

      // Send email notification (fire-and-forget, non-blocking)
      // Note: supabaseUrl and anonKey already defined above
      const emailPayload = {
        type: 'quote_confirmation',
        to: formData.email,
        data: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || '',
          propertyAddress: formData.propertyAddress,
          propertySize: formData.propertySize || '',
          serviceType: formData.serviceType || '',
          services: allServices,
          date: formData.date || '',
          comments: formData.comments || ''
        }
      };
      
      // Fire-and-forget email - don't block navigation
      fetch(`${supabaseUrl}/functions/v1/unified-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey || ''
        },
        body: JSON.stringify(emailPayload)
      })
      .then(async (emailResponse) => {

        const data = await emailResponse.json();
        if (emailResponse.ok && data.success) {
          console.log('✅ Email sent successfully');
        } else {
          console.warn('⚠️ Email failed (request still saved):', data);
        }
      })
      .catch((emailError) => {
        console.warn('⚠️ Email request failed (request still saved):', emailError.message);
      });

      trackQuoteSubmission(allServices);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        propertyAddress: '',
        propertySize: '',
        serviceType: '',
        serviceFrequency: '',
        selectedServices: [],
        otherService: '',
        date: '',
        comments: '',
      });

    } catch (err: any) {
      console.error('❌ Estimate request submission error:', err);
      
      // If we haven't already set a parsed error, parse it now
      if (!submissionError) {
        const parsedError = parseQuoteSubmissionError(err);
        setSubmissionError(parsedError);
        
        const formattedError = formatQuoteError(parsedError);
        setErrors({ 
          submit: formattedError.message,
          ...(isDev && formattedError.devInfo ? { devInfo: formattedError.devInfo } : {})
        });
      } else {
        setErrors({ submit: err.message || 'Failed to submit estimate request. Please try again.' });
      }
      
      // Ensure we don't navigate on error
      submissionSuccessful = false;
    } finally {
      console.log('🔄 Resetting loading state');
      setLoading(false);
      
      // CRITICAL: Only navigate to thank you page if submission was confirmed successful
      if (submissionSuccessful) {
        console.log('✅ Submission confirmed successful, navigating to thank you page');
        navigate('/thank-you');
      } else {
        console.log('❌ Submission failed, staying on form');
      }
    }
  };



  // =============================================================================
  // LOADING STATES
  // =============================================================================

  const LayoutWrapper = mode === 'client' ? AppLayout : AppLayoutClean;

  if (authLoading && mode === 'client') {
    return (
      <LayoutWrapper>
        <AnimatedBackground />
        {/* Mobile: 100dvh for iOS Safari | Desktop: 100vh for stability */}
        <div className="flex items-center justify-center min-h-[100dvh] md:min-h-screen bg-gray-950">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  if (dataLoading) {
    return (
      <LayoutWrapper>
        <AnimatedBackground />
        {/* Mobile: 100dvh for iOS Safari | Desktop: 100vh for stability */}
        <div className="flex items-center justify-center min-h-[100dvh] md:min-h-screen bg-gray-950">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
            <p className="text-gray-400">
              {mode === 'client' ? 'Loading your information...' : 'Loading estimate request form...'}
            </p>
          </div>
        </div>
      </LayoutWrapper>
    );
  }


  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <LayoutWrapper>
      <AnimatedBackground />
      {/* 
        Mobile/Desktop viewport height strategy:
        - Mobile (default): min-h-[100dvh] for iOS Safari compatibility (handles address bar/toolbar)
        - Desktop (md:+): min-h-screen (100vh) for stable, predictable centering
        
        This prevents:
        - iOS Safari content shift when address bar shows/hides
        - Desktop layout instability from dvh on browsers that handle it differently
        
        w-full and max-w-full prevent iOS auto-reflow issues
      */}
      <div className={cn(
        "flex flex-col w-full max-w-full items-center px-4",
        // Mobile: 100dvh for iOS Safari | Desktop: 100vh for stability
        "min-h-[100dvh] md:min-h-screen",
        // On mobile: align to top with padding; on desktop: center vertically
        mode === 'client' 
          ? "pt-20 pb-8 md:pt-24 md:justify-center" 
          : "pt-8 pb-8 md:py-8 md:justify-center"
      )}>



        {/* Navigation - Guest mode only */}
        {mode === 'guest' && (
          <div className="w-full max-w-4xl mb-8">
            <GlobalNavigation />
            <Breadcrumb
              items={[
                { label: 'Home', path: '/' },
                { label: 'Request Estimate', path: '/get-quote', isActive: true }
              ]}
              className="mt-2"
            />
          </div>
        )}
        
        <div className="mb-8">
          <Logo size="large" />
        </div>

        {/* Trust Indicators */}
        <div className="w-full max-w-4xl mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 bg-gray-900/50 border border-green-500/20 rounded-lg p-4">
              <MapPin className="w-8 h-8 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-white font-medium text-sm">Property Evaluation</p>
                <p className="text-gray-400 text-xs">We assess your specific site</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gray-900/50 border border-green-500/20 rounded-lg p-4">
              <ClipboardCheck className="w-8 h-8 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-white font-medium text-sm">Professional Review</p>
                <p className="text-gray-400 text-xs">Expert estimate within 24-48 hrs</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gray-900/50 border border-green-500/20 rounded-lg p-4">
              <Users className="w-8 h-8 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-white font-medium text-sm">Tailored Pricing</p>
                <p className="text-gray-400 text-xs">Based on your property needs</p>
              </div>
            </div>
          </div>
        </div>

        <Card className="w-full max-w-4xl bg-black/95 border-2 border-green-500 shadow-2xl shadow-green-500/30 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            {/* Progress Indicator - Mobile-first */}
            <div className="mb-2">
              <QuoteFormProgress 
                currentStep={currentFormStep} 
                totalSteps={4}
                steps={QUOTE_FORM_STEPS}
              />
            </div>
            
            <CardTitle className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600 mb-2">
              Request a Professional Landscaping Estimate
            </CardTitle>
            <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto">
              Tell us about your property and service needs. Our team will evaluate your site and provide a detailed estimate within 24-48 hours.
            </p>
          </CardHeader>
          <CardContent>

            {/* Enhanced Error Display */}
            {(errors.submit || submissionError) && (
              <div className="mb-6 p-4 bg-red-900/30 border-2 border-red-500 rounded-lg shadow-lg shadow-red-500/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-300 font-medium">
                      {errors.submit || submissionError?.message || 'An error occurred'}
                    </p>
                    {/* Show error code and details in dev mode */}
                    {isDev && submissionError && (
                      <div className="mt-2 p-2 bg-red-950/50 rounded text-xs font-mono text-red-400">
                        <p>Code: {submissionError.code || 'N/A'}</p>
                        {submissionError.details && <p>Details: {submissionError.details}</p>}
                        <p>Auth Error: {submissionError.isAuthError ? 'Yes' : 'No'}</p>
                        <p>RLS Error: {submissionError.isRLSError ? 'Yes' : 'No'}</p>
                        <p>Retryable: {submissionError.isRetryable ? 'Yes' : 'No'}</p>
                      </div>
                    )}
                    {/* Show retry suggestion if applicable */}
                    {submissionError?.isRetryable && (
                      <p className="text-red-400/80 text-sm mt-2">
                        {submissionError.isAuthError 
                          ? 'Please sign out and sign back in, then try again.'
                          : 'Please try again in a moment.'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* ============================================================= */}
              {/* CONTACT INFORMATION SECTION */}
              {/* ============================================================= */}
              
              {mode === 'guest' ? (
                // GUEST MODE: Full contact section, always visible
                <div className="space-y-4">
                  <h3 className="text-green-400 font-semibold text-lg border-b border-green-500/30 pb-2">
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name" className="text-green-400 font-semibold">Full Name *</Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className={`bg-gray-900/80 text-white ${errors.name ? 'border-red-500' : 'border-green-500'}`}
                        placeholder="Enter your full name"
                      />
                      {errors.name && <FormError error={errors.name} />}
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-green-400 font-semibold">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className={`bg-gray-900/80 text-white ${errors.email ? 'border-red-500' : 'border-green-500'}`}
                        placeholder="you@example.com"
                      />
                      {errors.email && <FormError error={errors.email} />}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="phone" className="text-green-400 font-semibold">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        className={`bg-gray-900/80 text-white ${errors.phone ? 'border-red-500' : 'border-green-500'}`}
                        placeholder="(123) 456-7890"
                      />
                      {errors.phone && <FormError error={errors.phone} />}
                    </div>

                    <div>
                      <Label htmlFor="date" className="text-green-400 font-semibold">Preferred Start Date</Label>
                      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal bg-gray-900/80 border-green-500 text-white hover:bg-gray-800/80 hover:text-white",
                              !formData.date && "text-gray-400"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-green-400" />
                            {formData.date ? (
                              new Date(formData.date + 'T00:00:00').toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              })
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-gray-900 border-green-500" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.date ? new Date(formData.date + 'T00:00:00') : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const formattedDate = date.toISOString().split('T')[0];
                                handleChange('date', formattedDate);
                                setCalendarOpen(false);
                              }
                            }}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                            className="rounded-md"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              ) : (
                // CLIENT MODE: Collapsible contact section with pre-filled data
                <Collapsible open={contactSectionOpen} onOpenChange={setContactSectionOpen}>
                  <div className="space-y-4">
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="w-full flex items-center justify-between text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-500/10 rounded-lg">
                            <User className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <h3 className="text-green-400 font-semibold text-lg flex items-center gap-2">
                              Contact Information
                              <Check className="w-4 h-4 text-green-500" />
                            </h3>
                            <p className="text-gray-500 text-sm">
                              Pulled from your profile. Update anytime.
                            </p>
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-gray-800/50 group-hover:bg-gray-700/50 transition-colors">
                          {contactSectionOpen ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </button>
                    </CollapsibleTrigger>

                    {/* Summary when collapsed - 3 column grid */}
                    {!contactSectionOpen && (
                      <div className="ml-12 p-4 bg-gray-900/30 rounded-lg border border-gray-800">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <span className="text-gray-500 text-xs uppercase tracking-wide">Name</span>
                            <p className="text-gray-200 font-medium">{formData.name || 'Not set'}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-gray-500 text-xs uppercase tracking-wide">Email</span>
                            <p className="text-gray-200 font-medium">{formData.email || 'Not set'}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-gray-500 text-xs uppercase tracking-wide">Phone</span>
                            <p className="text-gray-200 font-medium">{formData.phone || 'Not set'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Expanded inputs - matching 3 column grid */}
                    <CollapsibleContent className="space-y-4">
                      <div className="ml-12 p-4 bg-gray-900/30 rounded-lg border border-gray-800">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name" className="text-gray-500 text-xs uppercase tracking-wide">Name *</Label>
                            <Input
                              id="name"
                              type="text"
                              value={formData.name}
                              onChange={(e) => handleChange('name', e.target.value)}
                              className={`bg-gray-900/80 text-white ${errors.name ? 'border-red-500' : 'border-gray-700 focus:border-green-500'}`}
                              placeholder="Enter your full name"
                            />
                            {errors.name && <FormError error={errors.name} />}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-500 text-xs uppercase tracking-wide">Email *</Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => handleChange('email', e.target.value)}
                              className={`bg-gray-900/80 text-white ${errors.email ? 'border-red-500' : 'border-gray-700 focus:border-green-500'}`}
                              placeholder="you@example.com"
                            />
                            {errors.email && <FormError error={errors.email} />}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="phone" className="text-gray-500 text-xs uppercase tracking-wide">Phone</Label>
                            <Input
                              id="phone"
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => handleChange('phone', e.target.value)}
                              className={`bg-gray-900/80 text-white ${errors.phone ? 'border-red-500' : 'border-gray-700 focus:border-green-500'}`}
                              placeholder="(123) 456-7890"
                            />
                            {errors.phone && <FormError error={errors.phone} />}
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              )}

              {/* ============================================================= */}
              {/* SERVICE TYPE SECTION */}
              {/* ============================================================= */}
              
              <div className="space-y-4" ref={serviceTypeRef}>
                <h3 className="text-green-400 font-semibold text-lg border-b border-green-500/30 pb-2">
                  Service Type
                </h3>
                
                <RadioGroup 
                  value={formData.serviceType} 
                  onValueChange={(value) => handleChange('serviceType', value)}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className={cn(
                    "flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all",
                    formData.serviceType === 'one-time' 
                      ? "border-green-500 bg-green-500/10" 
                      : "border-gray-700 hover:border-green-500/50"
                  )}>
                    <RadioGroupItem value="one-time" id="one-time" className="border-green-500 text-green-500" />
                    <Label htmlFor="one-time" className="text-white cursor-pointer">One-time service</Label>
                  </div>
                  <div className={cn(
                    "flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all",
                    formData.serviceType === 'ongoing' 
                      ? "border-green-500 bg-green-500/10" 
                      : "border-gray-700 hover:border-green-500/50"
                  )}>
                    <RadioGroupItem value="ongoing" id="ongoing" className="border-green-500 text-green-500" />
                    <Label htmlFor="ongoing" className="text-white cursor-pointer">Ongoing / scheduled maintenance</Label>
                  </div>
                </RadioGroup>


                {formData.serviceType === 'ongoing' && (
                  <div className="pl-4 border-l-2 border-green-500/30 mt-4">
                    <Label className="text-green-400 font-semibold mb-3 block">Preferred Frequency</Label>
                    <RadioGroup 
                      value={formData.serviceFrequency} 
                      onValueChange={(value) => handleChange('serviceFrequency', value)}
                      className="flex flex-wrap gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="weekly" id="weekly" className="border-green-500 text-green-500" />
                        <Label htmlFor="weekly" className="text-gray-300 cursor-pointer">Weekly</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="bi-weekly" id="bi-weekly" className="border-green-500 text-green-500" />
                        <Label htmlFor="bi-weekly" className="text-gray-300 cursor-pointer">Bi-weekly</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="monthly" id="monthly" className="border-green-500 text-green-500" />
                        <Label htmlFor="monthly" className="text-gray-300 cursor-pointer">Monthly</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
              </div>

              {/* ============================================================= */}
              {/* PREFERRED START DATE - Always visible in client mode */}
              {/* ============================================================= */}
              
              {mode === 'client' && (
                <div className="space-y-4">
                  <h3 className="text-green-400 font-semibold text-lg border-b border-green-500/30 pb-2">
                    Preferred Start Date
                  </h3>
                  <div className="max-w-sm">
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-gray-900/80 border-gray-700 text-white hover:bg-gray-800/80 hover:text-white hover:border-green-500/50",
                            !formData.date && "text-gray-400"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-green-400" />
                          {formData.date ? (
                            new Date(formData.date + 'T00:00:00').toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          ) : (
                            <span>Select a preferred start date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-gray-900 border-green-500" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.date ? new Date(formData.date + 'T00:00:00') : undefined}
                          onSelect={(date) => {
                            if (date) {
                              const formattedDate = date.toISOString().split('T')[0];
                              handleChange('date', formattedDate);
                              setCalendarOpen(false);
                            }
                          }}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                          className="rounded-md"
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-gray-500 mt-2">
                      Optional. Let us know when you'd like to start.
                    </p>
                  </div>
                </div>
              )}



              {/* ============================================================= */}
              {/* SERVICES SELECTION */}
              {/* ============================================================= */}
              
              <div className="space-y-4">
                <h3 className="text-green-400 font-semibold text-lg border-b border-green-500/30 pb-2">
                  Services Needed *
                </h3>
                <div className={`${errors.services ? 'ring-2 ring-red-500 rounded-lg' : ''}`}>
                  <ServiceCheckboxList
                    selectedServices={formData.selectedServices}
                    otherService={formData.otherService}
                    onServiceChange={handleServiceChange}
                    onOtherServiceChange={(value) => handleChange('otherService', value)}
                  />
                </div>
                {errors.services && <FormError error={errors.services} />}
              </div>

              {/* ============================================================= */}
              {/* PROPERTY INFORMATION */}
              {/* ============================================================= */}
              
              <div className="space-y-4">
                <h3 className="text-green-400 font-semibold text-lg border-b border-green-500/30 pb-2">
                  Property Information
                </h3>
                
                {/* Service Address - Different handling for client vs guest */}
                {mode === 'client' && savedProfile?.address && !useDifferentAddress ? (
                  // Client mode with saved address
                  <div>
                    <Label className="text-green-400 font-semibold">Service Address *</Label>
                    <div className="mt-2 p-4 bg-gray-900/50 border border-green-500/30 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-green-400 flex-shrink-0" />
                          <div>
                            <p className="text-white">{formData.propertyAddress}</p>
                            <p className="text-gray-500 text-sm">Primary address from your profile</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleUseDifferentAddress}
                          className="text-sm text-green-400 hover:text-green-300 underline"
                        >
                          Use a different address
                        </button>
                      </div>
                    </div>
                    {errors.propertyAddress && <FormError error={errors.propertyAddress} />}
                  </div>
                ) : (
                  // Guest mode OR client using different address
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="propertyAddress" className="text-green-400 font-semibold">Service Address *</Label>
                      {mode === 'client' && useDifferentAddress && savedProfile?.address && (
                        <button
                          type="button"
                          onClick={handleUseSavedAddress}
                          className="text-sm text-green-400 hover:text-green-300 underline"
                        >
                          Use saved address
                        </button>
                      )}
                    </div>
                    <Input
                      id="propertyAddress"
                      type="text"
                      value={formData.propertyAddress}
                      onChange={(e) => handleChange('propertyAddress', e.target.value)}
                      className={`bg-gray-900/80 text-white ${errors.propertyAddress ? 'border-red-500' : 'border-green-500'}`}
                      placeholder="123 Main Street, City, State, ZIP"
                    />
                    {errors.propertyAddress && <FormError error={errors.propertyAddress} />}
                    <p className="text-xs text-gray-500 mt-1">
                      Your address helps us evaluate your property for accurate estimating.
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="propertySize" className="text-green-400 font-semibold">
                    Approximate Property Size
                    <span className="text-gray-400 font-normal ml-2">(helps with accurate estimating)</span>
                  </Label>
                  <Select 
                    value={formData.propertySize} 
                    onValueChange={(value) => handleChange('propertySize', value)}
                  >
                    <SelectTrigger className="bg-gray-900/80 border-green-500 text-white">
                      <SelectValue placeholder="Select approximate lot size" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-green-500">
                      <SelectItem value="under-quarter" className="text-white hover:bg-gray-800">
                        Under ¼ acre
                      </SelectItem>
                      <SelectItem value="quarter-half" className="text-white hover:bg-gray-800">
                        ¼ – ½ acre
                      </SelectItem>
                      <SelectItem value="half-one" className="text-white hover:bg-gray-800">
                        ½ – 1 acre
                      </SelectItem>
                      <SelectItem value="over-one" className="text-white hover:bg-gray-800">
                        1+ acre
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ============================================================= */}
              {/* ADDITIONAL DETAILS */}
              {/* ============================================================= */}
              
              <div className="space-y-4">
                <h3 className="text-green-400 font-semibold text-lg border-b border-green-500/30 pb-2">
                  Additional Details
                </h3>
                <div>
                  <Label htmlFor="comments" className="text-green-400 font-semibold">Project Details & Special Requests</Label>
                  <Textarea
                    id="comments"
                    value={formData.comments}
                    onChange={(e) => handleChange('comments', e.target.value)}
                    className="bg-gray-900/80 border-green-500 text-white min-h-[120px]"
                    placeholder="Describe your project goals, any specific concerns, access considerations, or questions for our team..."
                  />
                </div>
              </div>

              {/* Evaluation Notice */}
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <p className="text-gray-300 text-sm">
                  <span className="text-green-400 font-semibold">What happens next?</span> After you submit this request, our team will review your property details and prepare a professional estimate. We'll contact you within 24-48 hours with pricing tailored to your specific property and service needs.
                </p>
              </div>

              <StandardizedButton
                type="submit"
                disabled={loading}
                label={loading ? "Submitting Request..." : "Submit Estimate Request"}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold py-4 px-8 rounded-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed text-lg border border-emerald-400/20 hover:border-emerald-400/40"
                loading={loading}
              />
              
              <p className="text-center text-gray-400 text-sm">
                * Required fields. Your information is secure and will only be used to prepare your estimate.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </LayoutWrapper>
  );
}
