import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';
import { User, Save, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useFormValidation } from '@/hooks/useFormValidation';
import { validatePhone } from '@/utils/formValidation';

interface EnhancedProfileEditFormProps {
  initialData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  onSave: (data: any) => void;
  onCancel: () => void;
  /** If true, shows cancel button. Default true */
  showCancel?: boolean;
}

const log = (msg: string, data?: any) => {
  console.log(`[PROFILE_EDIT_FORM] ${msg}`, data !== undefined ? data : '');
};

export function EnhancedProfileEditForm({ 
  initialData, 
  onSave, 
  onCancel,
  showCancel = true
}: EnhancedProfileEditFormProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    setValue,
    setFieldTouched,
    handleSubmit
  } = useFormValidation({
    initialValues: {
      firstName: initialData.firstName || '',
      lastName: initialData.lastName || '',
      phone: initialData.phone || '',
      address: initialData.address || '',
      city: initialData.city || '',
      state: initialData.state || '',
      zip: initialData.zip || ''
    },
    validationRules: {
      firstName: { required: true, minLength: 2 },
      lastName: { required: true, minLength: 2 },
      phone: {
        required: true,
        custom: (value) => {
          const result = validatePhone(value);
          return result.isValid ? null : result.error!;
        }
      },
      address: { required: true, minLength: 5 },
      city: { required: true, minLength: 2 },
      state: { required: true, minLength: 2 },
      zip: { required: true, pattern: /^\d{5}(-\d{4})?$/ }
    },
    onSubmit: async (formValues) => {
      log('Submitting profile update');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const upsertData = {
        id: user.id, // Required for upsert
        first_name: formValues.firstName.trim(),
        last_name: formValues.lastName.trim(),
        phone: formValues.phone,
        address: formValues.address.trim(),
        city: formValues.city.trim(),
        state: formValues.state.trim(),
        zip: formValues.zip.trim()
      };

      log('Saving to database (upsert):', upsertData);

      // USE UPSERT instead of UPDATE
      // This ensures the operation succeeds even if no row exists
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(upsertData, {
          onConflict: 'id',
          ignoreDuplicates: false
        });

      if (upsertError) {
        log('Database error:', upsertError);
        throw upsertError;
      }

      log('Database upsert successful');

      // Show success message briefly
      setShowSuccess(true);
      
      // Call onSave callback IMMEDIATELY after database write confirms
      // NO DELAYS - the parent (modal) will handle closing and notifying the Guard
      // The Guard will re-fetch from database to confirm completion
      log('Calling onSave callback');
      onSave(formValues);
    }
  });

  return (
    <Card className="bg-gray-900 border-gray-700">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Edit Profile</h3>
          </div>
        </div>

        {submitError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/25 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{submitError}</p>
          </div>
        )}

        {showSuccess && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/25 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-400">Profile updated successfully!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField 
              name="firstName" 
              label="First Name" 
              value={values.firstName}
              onChange={(v) => setValue('firstName', v)} 
              onBlur={() => setFieldTouched('firstName')}
              placeholder="First name" 
              required 
              error={errors.firstName} 
              touched={touched.firstName}
              className="bg-gray-800 border-gray-700 text-white" 
            />
            <FormField 
              name="lastName" 
              label="Last Name" 
              value={values.lastName}
              onChange={(v) => setValue('lastName', v)} 
              onBlur={() => setFieldTouched('lastName')}
              placeholder="Last name" 
              required 
              error={errors.lastName} 
              touched={touched.lastName}
              className="bg-gray-800 border-gray-700 text-white" 
            />
          </div>

          <FormField 
            name="phone" 
            label="Phone" 
            type="tel" 
            value={values.phone}
            onChange={(v) => setValue('phone', v)} 
            onBlur={() => setFieldTouched('phone')}
            placeholder="(555) 123-4567" 
            required 
            error={errors.phone} 
            touched={touched.phone}
            className="bg-gray-800 border-gray-700 text-white" 
          />

          <FormField 
            name="address" 
            label="Street Address" 
            value={values.address}
            onChange={(v) => setValue('address', v)} 
            onBlur={() => setFieldTouched('address')}
            placeholder="123 Main St" 
            required 
            error={errors.address} 
            touched={touched.address}
            className="bg-gray-800 border-gray-700 text-white" 
          />

          <div className="grid grid-cols-3 gap-4">
            <FormField 
              name="city" 
              label="City" 
              value={values.city}
              onChange={(v) => setValue('city', v)} 
              onBlur={() => setFieldTouched('city')}
              placeholder="City" 
              required 
              error={errors.city} 
              touched={touched.city}
              className="bg-gray-800 border-gray-700 text-white" 
            />
            <FormField 
              name="state" 
              label="State" 
              value={values.state}
              onChange={(v) => setValue('state', v)} 
              onBlur={() => setFieldTouched('state')}
              placeholder="NC" 
              required 
              error={errors.state} 
              touched={touched.state}
              className="bg-gray-800 border-gray-700 text-white" 
            />
            <FormField 
              name="zip" 
              label="ZIP" 
              value={values.zip}
              onChange={(v) => setValue('zip', v)} 
              onBlur={() => setFieldTouched('zip')}
              placeholder="28202" 
              required 
              error={errors.zip} 
              touched={touched.zip}
              className="bg-gray-800 border-gray-700 text-white" 
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting || showSuccess}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : showSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            {showCancel && (
              <Button 
                type="button" 
                variant="secondary" 
                onClick={onCancel} 
                disabled={isSubmitting}
                className="bg-gray-700 hover:bg-gray-600 text-white"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>
    </Card>
  );
}
