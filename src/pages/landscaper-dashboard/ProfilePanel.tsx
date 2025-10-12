import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@/lib/ConfigContext';
import { useNavigate } from 'react-router-dom';
import { signOutAndRedirect } from '@/lib/logout';
import { ConnectAccountStatus } from '@/components/landscaper/ConnectAccountStatus';

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl ring-1 ring-emerald-500/20 shadow-[0_0_25px_-10px_rgba(52,211,153,0.25)] p-4 sm:p-6 lg:p-8">
      {children}
    </section>
  );
}

export default function ProfilePanel() {
  const supabase = useSupabaseClient();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [landscaperId, setLandscaperId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          const { data: profileData } = await supabase
            .from('landscapers')
            .select('id, first_name, last_name, phone')
            .eq('user_id', user.id)
            .single();

          if (profileData) {
            setProfile(profileData);
            setLandscaperId(profileData.id);
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [supabase]);

  if (loading) return <div className="text-white px-4 py-6">Loading...</div>;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <Panel>
        <h2 className="text-xl font-bold text-emerald-300 mb-4">Profile</h2>
        <p className="text-emerald-200">{profile?.first_name} {profile?.last_name}</p>
      </Panel>

      {landscaperId && <ConnectAccountStatus landscaperId={landscaperId} />}

      <Panel>
        <button onClick={() => signOutAndRedirect(supabase, '/')} className="px-6 py-3 bg-red-500/20 text-red-200 border border-red-500/50 rounded-xl">
          Sign Out
        </button>
      </Panel>
    </div>
  );
}
