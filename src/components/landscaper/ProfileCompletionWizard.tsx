import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@/lib/ConfigContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProfilePhotoUpload } from './ProfilePhotoUpload';
import { StripePaymentSetup } from './StripePaymentSetup';


interface WizardData {
  businessName: string;
  businessDescription: string;
  yearsInBusiness: string;
  serviceZipCodes: string;
  serviceRadius: string;
  licenseNumber: string;
  certifications: string;
  insuranceProvider: string;
  policyNumber: string;
  expirationDate: string;
  profilePhoto: File | null;
  profilePhotoUrl: string;
  stripeAccountId: string;
  stripeConnected: boolean;
}



const STORAGE_KEY = 'landscaper_profile_wizard';

export function ProfileCompletionWizard({ userId, onComplete }: { userId: string; onComplete: () => void }) {
  const supabase = useSupabaseClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeMessage, setStripeMessage] = useState('');
  const [formData, setFormData] = useState<WizardData>({
    businessName: '',
    businessDescription: '',
    yearsInBusiness: '',
    serviceZipCodes: '',
    serviceRadius: '',
    licenseNumber: '',
    certifications: '',
    insuranceProvider: '',
    policyNumber: '',
    expirationDate: '',
    profilePhoto: null,
    profilePhotoUrl: '',
    stripeAccountId: '',
    stripeConnected: false,
  });



  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed.data);
        setCurrentStep(parsed.step);
      } catch (e) {
        console.error('Failed to load saved progress');
      }
    }
    checkStripeStatus();
  }, []);

  const checkStripeStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('landscapers')
        .select('stripe_connect_id')
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle to avoid 406 errors when no row exists
      
      if (error) {
        console.error('[ProfileCompletionWizard] Error checking Stripe status:', error);
        return;
      }
      
      if (data?.stripe_connect_id) {
        setFormData(prev => ({ 
          ...prev, 
          stripeAccountId: data.stripe_connect_id,
          stripeConnected: true 
        }));
      }
    } catch (err) {
      console.error('[ProfileCompletionWizard] Error checking Stripe status:', err);
    }
  };





  const saveProgress = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ data: formData, step: currentStep }));
  };

  const updateField = (field: keyof WizardData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (file: File | null, previewUrl: string) => {
    setFormData(prev => ({ 
      ...prev, 
      profilePhoto: file, 
      profilePhotoUrl: previewUrl 
    }));
  };
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!formData.businessName && !!formData.yearsInBusiness;
      case 2:
        return true; // Photo is optional
      case 3:
        return !!formData.serviceZipCodes && !!formData.serviceRadius;
      case 4:
        return !!formData.licenseNumber;
      case 5:
        return !!formData.insuranceProvider && !!formData.policyNumber;
      case 6:
        return formData.stripeConnected; // Stripe must be connected
      default:
        return false;
    }
  };

  const handleStripeConnected = async (accountId: string) => {
    setFormData(prev => ({ ...prev, stripeAccountId: accountId, stripeConnected: true }));
    
    // Update database with correct column name
    await supabase
      .from('landscapers')
      .update({ stripe_connect_id: accountId })
      .eq('user_id', userId);
  };


  const handleNext = () => {
    if (!validateStep(currentStep)) {
      setError('Please fill in all required fields');
      return;
    }
    setError('');
    saveProgress();
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };



  const handleBack = () => {
    setError('');
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setError('');

    try {
      let profilePhotoUrl = '';

      // Upload profile photo if provided
      if (formData.profilePhoto) {
        const fileExt = formData.profilePhoto.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `profile-photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('landscaper-documents')
          .upload(filePath, formData.profilePhoto);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('landscaper-documents')
          .getPublicUrl(filePath);

        profilePhotoUrl = publicUrl;
      }

      // NOTE: license_number column does not exist in the database - do not include it
      // Store license info in certifications field instead if needed
      const { error: updateError } = await supabase
        .from('landscapers')
        .update({
          business_name: formData.businessName,
          business_description: formData.businessDescription,
          years_in_business: parseInt(formData.yearsInBusiness),
          service_zip_codes: formData.serviceZipCodes,
          service_radius: parseInt(formData.serviceRadius),
          // license_number does not exist - store in certifications if needed
          certifications: formData.licenseNumber 
            ? `License: ${formData.licenseNumber}${formData.certifications ? ', ' + formData.certifications : ''}`
            : formData.certifications,
          insurance_provider: formData.insuranceProvider,
          policy_number: formData.policyNumber,
          insurance_expiration: formData.expirationDate,
          profile_photo_url: profilePhotoUrl || null,
        })
        .eq('user_id', userId);


      if (updateError) throw updateError;

      localStorage.removeItem(STORAGE_KEY);
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };


  const steps = [
    { num: 1, title: 'Business Details' },
    { num: 2, title: 'Profile Photo' },
    { num: 3, title: 'Service Areas' },
    { num: 4, title: 'Certifications' },
    { num: 5, title: 'Insurance Info' },
    { num: 6, title: 'Payout Setup' },
  ];




  return (
    <div className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">

      <div className="text-center">
        <h2 className="text-2xl font-bold text-emerald-300 mb-2">Professional Setup</h2>
        <p className="text-emerald-200/60">Step {currentStep} of 6 — Business verification details</p>
      </div>


      <div className="flex justify-between mb-8 overflow-x-auto">
        {steps.map((step) => (
          <div key={step.num} className="flex flex-col items-center flex-1 min-w-[60px]">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
              step.num === currentStep 
                ? 'bg-emerald-500 border-emerald-500 text-black shadow-[0_0_20px_rgba(52,211,153,0.5)]' 
                : step.num < currentStep
                ? 'bg-emerald-500/30 border-emerald-500/50 text-emerald-300'
                : 'bg-black/40 border-emerald-500/20 text-emerald-500/40'
            }`}>
              {step.num}
            </div>
            <p className={`text-xs mt-2 text-center ${step.num === currentStep ? 'text-emerald-300' : 'text-emerald-500/40'}`}>
              {step.title}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {currentStep === 1 && (
          <>
            <div>
              <Label className="text-emerald-300">Business Name *</Label>
              <Input
                value={formData.businessName}
                onChange={(e) => updateField('businessName', e.target.value)}
                className="bg-black/40 border-emerald-500/30 text-emerald-100 w-full"
                placeholder="Green Lawn Services LLC"
              />
            </div>
            <div>
              <Label className="text-emerald-300">Business Description</Label>
              <Textarea
                value={formData.businessDescription}
                onChange={(e) => updateField('businessDescription', e.target.value)}
                className="bg-black/40 border-emerald-500/30 text-emerald-100 w-full"
                placeholder="Professional landscaping services..."
              />
            </div>
            <div>
              <Label className="text-emerald-300">Years in Business *</Label>
              <Input
                type="number"
                value={formData.yearsInBusiness}
                onChange={(e) => updateField('yearsInBusiness', e.target.value)}
                className="bg-black/40 border-emerald-500/30 text-emerald-100 w-full"
                placeholder="5"
              />
            </div>
          </>
        )}

        {currentStep === 2 && (
          <ProfilePhotoUpload
            currentPhotoUrl={formData.profilePhotoUrl}
            onPhotoChange={handlePhotoChange}
            error={error}
          />
        )}

        {currentStep === 3 && (
          <>
            <div>
              <Label className="text-emerald-300">Service Zip Codes *</Label>
              <Input
                value={formData.serviceZipCodes}
                onChange={(e) => updateField('serviceZipCodes', e.target.value)}
                className="bg-black/40 border-emerald-500/30 text-emerald-100 w-full"
                placeholder="90210, 90211, 90212"
              />
            </div>
            <div>
              <Label className="text-emerald-300">Service Radius (miles) *</Label>
              <Input
                type="number"
                value={formData.serviceRadius}
                onChange={(e) => updateField('serviceRadius', e.target.value)}
                className="bg-black/40 border-emerald-500/30 text-emerald-100 w-full"
                placeholder="25"
              />
            </div>
          </>
        )}

        {currentStep === 4 && (
          <>
            <div>
              <Label className="text-emerald-300">License Number *</Label>
              <Input
                value={formData.licenseNumber}
                onChange={(e) => updateField('licenseNumber', e.target.value)}
                className="bg-black/40 border-emerald-500/30 text-emerald-100 w-full"
                placeholder="LIC-123456"
              />
            </div>
            <div>
              <Label className="text-emerald-300">Certifications (comma-separated)</Label>
              <Textarea
                value={formData.certifications}
                onChange={(e) => updateField('certifications', e.target.value)}
                className="bg-black/40 border-emerald-500/30 text-emerald-100 w-full"
                placeholder="Certified Arborist, Pesticide Applicator"
              />
            </div>
          </>
        )}

        {currentStep === 5 && (
          <>
            <div>
              <Label className="text-emerald-300">Insurance Provider *</Label>
              <Input
                value={formData.insuranceProvider}
                onChange={(e) => updateField('insuranceProvider', e.target.value)}
                className="bg-black/40 border-emerald-500/30 text-emerald-100 w-full"
                placeholder="State Farm"
              />
            </div>
            <div>
              <Label className="text-emerald-300">Policy Number *</Label>
              <Input
                value={formData.policyNumber}
                onChange={(e) => updateField('policyNumber', e.target.value)}
                className="bg-black/40 border-emerald-500/30 text-emerald-100 w-full"
                placeholder="POL-789012"
              />
            </div>
            <div>
              <Label className="text-emerald-300">Expiration Date</Label>
              <Input
                type="date"
                value={formData.expirationDate}
                onChange={(e) => updateField('expirationDate', e.target.value)}
                className="bg-black/40 border-emerald-500/30 text-emerald-100 w-full"
              />
            </div>
          </>
        )}

        {currentStep === 6 && (
          <StripePaymentSetup 
            userId={userId} 
            onConnected={handleStripeConnected} 
            alreadyConnected={formData.stripeConnected} 
          />
        )}

      </div>


      {error && (
        <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        {currentStep > 1 && (
          <Button
            onClick={handleBack}
            variant="outline"
            className="flex-1 bg-black/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
          >
            Back
          </Button>
        )}
        {currentStep < 6 ? (
          <Button
            onClick={handleNext}
            className="flex-1 bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 hover:bg-emerald-500/30 hover:shadow-[0_0_20px_rgba(52,211,153,0.3)]"
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={saving || !formData.stripeConnected}
            className="flex-1 bg-emerald-500 text-black hover:bg-emerald-400 hover:shadow-[0_0_25px_rgba(52,211,153,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Finish Setup'}
          </Button>
        )}
      </div>

    </div>
  );
}
