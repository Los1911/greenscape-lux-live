import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayoutClean from '@/components/AppLayoutClean';
import AnimatedBackground from '@/components/AnimatedBackground';
import Logo from '@/components/Logo';
import ServiceCheckboxList from '@/components/ServiceCheckboxList';
import { StandardizedButton } from '@/components/ui/standardized-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { trackEvent, trackQuoteSubmission } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';

import GlobalNavigation from '@/components/navigation/GlobalNavigation';
import Breadcrumb from '@/components/navigation/Breadcrumb';

// Types for form validation
interface ValidationErrors {
  [key: string]: string;
}

// Validation functions
const validateField = (value: string, validation: ValidationRule): string | null => {
  if (validation.required && !value.trim()) {
    return validation.message || 'This field is required';
  }
  if (validation.pattern && value && !validation.pattern.test(value)) {
    return validation.message || 'Invalid format';
  }
  return null;
};

interface ValidationRule {
  required?: boolean;
  pattern?: RegExp;
  message?: string;
}

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
  message: 'Please enter your property address' 
};

// Form Error component
const FormError: React.FC<{ error: string }> = ({ error }) => (
  <div className="text-red-400 text-sm mt-1">{error}</div>
);
export default function GetQuoteEnhanced() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    propertyAddress: '',
    selectedServices: [] as string[],
    otherService: '',
    date: '',
    comments: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});

  // Track form start
  useEffect(() => {
    trackEvent('form_start', 'quote_form', 'get_quote_page');
  }, []);

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

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    
    // Real-time validation
    if (touched[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const handleServiceChange = (service: string, checked: boolean) => {
    const newServices = checked
      ? [...formData.selectedServices, service]
      : formData.selectedServices.filter((s) => s !== service);
    
    setFormData((prev) => ({ ...prev, selectedServices: newServices }));
    setTouched((prev) => ({ ...prev, services: true }));
    
    // Track service selection
    trackEvent(checked ? 'service_selected' : 'service_deselected', 'quote_form', service);
    
    if (newServices.length > 0 || formData.otherService) {
      const newErrors = { ...errors };
      delete newErrors.services;
      setErrors(newErrors);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (loading) {
      console.log('⚠️ Submission already in progress, ignoring...');
      return;
    }
    
    // Mark all fields as touched for validation display
    const allFields = ['name', 'email', 'phone', 'propertyAddress', 'services'];
    setTouched(allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}));
    
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }
    
    console.log('🚀 Starting quote submission...');
    setLoading(true);
    
    try {
      const allServices = [...formData.selectedServices];
      if (formData.otherService) allServices.push(formData.otherService);
      
      console.log('📝 Submitting quote to database...', {
        name: formData.name,
        email: formData.email,
        services: allServices
      });
      
      // Direct database insert without Promise.race timeout
      const { data: dbData, error: dbError } = await supabase
        .from('quote_requests')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          property_address: formData.propertyAddress,
          services: allServices,
          preferred_date: formData.date || null,
          comments: formData.comments || null,
          status: 'pending'
        })
        .select()
        .single();
      
      if (dbError) {
        console.error('❌ Database error:', dbError);
        throw new Error(`Failed to save quote: ${dbError.message}`);
      }
      
      console.log('✅ Quote saved to database:', dbData.id);

      // Send email notification using unified-email function (non-blocking)
      console.log('📧 Preparing to send email notification via unified-email...');
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mwvcbedvnimabfwubazz.supabase.co';
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      // Prepare unified-email payload with required fields
      const emailPayload = {
        type: 'quote_confirmation',
        to: formData.email,
        data: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || '',
          propertyAddress: formData.propertyAddress,
          services: allServices,
          date: formData.date || '',
          comments: formData.comments || ''
        }
      };

      // Debug logging before sending
      console.log('📨 Sending unified-email payload:', {
        type: 'quote_confirmation',
        to: formData.email,
        hasData: !!formData
      });
      
      console.log('📤 Full email payload:', JSON.stringify(emailPayload, null, 2));
      
      fetch(`${supabaseUrl}/functions/v1/unified-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey
        },
        body: JSON.stringify(emailPayload)
      })
      .then(async (response) => {
        console.log('📬 Email response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });
        
        const data = await response.json();
        console.log('📧 Email response data:', data);
        
        if (response.ok && data.success) {
          console.log('✅ Email sent successfully via unified-email');
        } else {
          console.error('⚠️ Email failed (quote still saved):', {
            status: response.status,
            data
          });
        }
      })
      .catch((emailError) => {
        console.error('❌ Email request failed (quote still saved):', {
          message: emailError.message,
          stack: emailError.stack
        });
      });





      // Track successful submission
      trackQuoteSubmission(allServices);
      console.log('✅ Analytics tracked');
      
      // Clear form
      setFormData({
        name: '',
        email: '',
        phone: '',
        propertyAddress: '',
        selectedServices: [],
        otherService: '',
        date: '',
        comments: '',
      });
      
      console.log('✅ Form cleared, navigating to thank you page...');
      
      // Navigate to thank you page
      navigate('/thank-you');

    } catch (err: any) {
      console.error('❌ Quote submission error:', err);
      setErrors({ 
        submit: err.message || 'Failed to submit quote request. Please try again.' 
      });
    } finally {
      // ALWAYS reset loading state
      console.log('🔄 Resetting loading state');
      setLoading(false);
    }
  };





  return (
    <AppLayoutClean>
      <AnimatedBackground />
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-full max-w-4xl mb-8">
          <GlobalNavigation />
          <Breadcrumb
            items={[
              { label: 'Home', path: '/' },
              { label: 'Get Quote', path: '/get-quote', isActive: true }
            ]}
            className="mt-2"
          />
        </div>
        
        <div className="mb-8">
          <Logo size="large" />
        </div>

        <Card className="w-full max-w-4xl bg-black/95 border-2 border-green-500 shadow-2xl shadow-green-500/30 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600 mb-2">
              Instant Landscaping Quote
            </CardTitle>
            <p className="text-gray-300 text-lg">
              Tell us about your property — we'll provide a detailed quote within 24 hours.
            </p>
          </CardHeader>
          <CardContent>

            {errors.submit && (
              <div className="mb-6 p-4 bg-red-900/30 border-2 border-red-500 rounded-lg text-red-300 shadow-lg shadow-red-500/20">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                  {errors.submit}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
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
                   {errors.name && <div className="text-red-400 text-sm mt-1">{errors.name}</div>}
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
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleChange('date', e.target.value)}
                    className="bg-gray-900/80 border-green-500 text-white"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="propertyAddress" className="text-green-400 font-semibold">Property Address *</Label>
                <Input
                  id="propertyAddress"
                  type="text"
                  value={formData.propertyAddress}
                  onChange={(e) => handleChange('propertyAddress', e.target.value)}
                  className={`bg-gray-900/80 text-white ${errors.propertyAddress ? 'border-red-500' : 'border-green-500'}`}
                  placeholder="123 Main Street, City, State, ZIP"
                />
                {errors.propertyAddress && <FormError error={errors.propertyAddress} />}
              </div>

              <div>
                <Label className="text-green-400 font-semibold mb-4 block text-lg">Services Needed *</Label>
                <div className={`bg-gray-900/50 rounded-lg p-6 ${errors.services ? 'border border-red-500' : 'border border-green-500/50'}`}>
                  <ServiceCheckboxList
                    selectedServices={formData.selectedServices}
                    otherService={formData.otherService}
                    onServiceChange={handleServiceChange}
                    onOtherServiceChange={(value) => handleChange('otherService', value)}
                  />
                </div>
                {errors.services && <FormError error={errors.services} />}
              </div>

              <div>
                <Label htmlFor="comments" className="text-green-400 font-semibold">Project Details & Special Requests</Label>
                <Textarea
                  id="comments"
                  value={formData.comments}
                  onChange={(e) => handleChange('comments', e.target.value)}
                  className="bg-gray-900/80 border-green-500 text-white min-h-[120px]"
                  placeholder="Tell us about your vision, property size, timeline, budget range, or any special requirements..."
                />
              </div>

              <StandardizedButton
                type="submit"
                disabled={loading}
                label={loading ? "Submitting Quote Request..." : "Get a Quote"}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold py-4 px-8 rounded-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed text-lg border border-emerald-400/20 hover:border-emerald-400/40"
                loading={loading}
              />
              
              <p className="text-center text-gray-400 text-sm">
                * Required fields. We'll respond within 24 hours with your personalized quote.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayoutClean>
  );
}