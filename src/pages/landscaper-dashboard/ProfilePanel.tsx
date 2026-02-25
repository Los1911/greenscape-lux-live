import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@/lib/ConfigContext';
import { useAuth } from '@/contexts/AuthContext';
import { ConnectAccountStatus } from '@/components/landscaper/ConnectAccountStatus';
import { ProfileCompletionWizard } from '@/components/landscaper/ProfileCompletionWizard';
import { WorkAreaPreferences } from '@/components/landscaper/WorkAreaPreferences';
import { TemplateManager } from '@/components/messaging/TemplateManager';
import { useMessageTemplates } from '@/hooks/useMessageTemplates';
import { RefreshCw, MessageSquare, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl ring-1 ring-emerald-500/20 shadow-[0_0_25px_-10px_rgba(52,211,153,0.25)] p-4 sm:p-6 lg:p-8">
      {children}
    </section>
  );
}

export default function ProfilePanel() {
  const supabase = useSupabaseClient();
  const { user: authUser, loading: authLoading } = useAuth();
  
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [landscaperId, setLandscaperId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState<string>('');
  const [stripeConnected, setStripeConnected] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);

  // Message templates hook
  const {
    templates,
    customTemplates,
    systemTemplates,
    canAddMore,
    customTemplateCount,
    createTemplate,
    updateTemplate,
    deleteTemplate
  } = useMessageTemplates();

  useEffect(() => {
    // Wait for auth to be ready before loading profile
    if (authLoading) return;
    
    const loadProfile = async () => {
      setLoadError(null);
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user?.id) {
          setLoadError('Unable to load profile. Please refresh.');
          setLoading(false);
          return;
        }
        setUserId(user.id);
        
        const { data: profileData, error } = await supabase
          .from('landscapers')
          .select('id, first_name, last_name, phone, stripe_connect_id, stripe_charges_enabled, stripe_payouts_enabled')
          .eq('user_id', user.id);

        if (error) {
          setLoadError('Unable to load profile. Please refresh.');
          setLoading(false);
          return;
        }

        if (!profileData || profileData.length === 0) {
          setShowWizard(true);
          setLoading(false);
          return;
        }

        const loadedProfile = profileData[0];
        setProfile(loadedProfile);
        setLandscaperId(loadedProfile?.id ?? '');
        setStripeConnected(!!loadedProfile?.stripe_connect_id && loadedProfile?.stripe_charges_enabled && loadedProfile?.stripe_payouts_enabled);
      } catch (error) {
        setLoadError('Unable to load profile. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [supabase, authLoading]);

  const handleStripeConnect = async () => {
    setStripeLoading(true);
    setStripeError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setStripeError('Please refresh.'); return; }
      const { data, error } = await supabase.functions.invoke('create-connect-account-link', {
        body: { userId: user.id, email: user.email ?? '', businessName: `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || 'Landscaper' }
      });
      if (error) { setStripeError('Failed to start Stripe onboarding.'); return; }
      if (data?.onboardingUrl) { window.location.href = data.onboardingUrl; }
    } catch { setStripeError('Failed to start Stripe onboarding.'); }
    finally { setStripeLoading(false); }
  };



  // Auth loading guard - show spinner while auth is resolving
  if (authLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <Panel>
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <h2 className="text-xl font-bold text-amber-300">Profile Unavailable</h2>
            <p className="text-emerald-300/60 text-center">{loadError}</p>
            <button onClick={() => window.location.reload()} className="px-6 py-3 bg-emerald-500/20 text-emerald-200 border border-emerald-500/50 rounded-xl">Refresh</button>
          </div>
        </Panel>
      </div>
    );
  }

  if (showWizard && userId) {
    return <div className="px-4 sm:px-6 lg:px-8 py-6"><ProfileCompletionWizard userId={userId} onComplete={() => window.location.reload()} /></div>;
  }

  if (!profile) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <Panel>
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <h2 className="text-xl font-bold text-emerald-300">Professional Setup</h2>
            <p className="text-emerald-300/60 text-center text-sm">Set up your business details to start accepting jobs</p>
            <button onClick={() => setShowWizard(true)} className="px-6 py-3 bg-emerald-500/20 text-emerald-200 border border-emerald-500/50 rounded-xl">Start Setup</button>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Profile Info */}
      <Panel>
        <h2 className="text-xl font-bold text-emerald-300 mb-4">Profile</h2>
        <p className="text-emerald-200">{profile?.first_name ?? ''} {profile?.last_name ?? ''}</p>
        {profile?.phone && <p className="text-emerald-300/60 text-sm mt-1">{profile.phone}</p>}
      </Panel>

      {/* Stripe Connect Status */}
      {landscaperId && <ConnectAccountStatus landscaperId={landscaperId} />}
      
      {/* Stripe Connection Button */}
      <Panel>
        {stripeConnected ? (
          <div className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500/20 text-emerald-200 border border-emerald-500/50 rounded-xl">
            <span>Stripe Account Verified</span>
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
        ) : (
          <div className="space-y-2">
            <button onClick={handleStripeConnect} disabled={stripeLoading} className="w-full px-6 py-3 bg-emerald-500/10 text-emerald-200 border border-emerald-500/50 rounded-xl disabled:opacity-50">
              {stripeLoading ? 'Connecting...' : 'Connect with Stripe'}
            </button>
            {stripeError && <p className="text-sm text-red-400 text-center">{stripeError}</p>}
          </div>
        )}
      </Panel>

      {/* Quick Reply Templates */}
      <Panel>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-emerald-300">Quick Reply Templates</h2>
          </div>
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-300">
            {customTemplateCount} custom
          </Badge>
        </div>
        
        <p className="text-emerald-200/70 text-sm mb-4">
          Create and manage quick reply templates for faster messaging with clients. 
          Templates help you respond quickly and consistently.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => setShowTemplateManager(true)}
            variant="outline"
            className="border-emerald-500/30 text-emerald-200 hover:bg-emerald-900/30 flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Manage Templates
          </Button>
          
          <div className="flex items-center gap-2 text-xs text-emerald-300/60">
            <span>{templates.length} total templates</span>
            <span>•</span>
            <span>{systemTemplates.length} suggested</span>
          </div>
        </div>

        {/* Preview of templates */}
        {customTemplates.length > 0 && (
          <div className="mt-4 pt-4 border-t border-emerald-500/20">
            <p className="text-xs text-emerald-300/60 mb-2">Your custom templates:</p>
            <div className="flex flex-wrap gap-2">
              {customTemplates.slice(0, 5).map((template) => (
                <Badge 
                  key={template.id} 
                  variant="outline" 
                  className="border-emerald-500/20 text-emerald-200/80 text-xs"
                >
                  {template.name}
                </Badge>
              ))}
              {customTemplates.length > 5 && (
                <Badge 
                  variant="outline" 
                  className="border-slate-600 text-slate-400 text-xs"
                >
                  +{customTemplates.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </Panel>

      {/* Work Area Preferences */}
      {landscaperId && (
        <Panel>
          <WorkAreaPreferences landscaperId={landscaperId} />
        </Panel>
      )}

      {/* Template Manager Modal */}
      <TemplateManager
        isOpen={showTemplateManager}
        onClose={() => setShowTemplateManager(false)}
        templates={templates}
        customTemplates={customTemplates}
        systemTemplates={systemTemplates}
        canAddMore={canAddMore}
        customTemplateCount={customTemplateCount}
        onCreateTemplate={createTemplate}
        onUpdateTemplate={updateTemplate}
        onDeleteTemplate={deleteTemplate}
      />
    </div>
  );
}
