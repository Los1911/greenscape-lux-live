import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';
import { User, Phone, MapPin, Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useFormValidation } from '@/hooks/useFormValidation';
import { ButtonLoading } from '@/components/ui/loading-spinner';
import { validatePhone } from '@/utils/formValidation';

interface EnhancedProfileEditFormProps {
  initialData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
  };
  onSave: (data: any) => void;
  onCancel: () => void;
}

export function EnhancedProfileEditForm({ initialData, onSave, onCancel }: EnhancedProfileEditFormProps) {
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
      address: initialData.address || ''
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
      address: { required: true, minLength: 10 }
    },
    onSubmit: async (formValues) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: formValues.firstName.trim(),
          last_name: formValues.lastName.trim(),
          phone: formValues.phone,
          address: formValues.address.trim()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setShowSuccess(true);
      
      // Dispatch custom event for dashboard refresh
      window.dispatchEvent(new CustomEvent('profileUpdated', { 
        detail: formValues 
      }));
      
      // Auto-close after success
      setTimeout(() => {
        onSave(formValues);
      }, 1500);
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
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
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
              onChange={(value) => setValue('firstName', value)}
              onBlur={() => setFieldTouched('firstName')}
              placeholder="Enter first name"
              required
              error={errors.firstName}
              touched={touched.firstName}
              className="bg-gray-800 border-gray-700 text-white"
            />
            
            <FormField
              name="lastName"
              label="Last Name"
              value={values.lastName}
              onChange={(value) => setValue('lastName', value)}
              onBlur={() => setFieldTouched('lastName')}
              placeholder="Enter last name"
              required
              error={errors.lastName}
              touched={touched.lastName}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <FormField
            name="phone"
            label="Phone Number"
            type="tel"
            value={values.phone}
            onChange={(value) => setValue('phone', value)}
            onBlur={() => setFieldTouched('phone')}
            placeholder="(555) 123-4567"
            required
            error={errors.phone}
            touched={touched.phone}
            className="bg-gray-800 border-gray-700 text-white"
          />

          <FormField
            name="address"
            label="Service Address"
            value={values.address}
            onChange={(value) => setValue('address', value)}
            onBlur={() => setFieldTouched('address')}
            placeholder="123 Main St, City, State 12345"
            required
            error={errors.address}
            touched={touched.address}
            className="bg-gray-800 border-gray-700 text-white"
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <ButtonLoading loading={isSubmitting} loadingText="Saving...">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </ButtonLoading>
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isSubmitting}
              className="bg-gray-700 hover:bg-gray-600 text-white"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}