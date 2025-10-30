import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import AnimatedBackground from '@/components/AnimatedBackground';
import Logo from '@/components/Logo';
import ServiceCheckboxList from '@/components/ServiceCheckboxList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

export default function ClientQuoteForm() {
  console.log('🏁 ClientQuoteForm component mounted/rendered');
  
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    propertyAddress: '',
    propertySize: '',
    budget: '',
    selectedServices: [] as string[],
    otherService: '',
    date: '',
    comments: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          navigate('/client-login');
          return;
        }

        const { data: clientData } = await supabase
          .from('profiles')
          .select('first_name, last_name, email, phone, address')
          .eq('id', user.id)
          .maybeSingle();

        setFormData((prev) => ({
          ...prev,
          name: clientData ? `${clientData.first_name || ''} ${clientData.last_name || ''}`.trim() : user.user_metadata?.name || '',
          email: clientData?.email || user.email || '',
          phone: clientData?.phone || '',
          propertyAddress: clientData?.address || '',
        }));
      } catch (err) {
        console.error('Error fetching client data:', err);
        setError('Failed to load your information. Please try again.');
      } finally {
        setDataLoading(false);
      }
    };

    fetchClientData();
  }, [navigate]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleServiceChange = (service: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      selectedServices: checked
        ? [...prev.selectedServices, service]
        : prev.selectedServices.filter((s) => s !== service),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🎯 STEP 1: Form submit event fired - preventDefault() called');
    
    if (loading) {
      console.log('⚠️ STEP 1 BLOCKED: Submission already in progress');
      return;
    }
    
    setLoading(true);
    setError('');
    console.log('🎯 STEP 2: Loading state set to TRUE');

    // CRITICAL: Failsafe timeout to reset loading state after 15 seconds
    const failsafeTimeout = setTimeout(() => {
      console.error('🚨 FAILSAFE TRIGGERED: Resetting loading state after 15s');
      setLoading(false);
      setError('Request timed out. Please try again or contact support.');
    }, 15000);

    if (formData.selectedServices.length === 0 && !formData.otherService) {
      console.log('❌ STEP 2 FAILED: No services selected');
      setError('Please select at least one service.');
      setLoading(false);
      clearTimeout(failsafeTimeout);
      return;
    }

    console.log('🎯 STEP 3: Validation passed - starting submission');
    console.log('🔍 Environment check:', {
      mode: import.meta.env.MODE,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      hasAnonKey: !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      urlLength: import.meta.env.VITE_SUPABASE_URL?.length || 0
    });

    try {
      const allServices = [...formData.selectedServices];
      if (formData.otherService) allServices.push(formData.otherService);

      console.log('🎯 STEP 4: Inserting quote to database...');
      const startTime = Date.now();

      // Database insert with 8 second timeout
      const dbPromise = supabase
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

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database timeout after 8s')), 8000)
      );

      const { data: dbData, error: dbError } = await Promise.race([
        dbPromise,
        timeoutPromise
      ]) as any;

      const dbTime = Date.now() - startTime;
      console.log(`🎯 STEP 5: Database operation completed in ${dbTime}ms`);

      if (dbError) {
        console.error('❌ STEP 5 FAILED: Database error:', dbError);
        throw new Error(`Failed to save quote: ${dbError.message}`);
      }

      if (!dbData) {
        console.error('❌ STEP 5 FAILED: No data returned from database');
        throw new Error('Failed to save quote: No data returned');
      }

      console.log('✅ STEP 5 SUCCESS: Quote saved with ID:', dbData.id);

      // Send email notification (BLOCKING - wait for completion)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      console.log('🎯 STEP 6: Checking environment variables for email...');
      console.log('📋 Environment variables status:', {
        supabaseUrl: supabaseUrl || 'MISSING',
        supabaseUrlType: typeof supabaseUrl,
        anonKeyPresent: !!anonKey,
        anonKeyType: typeof anonKey
      });
      
      if (!supabaseUrl || !anonKey) {
        console.error('❌ STEP 6 FAILED: Missing environment variables!');
        console.error('⚠️ Email will be skipped - this should NOT happen in production!');
        console.error('🔍 Check Vercel environment variables configuration');
      } else {
        console.log('✅ STEP 6: Environment variables present - proceeding with email');
        
        try {
          console.log('🎯 STEP 7: Preparing to send email via unified-email...');
          const emailStartTime = Date.now();
          const emailUrl = `${supabaseUrl}/functions/v1/unified-email`;
          
          console.log('📧 Email endpoint:', emailUrl);
          console.log('📦 Email payload:', {
            type: 'quote_confirmation',
            dataKeys: Object.keys({
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              propertyAddress: formData.propertyAddress,
              propertySize: formData.propertySize,
              budget: formData.budget,
              services: allServices,
              date: formData.date,
              comments: formData.comments
            })
          });
          
          console.log('🚀 STEP 8: Executing fetch() call to unified-email...');
          
          const emailResponse = await fetch(emailUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${anonKey}`,
              'apikey': anonKey
            },
            body: JSON.stringify({
              type: 'quote_confirmation',
              data: {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                propertyAddress: formData.propertyAddress,
                propertySize: formData.propertySize,
                budget: formData.budget,
                services: allServices,
                date: formData.date,
                comments: formData.comments
              }
            })
          });

          const emailTime = Date.now() - emailStartTime;
          console.log(`✅ STEP 8 SUCCESS: fetch() completed in ${emailTime}ms`);
          console.log('📬 Email response status:', emailResponse.status);
          console.log('📬 Email response ok:', emailResponse.ok);
          
          const emailData = await emailResponse.json();
          console.log('📬 Email response data:', emailData);
          
          if (emailResponse.ok) {
            console.log('✅ STEP 9: Email sent successfully');
          } else {
            console.warn('⚠️ STEP 9: Email failed but continuing (non-critical):', emailData);
          }
        } catch (emailError) {
          console.error('❌ STEP 8 FAILED: Email error (non-critical):', emailError);
          console.error('📋 Email error details:', {
            message: emailError instanceof Error ? emailError.message : 'Unknown error',
            stack: emailError instanceof Error ? emailError.stack : undefined
          });
          // Don't throw - email failure shouldn't block quote submission
        }
      }

      // Clear failsafe timeout before navigation
      clearTimeout(failsafeTimeout);
      console.log('✅ STEP 10: Failsafe timeout cleared');

      console.log('🎯 STEP 11: Navigating to /thank-you page...');
      // Navigate immediately - loading state will be reset in finally block
      navigate('/thank-you');
      console.log('✅ STEP 11 SUCCESS: navigate() called');

    } catch (err: any) {
      console.error('❌ SUBMISSION FAILED - Error caught in catch block:', err);
      console.error('📋 Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      clearTimeout(failsafeTimeout);
      setError(err.message || 'Failed to submit quote. Please try again or contact support.');
    } finally {
      // CRITICAL: Always reset loading state in finally block
      // Use setTimeout to allow navigation to complete first (prevents re-render during navigation)
      setTimeout(() => {
        setLoading(false);
        console.log('✅ FINALLY BLOCK FIRED: Loading state reset complete.');
      }, 100);
    }
  };


  // DIAGNOSTIC: Log handleSubmit existence before render
  console.log('🔍 RENDER CHECK: handleSubmit function exists:', typeof handleSubmit === 'function');
  console.log('🔍 RENDER CHECK: loading state:', loading);
  console.log('🔍 RENDER CHECK: Component rendering at:', new Date().toISOString());

  if (dataLoading) {

    return (
      <AppLayout>
        <AnimatedBackground />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-green-400 text-xl">Loading...</div>
        </div>
      </AppLayout>
    );
  }


  return (
    <AppLayout>
      <AnimatedBackground />
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-24 pb-8">
        <div className="mb-8">
          <Logo size="large" />
        </div>

        <Card className="w-full max-w-4xl bg-black/95 border-2 border-green-500 shadow-2xl shadow-green-500/30">
          <CardHeader className="text-center">
            <CardTitle className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600 mb-2">
              Instant Landscaping Quote
            </CardTitle>
            <p className="text-gray-300 text-lg">
              Tell us about your property — we'll provide a detailed quote within 24 hours.
            </p>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-6 p-4 bg-red-900/30 border-2 border-red-500 rounded-lg text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name" className="text-green-400 font-semibold">Full Name *</Label>
                  <Input 
                    id="name" 
                    type="text" 
                    required 
                    value={formData.name} 
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="bg-gray-900/80 border-green-500 text-white" 
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-green-400 font-semibold">Email Address *</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    required 
                    value={formData.email} 
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="bg-gray-900/80 border-green-500 text-white" 
                  />
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
                    className="bg-gray-900/80 border-green-500 text-white" 
                    placeholder="(123) 456-7890"
                  />
                </div>
                <div>
                  <Label htmlFor="date" className="text-green-400 font-semibold">Preferred Start Date</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    value={formData.date} 
                    onChange={(e) => handleChange('date', e.target.value)} 
                    className="bg-gray-900/80 border-green-500 text-white" 
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="propertyAddress" className="text-green-400 font-semibold">Property Address *</Label>
                <Input 
                  id="propertyAddress" 
                  type="text" 
                  required 
                  value={formData.propertyAddress} 
                  onChange={(e) => handleChange('propertyAddress', e.target.value)}
                  className="bg-gray-900/80 border-green-500 text-white" 
                  placeholder="606 NC Music Factory Blvd"
                />
              </div>

              <div>
                <Label className="text-green-400 font-semibold mb-4 block text-lg">Services Needed *</Label>
                <div className="bg-gray-900/50 border border-green-500/50 rounded-lg p-6">
                  <ServiceCheckboxList
                    selectedServices={formData.selectedServices}
                    otherService={formData.otherService}
                    onServiceChange={handleServiceChange}
                    onOtherServiceChange={(value) => handleChange('otherService', value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="comments" className="text-green-400 font-semibold">Project Details & Special Requests</Label>
                <Textarea 
                  id="comments" 
                  value={formData.comments} 
                  onChange={(e) => handleChange('comments', e.target.value)} 
                  className="bg-gray-900/80 border-green-500 text-white min-h-[100px]" 
                  placeholder="Tell us about your vision, property size, timeline, budget range, or any special requirements..."
                />
              </div>
              <Button 
                type="submit" 
                disabled={loading}
                onClick={(e) => {
                  console.log('🖱️ BUTTON CLICKED - Direct onClick handler fired');
                  console.log('🖱️ Button type:', e.currentTarget.type);
                  console.log('🖱️ Loading state at click:', loading);
                  console.log('🖱️ Form element:', e.currentTarget.form);
                }}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold py-4 px-8 rounded-lg shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    Submitting Quote Request...
                  </div>
                ) : (
                  'Get My Free Quote'
                )}
              </Button>

              <p className="text-center text-gray-400 text-sm mt-4">
                * Required fields. We'll respond with your personalized quote within 24 hours.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
