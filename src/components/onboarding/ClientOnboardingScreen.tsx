import React, { useState, useCallback } from 'react';
import { CheckCircle2, User, MapPin, RefreshCw, ChevronRight, Sparkles } from 'lucide-react';
import { PersonalInformationModal } from '@/components/client/PersonalInformationModal';
import { ServiceAddressModal } from '@/components/client/ServiceAddressModal';

interface ProfileData {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  email: string | null;
}

interface ClientOnboardingScreenProps {
  /** Whether personal info step is complete (from Guard's DB check) */
  personalInfoComplete: boolean;
  /** Whether service address step is complete (from Guard's DB check) */
  serviceAddressComplete: boolean;
  /** Profile data for display (from Guard's DB check) */
  profileData: ProfileData | null;
  /** Called when a step is saved - triggers Guard to re-check database */
  onStepSaved: () => Promise<void>;
}

const log = (msg: string, data?: any) => {
  console.log(`[ONBOARDING_SCREEN] ${msg}`, data !== undefined ? data : '');
};

/**
 * ClientOnboardingScreen - UI for onboarding steps
 * 
 * This component ONLY handles UI. The Guard is the authority for completion status.
 * When a step is saved, it calls onStepSaved() which triggers the Guard to re-check
 * the database. The Guard then decides whether to show this screen or the dashboard.
 * 
 * NO navigation happens here. NO completion logic happens here.
 * This is purely a UI component that displays steps and handles modal state.
 */
export const ClientOnboardingScreen: React.FC<ClientOnboardingScreenProps> = ({
  personalInfoComplete,
  serviceAddressComplete,
  profileData,
  onStepSaved,
}) => {
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Handle personal info save - close modal and tell Guard to re-check
   */
  const handlePersonalInfoSaved = useCallback(async () => {
    log('Personal info saved - notifying guard');
    setShowPersonalModal(false);
    setIsSaving(true);
    
    try {
      // Tell the Guard to re-check the database
      // The Guard will decide whether to show dashboard or stay on onboarding
      await onStepSaved();
    } catch (error) {
      log('Error during step saved callback:', error);
    } finally {
      setIsSaving(false);
    }
  }, [onStepSaved]);

  /**
   * Handle address save - close modal and tell Guard to re-check
   */
  const handleAddressSaved = useCallback(async () => {
    log('Address saved - notifying guard');
    setShowAddressModal(false);
    setIsSaving(true);
    
    try {
      // Tell the Guard to re-check the database
      // The Guard will decide whether to show dashboard or stay on onboarding
      await onStepSaved();
    } catch (error) {
      log('Error during step saved callback:', error);
    } finally {
      setIsSaving(false);
    }
  }, [onStepSaved]);

  const totalSteps = 2;
  const completedSteps = (personalInfoComplete ? 1 : 0) + (serviceAddressComplete ? 1 : 0);
  const progressPercentage = (completedSteps / totalSteps) * 100;

  const steps = [
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Your name and contact details',
      icon: User,
      completed: personalInfoComplete,
      onClick: () => setShowPersonalModal(true),
      preview: personalInfoComplete && profileData ? 
        `${profileData.firstName} ${profileData.lastName}` : null,
      disabled: false,
    },
    {
      id: 'address',
      title: 'Service Address',
      description: 'Where we\'ll provide services',
      icon: MapPin,
      completed: serviceAddressComplete,
      onClick: () => setShowAddressModal(true),
      preview: serviceAddressComplete && profileData?.address ? 
        profileData.address.split(',')[0] : null,
      disabled: !personalInfoComplete,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#020b06] to-black overflow-y-auto overscroll-contain">
      {/* Header */}
      <div className="border-b border-emerald-500/20 bg-black/40 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Welcome to GreenScape Lux</h1>
              <p className="text-gray-400 mt-1">Let's get your account set up</p>
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>Step {completedSteps + 1} of {totalSteps}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-emerald-400">
              {completedSteps === totalSteps ? 'Complete!' : `${completedSteps} of ${totalSteps} steps completed`}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Saving indicator */}
        {isSaving && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
              <p className="text-emerald-300">Saving your information...</p>
            </div>
          </div>
        )}

        {/* Encouragement message */}
        {!isSaving && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-8">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-emerald-300 font-medium">Almost there!</p>
                <p className="text-gray-400 text-sm mt-1">
                  Complete these steps to unlock your full dashboard and start requesting premium lawn services.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isNext = index === completedSteps;
            
            return (
              <button
                key={step.id}
                onClick={step.onClick}
                disabled={step.disabled || isSaving}
                className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 ${
                  step.completed
                    ? 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50'
                    : step.disabled || isSaving
                    ? 'bg-gray-900/50 border-gray-800 cursor-not-allowed opacity-60'
                    : isNext
                    ? 'bg-black/60 border-emerald-500/50 hover:border-emerald-400 shadow-lg shadow-emerald-500/10'
                    : 'bg-black/60 border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Step indicator */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                    step.completed
                      ? 'bg-emerald-500 text-black'
                      : isNext
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                      : 'bg-gray-800 text-gray-500'
                  }`}>
                    {step.completed ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold ${
                        step.completed ? 'text-emerald-400' : step.disabled ? 'text-gray-500' : 'text-white'
                      }`}>
                        {step.title}
                      </h3>
                      {step.completed && (
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                          Saved
                        </span>
                      )}
                      {isNext && !step.completed && (
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full animate-pulse">
                          Next
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mt-0.5 ${
                      step.disabled ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {step.preview || step.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className={`h-5 w-5 flex-shrink-0 ${
                    step.completed ? 'text-emerald-400' : step.disabled ? 'text-gray-700' : 'text-gray-500'
                  }`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Help text */}
        <p className="text-center text-gray-500 text-sm mt-8">
          Your information is secure and will only be used to provide you with the best service.
        </p>
      </div>

      {/* Modals - callbacks trigger Guard to re-check database */}
      <PersonalInformationModal
        isOpen={showPersonalModal}
        onClose={() => setShowPersonalModal(false)}
        onProfileUpdated={handlePersonalInfoSaved}
        autoCloseOnSave={true}
      />

      <ServiceAddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onAddressUpdated={handleAddressSaved}
        autoCloseOnSave={true}
      />
    </div>
  );
};

export default ClientOnboardingScreen;
