import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Save, AlertCircle, CheckCircle, Loader2, Edit2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { MobileBottomSheet } from '@/components/mobile/MobileBottomSheet';

interface ServiceAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressUpdated?: () => void;
  /** If true, modal will auto-close after save and call callback. If false (default), shows collapsed success state */
  autoCloseOnSave?: boolean;
}

type ModalState = 'editing' | 'saving' | 'success';

const log = (msg: string, data?: any) => {
  console.log(`[ADDRESS_MODAL] ${msg}`, data !== undefined ? data : '');
};

export const ServiceAddressModal: React.FC<ServiceAddressModalProps> = ({ 
  isOpen, 
  onClose,
  onAddressUpdated,
  autoCloseOnSave = false
}) => {
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<ModalState>('editing');
  const [error, setError] = useState('');
  
  // Store saved address for display in success state
  const [savedAddress, setSavedAddress] = useState({
    address: '',
    city: '',
    state: '',
    zip: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadAddress();
      // Reset to editing state when modal opens
      setModalState('editing');
      setError('');
    }
  }, [isOpen]);

  const loadAddress = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('address, city, state, zip')
        .eq('id', user.id)
        .maybeSingle(); // Use maybeSingle in case row doesn't exist yet

      if (error) throw error;
      setAddress(data?.address || '');
      setCity(data?.city || '');
      setState(data?.state || '');
      setZip(data?.zip || '');
    } catch (err) {
      log('Error loading address:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate all fields are present
    if (!address.trim()) {
      setError('Street address is required');
      return;
    }
    if (!city.trim()) {
      setError('City is required');
      return;
    }
    if (!state.trim()) {
      setError('State is required');
      return;
    }
    if (!zip.trim()) {
      setError('ZIP code is required');
      return;
    }

    if (!/^\d{5}(-\d{4})?$/.test(zip)) {
      setError('Invalid ZIP code format (use 12345 or 12345-6789)');
      return;
    }

    setModalState('saving');
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const addressData = {
        id: user.id, // Required for upsert
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        zip: zip.trim()
      };

      log('Saving address to database (upsert):', addressData);

      // USE UPSERT instead of UPDATE
      // This ensures the operation succeeds even if no row exists
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(addressData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (upsertError) {
        log('Database upsert error:', upsertError);
        throw upsertError;
      }

      log('Address saved successfully');

      // Store saved address for display
      setSavedAddress({
        address: addressData.address,
        city: addressData.city,
        state: addressData.state,
        zip: addressData.zip
      });
      
      // Set success state
      setModalState('success');
      
      // If autoCloseOnSave is enabled:
      // 1. Close the modal immediately
      // 2. Call the callback to notify parent
      // NO DELAYS - the Guard will handle the transition
      if (autoCloseOnSave) {
        log('Auto-close enabled - closing modal and calling callback');
        onClose();
        // Call callback immediately - the database write is already complete
        // The Guard will re-fetch from database to confirm
        onAddressUpdated?.();
      }
    } catch (err: any) {
      log('Save error:', err);
      setError(err.message || 'Failed to update address');
      setModalState('editing');
    }
  };

  const handleClose = () => {
    if (modalState !== 'saving') {
      onClose();
    }
  };

  const handleEditAgain = () => {
    setModalState('editing');
    setError('');
  };

  const handleDone = () => {
    onClose();
    // If not auto-close, call the callback when user clicks Done
    if (!autoCloseOnSave) {
      onAddressUpdated?.();
    }
  };

  // Format address for display
  const formatFullAddress = useCallback(() => {
    const parts = [savedAddress.address];
    const cityStateParts = [savedAddress.city, savedAddress.state].filter(Boolean).join(', ');
    if (cityStateParts) parts.push(cityStateParts);
    if (savedAddress.zip) parts.push(savedAddress.zip);
    return parts.join('\n');
  }, [savedAddress]);

  // Render success/collapsed state
  const renderSuccessState = () => (
    <div className="space-y-4">
      {/* Success confirmation banner */}
      <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex-1">
          <h4 className="text-emerald-300 font-medium mb-1">Address Saved</h4>
          <p className="text-sm text-emerald-200/70">
            Your service address has been updated successfully.
          </p>
        </div>
      </div>

      {/* Saved address display */}
      <div className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-400 mb-1">Service Address</p>
              <p className="text-white whitespace-pre-line">{formatFullAddress()}</p>
            </div>
          </div>
          <button
            onClick={handleEditAgain}
            className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            aria-label="Edit address"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress indicator hint */}
      <div className="flex items-center gap-2 text-sm text-gray-400 justify-center">
        <CheckCircle className="w-4 h-4 text-emerald-400" />
        <span>Profile progress updated</span>
      </div>
    </div>
  );

  // Render editing form
  const renderEditingForm = () => (
    <div className="space-y-4">
      <FormField 
        name="address" 
        label="Street Address" 
        value={address}
        onChange={setAddress} 
        placeholder="123 Main St" 
        required
        className="bg-gray-800 border-gray-700 text-white" 
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FormField 
          name="city" 
          label="City" 
          value={city}
          onChange={setCity} 
          placeholder="City" 
          required
          className="bg-gray-800 border-gray-700 text-white" 
        />
        <FormField 
          name="state" 
          label="State" 
          value={state}
          onChange={setState} 
          placeholder="NC" 
          required
          className="bg-gray-800 border-gray-700 text-white" 
        />
        <FormField 
          name="zip" 
          label="ZIP Code" 
          value={zip}
          onChange={setZip} 
          placeholder="28202" 
          required
          className="bg-gray-800 border-gray-700 text-white" 
        />
      </div>

      <p className="text-xs text-gray-500 mt-2">
        This address will be used for service delivery and coverage verification.
      </p>
    </div>
  );

  const renderFooter = () => {
    // Success state footer - just a done button
    if (modalState === 'success') {
      return (
        <div className="flex gap-3">
          <Button 
            onClick={handleEditAgain}
            variant="secondary"
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Address
          </Button>
          <Button 
            onClick={handleDone}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Done
          </Button>
        </div>
      );
    }

    // Editing/Saving state footer
    return (
      <div className="flex gap-3">
        <Button 
          onClick={handleClose} 
          disabled={modalState === 'saving'} 
          variant="secondary"
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={modalState === 'saving'}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          {modalState === 'saving' ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Address
            </>
          )}
        </Button>
      </div>
    );
  };

  // Dynamic title/subtitle based on state
  const getTitle = () => {
    if (modalState === 'success') return 'Address Updated';
    return 'Service Address';
  };

  const getSubtitle = () => {
    if (modalState === 'success') return 'Your changes have been saved';
    return 'Update your service location';
  };

  const getIcon = () => {
    if (modalState === 'success') {
      return <CheckCircle className="w-5 h-5 text-emerald-400" />;
    }
    return <MapPin className="w-5 h-5" />;
  };

  return (
    <MobileBottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title={getTitle()}
      subtitle={getSubtitle()}
      icon={getIcon()}
      footer={renderFooter()}
      height="auto"
    >
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/25 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto" />
          <p className="text-gray-400 mt-4">Loading address...</p>
        </div>
      ) : modalState === 'success' ? (
        renderSuccessState()
      ) : (
        renderEditingForm()
      )}
    </MobileBottomSheet>
  );
};
