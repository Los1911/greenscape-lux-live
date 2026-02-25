import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getRuntimeConfig } from '@/lib/runtimeConfig';
import AppLayout from '@/components/AppLayout';
import AnimatedBackground from '@/components/AnimatedBackground';
import JobCompletionForm from '@/components/JobCompletionForm';
import { ReviewsSection } from '@/components/reviews/ReviewsSection';
import { BadgesSection } from '@/components/landscaper/BadgesSection';
import { TierBadge } from '@/components/landscaper/TierBadge';
import { LandscaperTier } from '@/types/job';

export default function LandscaperProfile() {
  const navigate = useNavigate();
  const [landscaperData, setLandscaperData] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);

  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const maxFileSizeMB = 5;

  const handleInsuranceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!allowedTypes.includes(file.type)) { alert('Upload must be a PDF, JPG, PNG, or Word document.'); return; }
    if (file.size > maxFileSizeMB * 1024 * 1024) { alert('File must be less than 5MB'); return; }
    setInsuranceFile(file);
  };

  const handleLicenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!allowedTypes.includes(file.type)) { alert('Upload must be a PDF, JPG, PNG, or Word document.'); return; }
    if (file.size > maxFileSizeMB * 1024 * 1024) { alert('File must be less than 5MB'); return; }
    setLicenseFile(file);
  };

  const handleSubmitDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { alert("User not logged in"); return; }
      if (!insuranceFile || !licenseFile) { alert("Please upload both insurance and license files."); return; }

      const timestamp = Date.now();
      const insurancePath = `insurance/${user.id}-${timestamp}-${insuranceFile.name}`;
      const licensePath = `license/${user.id}-${timestamp}-${licenseFile.name}`;

      const { error: insuranceError } = await supabase.storage.from('landscaper-uploads').upload(insurancePath, insuranceFile, { upsert: true });
      if (insuranceError) { alert("Error uploading insurance file."); console.error('[LANDSCAPER PROFILE]', insuranceError); return; }

      const { error: licenseError } = await supabase.storage.from('landscaper-uploads').upload(licensePath, licenseFile, { upsert: true });
      if (licenseError) { alert("Error uploading license file."); console.error('[LANDSCAPER PROFILE]', licenseError); return; }

      const { error: updateError } = await supabase.from('landscapers').update({ insurance_file: insurancePath, license_file: licensePath, profile_complete: true }).eq('user_id', user.id);
      if (updateError) { alert("Error updating profile."); console.error('[LANDSCAPER PROFILE]', updateError); }
      else { alert("Documents uploaded successfully."); navigate('/landscaper-dashboard', { replace: true }); }
    } catch (error) {
      console.error('[LANDSCAPER PROFILE]', error);
      alert("An error occurred while uploading documents.");
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      console.log('[LANDSCAPER PROFILE] Starting data load...');
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) { console.error('[LANDSCAPER PROFILE] User error:', userError); setLoadError('Data could not be loaded in this preview, but you are still signed in.'); setLoading(false); return; }
        if (!user?.id) { console.log('[LANDSCAPER PROFILE] No user id found'); setLoading(false); return; }

        console.log('[LANDSCAPER PROFILE] Fetching landscaper data for user_id:', user.id);
        
        // Query landscapers by user_id (correct column)
        // NOTE: license_number column does not exist in the database - do not include it
        const { data, error } = await supabase
          .from('landscapers')
          .select('id, user_id, business_name, insurance_verified, service_radius, hourly_rate, rating, total_reviews, approved, stripe_connect_id, created_at, updated_at, tier, completed_jobs_count, average_rating')
          .eq('user_id', user.id)
          .maybeSingle();

          
        if (error) { console.error('[LANDSCAPER PROFILE]', error); setLoadError('Data could not be loaded in this preview, but you are still signed in.'); setLoading(false); return; }
        
        // Also fetch profile data for name/email
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name, email, phone')
          .eq('user_id', user.id)
          .maybeSingle();
        
        // Combine landscaper and profile data
        const combinedData = data ? {
          ...data,
          full_name: profileData ? `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() : '',
          email: profileData?.email || user.email || '',
          phone: profileData?.phone || ''
        } : null;

        
        console.log('[LANDSCAPER PROFILE] Landscaper data:', combinedData ? 'found' : 'null');
        setLandscaperData(combinedData);

        if (data) {
          // Fetch jobs by landscaper_id or user_id instead of email
          const { data: jobData, error: jobError } = await supabase
            .from('jobs')
            .select('*')
            .or(`landscaper_id.eq.${data.id},assigned_to.eq.${user.id}`)
            .order('created_at', { ascending: false });
          if (jobError) { console.error('[LANDSCAPER PROFILE] Jobs error:', jobError); }
          else { setJobs(jobData || []); }
        }
      } catch (error) {
        console.error('[LANDSCAPER PROFILE]', error);
        setLoadError('Data could not be loaded in this preview, but you are still signed in.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);


  if (loadError) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="max-w-md text-center space-y-4">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-green-400">Profile Unavailable</h2>
            <p className="text-green-200/70">{loadError}</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-green-500/20 text-green-200 border border-green-500/50 rounded-xl hover:bg-green-500/30">Refresh</button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </AppLayout>
    );
  }

  if (!landscaperData) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="max-w-md text-center space-y-4">
            <div className="text-6xl mb-4">👤</div>
            <h2 className="text-xl font-bold text-green-400">No Landscaper Profile</h2>
            <p className="text-green-200/70">No landscaper profile is linked to this account yet.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <AnimatedBackground />
      <div className="flex flex-col items-center justify-start min-h-screen px-4 pt-24">
        <div className="w-full max-w-3xl bg-black/80 border border-green-500 rounded-lg p-8 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-green-400">Landscaper Profile</h1>
            {landscaperData?.tier && (
              <TierBadge tier={landscaperData.tier as LandscaperTier} size="lg" />
            )}
          </div>
          <div className="text-white space-y-4">
            <p><span className="text-green-400">Full Name:</span> {landscaperData?.full_name || 'N/A'}</p>
            <p><span className="text-green-400">Email:</span> {landscaperData?.email || 'N/A'}</p>
            <p><span className="text-green-400">Business Name:</span> {landscaperData?.business_name || 'N/A'}</p>
            <p><span className="text-green-400">Service Area:</span> {landscaperData?.service_area || 'N/A'}</p>
            <p><span className="text-green-400">Experience:</span> {landscaperData?.years_experience || 0} years</p>
            <p><span className="text-green-400">Completed Jobs:</span> {landscaperData?.completed_jobs_count || 0}</p>
            <p><span className="text-green-400">Average Rating:</span> {(landscaperData?.average_rating || 0).toFixed(1)} / 5.0</p>
            <div><label className="text-green-400">Upload Insurance File</label><br /><input type="file" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" onChange={handleInsuranceChange} />{insuranceFile && <p className="text-green-400 mt-1">Selected: {insuranceFile.name}</p>}</div>
            <div><label className="text-green-400">Upload License File</label><br /><input type="file" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" onChange={handleLicenseChange} />{licenseFile && <p className="text-green-400 mt-1">Selected: {licenseFile.name}</p>}</div>
            <div className="mt-4 text-center"><button className="bg-green-500 text-black font-semibold px-4 py-2 rounded hover:bg-green-600 transition" onClick={handleSubmitDocuments}>Submit Documents & Complete Profile</button></div>
            <p><span className="text-green-400">Insurance:</span> {landscaperData?.insurance_file ? <a href={`${getRuntimeConfig().url}/storage/v1/object/public/landscaper-uploads/${landscaperData.insurance_file}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">View Insurance File</a> : 'Not uploaded'}</p>
            <p><span className="text-green-400">License:</span> {landscaperData?.license_file ? <a href={`${getRuntimeConfig().url}/storage/v1/object/public/landscaper-uploads/${landscaperData.license_file}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">View License File</a> : 'Not uploaded'}</p>
          </div>
        </div>

        {/* Badges & Achievements Section */}
        {landscaperData?.id && (
          <div className="mt-8 w-full max-w-3xl bg-black/80 border border-green-500 rounded-lg p-6 shadow-lg">
            <BadgesSection landscaperId={landscaperData.id} />
          </div>
        )}

        <div className="mt-8 w-full max-w-3xl bg-black/80 border border-green-500 rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl text-green-400 font-semibold mb-4 text-center">Upcoming Jobs</h2>
          {(jobs || []).length > 0 ? (
            <ul className="divide-y divide-green-700">
              {jobs.map((job, index) => (
                <li key={job?.id || index} className="py-6 text-white">
                  <p><span className="text-green-400">Date:</span> {job?.date || 'TBA'}</p>
                  <p><span className="text-green-400">Time:</span> {job?.time || 'TBA'}</p>
                  <p><span className="text-green-400">Address:</span> {job?.address || 'TBA'}</p>
                  <p><span className="text-green-400">Price:</span> ${job?.price || 0}</p>
                  <p><span className="text-green-400">Status:</span> {job?.status || 'pending'}</p>
                  <div className="mt-4"><h3 className="text-lg font-semibold mb-2">Upload Job Photos</h3><JobCompletionForm jobId={job?.id} status={job?.status} beforeUrl={job?.before_photo_url} afterUrl={job?.after_photo_url} /></div>
                </li>
              ))}
            </ul>
          ) : (<p className="text-gray-400 text-center">No upcoming jobs assigned yet.</p>)}
        </div>
        <div className="mt-8 w-full max-w-3xl bg-black/80 border border-green-500 rounded-lg p-6 shadow-lg">
          <ReviewsSection landscaperId={landscaperData?.id} canRespond={true} />
        </div>
      </div>
    </AppLayout>
  );
}
