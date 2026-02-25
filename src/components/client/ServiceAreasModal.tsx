import React, { useState, useEffect } from 'react';
import { MapPin, CheckCircle, AlertCircle, Loader2, Users, Calendar, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ServiceCoverageMap } from './ServiceCoverageMap';
import { AISuggestionChip } from './AISuggestionChip';
import { ScheduleServiceModal } from './ScheduleServiceModal';
import { ExpansionWaitlistForm } from './ExpansionWaitlistForm';
import { MobileBottomSheet } from '@/components/mobile/MobileBottomSheet';
import { useToast } from '@/hooks/use-toast';
import '@/styles/coverage-animations.css';



interface ServiceAreasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CoverageData {
  zipCode: string;
  hasCoverage: boolean;
  isConfigured: boolean;
  landscaperCount: number;
  landscapers: Array<{
    id: string;
    business_name: string;
    rating: number;
    services_offered: string[];
  }>;
  nearbyZipCodes: Array<{ zip_code: string; city: string; state: string }>;
  areaInfo?: {
    type: string;
    city?: string;
    state?: string;
  };
}

export const ServiceAreasModal: React.FC<ServiceAreasModalProps> = ({ isOpen, onClose }) => {
  const [userZip, setUserZip] = useState('');
  const [loading, setLoading] = useState(true);
  const [coverageData, setCoverageData] = useState<CoverageData | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [showAIChip, setShowAIChip] = useState(false);
  const { toast } = useToast();


  useEffect(() => {
    if (isOpen) {
      loadUserZip();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleAddressUpdate = (event: any) => {
      if (event.detail?.zip) {
        console.log('[COVERAGE_UI] Address updated, checking new ZIP:', event.detail.zip);
        setUserZip(event.detail.zip);
        checkCoverage(event.detail.zip);
      }
    };

    window.addEventListener('addressUpdated', handleAddressUpdate);
    return () => window.removeEventListener('addressUpdated', handleAddressUpdate);
  }, []);

  const loadUserZip = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('zip')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('[SERVICE_AREAS] Profile fetch error:', error);
        // Don't throw - handle gracefully
        setLoading(false);
        return;
      }
      
      const zip = data?.zip || '';
      setUserZip(zip);
      if (zip) {
        await checkCoverage(zip);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('[SERVICE_AREAS] Error loading ZIP:', err);
      setLoading(false);
    }
  };

  const checkCoverage = async (zip: string) => {
    if (!zip) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    console.log('[COVERAGE_UI] Checking coverage for ZIP:', zip);
    
    try {
      const { data, error } = await supabase.functions.invoke('check-service-coverage', {
        body: { zipCode: zip }
      });

      if (error) {
        console.error('[SERVICE_AREAS] Coverage check error:', error);
        // Set safe fallback data
        setCoverageData({
          zipCode: zip,
          hasCoverage: false,
          isConfigured: false,
          landscaperCount: 0,
          landscapers: [],
          nearbyZipCodes: []
        });
        return;
      }
      
      // Safely extract data with defaults
      const coverageResult: CoverageData = {
        zipCode: zip,
        hasCoverage: data?.hasCoverage === true,
        isConfigured: data?.isConfigured === true,
        landscaperCount: data?.landscaperCount || 0,
        landscapers: Array.isArray(data?.landscapers) ? data.landscapers : [],
        nearbyZipCodes: Array.isArray(data?.nearbyZipCodes) ? data.nearbyZipCodes : [],
        areaInfo: data?.areaInfo
      };
      
      setCoverageData(coverageResult);

      if (coverageResult.hasCoverage) {
        toast({
          title: "Service Available!",
          description: `GreenScape Lux serves your area with ${coverageResult.landscaperCount} professional${coverageResult.landscaperCount !== 1 ? 's' : ''}.`,
          className: "bg-emerald-900/90 border-emerald-500/50 text-white"
        });
        console.log('[COVERAGE_UI] Coverage verified:', coverageResult.landscaperCount, 'landscapers');
        
        // Show AI chip after coverage verification
        setTimeout(() => {
          setShowAIChip(true);
          console.log('[COVERAGE_AI] AI suggestion chip activated');
        }, 800);
      } else if (coverageResult.isConfigured) {
        // Service areas exist but this ZIP is not covered
        toast({
          title: "Expanding Soon",
          description: "We're not in your area yet, but we're growing fast!",
          className: "bg-yellow-900/90 border-yellow-500/50 text-white"
        });
        console.log('[COVERAGE_UI] No coverage in area');
        setShowAIChip(false);
      } else {
        // No service areas configured at all - neutral message
        console.log('[COVERAGE_UI] Service areas not yet configured');
        setShowAIChip(false);
      }

    } catch (err) {
      console.error('[SERVICE_AREAS] Coverage check error:', err);
      // Safe fallback - never crash
      setCoverageData({
        zipCode: zip,
        hasCoverage: false,
        isConfigured: false,
        landscaperCount: 0,
        landscapers: [],
        nearbyZipCodes: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Render content (shared between mobile and desktop)
  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mx-auto mb-4" />
          <p className="text-gray-300 font-medium">Checking coverage...</p>
        </div>
      );
    }

    // No ZIP code set - prompt to add address
    if (!userZip) {
      return (
        <div className="p-5 bg-blue-500/10 border-2 border-blue-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-7 h-7 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xl font-bold text-blue-400 mb-2">Address Required</h4>
              <p className="text-gray-200 leading-relaxed">Please update your service address in your profile to check coverage availability.</p>
            </div>
          </div>
        </div>
      );
    }

    // Coverage data loaded
    if (coverageData) {
      // Service areas not configured - show neutral message
      if (!coverageData.isConfigured) {
        return (
          <div className="space-y-6">
            <div className="p-5 bg-black/40 backdrop-blur rounded-xl border border-emerald-500/30">
              <p className="text-sm text-gray-400 mb-1">Your ZIP Code</p>
              <p className="text-3xl font-bold text-emerald-400">{userZip}</p>
            </div>
            
            <div className="p-5 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-2 border-emerald-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <Settings className="w-7 h-7 text-emerald-400 flex-shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h4 className="text-xl font-bold text-emerald-400 mb-2">Coming Soon!</h4>
                  <p className="text-gray-200 leading-relaxed mb-4">
                    GreenScape Lux is preparing to launch in your area. 
                    Join our waitlist to be among the first to experience premium landscaping services.
                  </p>
                </div>
              </div>
            </div>

            {/* Expansion Waitlist Form */}
            <ExpansionWaitlistForm 
              zipCode={userZip}
              onSuccess={() => {
                toast({
                  title: "Welcome to the Waitlist!",
                  description: "We'll notify you when service becomes available.",
                  className: "bg-emerald-900/90 border-emerald-500/50 text-white"
                });
              }}
            />
          </div>
        );
      }

      // Has coverage
      if (coverageData.hasCoverage) {
        return (
          <div className="space-y-6">
            {/* ZIP Code Display */}
            <div className="p-5 bg-black/40 backdrop-blur rounded-xl border border-emerald-500/30">
              <p className="text-sm text-gray-400 mb-1">Your ZIP Code</p>
              <p className="text-3xl font-bold text-emerald-400">{userZip}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-xs font-semibold text-emerald-300 inline-flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Service Coverage Verified
                </span>
                <Button
                  onClick={() => {
                    console.log('[COVERAGE_AI] Schedule Service CTA clicked');
                    setScheduleModalOpen(true);
                  }}
                  className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white text-xs font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-emerald-500/50 flex items-center gap-1.5"
                >
                  <Calendar className="w-3 h-3" />
                  Schedule Service Now
                </Button>
              </div>
            </div>

            {/* AI Suggestion Chip */}
            <AISuggestionChip 
              landscaperCount={coverageData.landscaperCount}
              landscapers={coverageData.landscapers}
              visible={showAIChip}
            />

            {/* Service Available Card */}
            <div className="p-5 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-xl fade-in-up">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-7 h-7 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xl font-bold text-emerald-400 mb-2">Service Available!</h4>
                  <p className="text-gray-200 mb-4 leading-relaxed">
                    GreenScape Lux currently serves your region with <span className="font-bold text-emerald-300">{coverageData.landscaperCount}</span> professional landscaper{coverageData.landscaperCount !== 1 ? 's' : ''}.
                  </p>
                  
                  {coverageData.landscapers.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Users className="w-5 h-5 text-emerald-400" />
                        <span className="font-semibold">Available Landscapers:</span>
                      </div>
                      {coverageData.landscapers.slice(0, 3).map((landscaper) => (
                        <div key={landscaper.id} className="flex items-center justify-between p-3 bg-black/40 backdrop-blur rounded-lg border border-emerald-500/20">
                          <span className="text-white font-medium truncate">{landscaper.business_name || 'Professional Landscaper'}</span>
                          <span className="text-yellow-400 font-semibold flex-shrink-0 ml-2">★ {landscaper.rating?.toFixed(1) || 'N/A'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Coverage Map */}
            {coverageData.nearbyZipCodes.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-emerald-400 mb-3 uppercase tracking-wide">Coverage Map</h4>
                <ServiceCoverageMap
                  zipCode={userZip}
                  nearbyZipCodes={coverageData.nearbyZipCodes}
                  hasCoverage={coverageData.hasCoverage}
                />
              </div>
            )}
          </div>
        );
      }

      // No coverage but service areas are configured
      return (
        <div className="space-y-6">
          {/* ZIP Code Display */}
          <div className="p-5 bg-black/40 backdrop-blur rounded-xl border border-emerald-500/30">
            <p className="text-sm text-gray-400 mb-1">Your ZIP Code</p>
            <p className="text-3xl font-bold text-emerald-400">{userZip}</p>
            <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-full text-xs font-semibold text-yellow-300">
              <AlertCircle className="w-3 h-3" />
              Out of Range
            </span>
          </div>

          {/* Expanding Soon Card */}
          <div className="p-5 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-7 h-7 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="text-xl font-bold text-yellow-400 mb-2">Expanding Soon</h4>
                <p className="text-gray-200 leading-relaxed mb-4">
                  Service is not yet available in your area, but we're expanding rapidly! 
                  Join our waitlist to be notified when GreenScape Lux arrives in {userZip}.
                </p>
                
                {coverageData.nearbyZipCodes.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-300 mb-3 font-semibold">We currently serve these nearby areas:</p>
                    <div className="flex flex-wrap gap-2">
                      {coverageData.nearbyZipCodes.slice(0, 10).map((area) => (
                        <span key={area.zip_code} className="px-3 py-1.5 bg-black/40 backdrop-blur rounded-lg text-sm text-emerald-300 font-medium border border-emerald-500/20">
                          {area.zip_code}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Expansion Waitlist Form */}
          <ExpansionWaitlistForm 
            zipCode={userZip}
            onSuccess={() => {
              toast({
                title: "Welcome to the Waitlist!",
                description: "We'll notify you when service becomes available.",
                className: "bg-emerald-900/90 border-emerald-500/50 text-white"
              });
            }}
          />
        </div>
      );
    }

    // Fallback - should not reach here but handle gracefully
    return (
      <div className="p-5 bg-gray-500/10 border-2 border-gray-500/30 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-7 h-7 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xl font-bold text-gray-400 mb-2">Coverage Check Unavailable</h4>
            <p className="text-gray-300 leading-relaxed">Unable to check coverage at this time. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  };

  // Footer with close button
  const renderFooter = () => (
    <Button 
      onClick={onClose} 
      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-emerald-500/50"
    >
      Close
    </Button>
  );

  return (
    <>
      <MobileBottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="Service Coverage"
        subtitle="Premium landscaping in your area"
        icon={<MapPin className="w-5 h-5" />}
        footer={renderFooter()}
        height="full"
      >
        {renderContent()}
      </MobileBottomSheet>

      <ScheduleServiceModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
      />
    </>
  );
};
