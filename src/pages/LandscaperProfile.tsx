import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getRuntimeConfig } from '@/lib/runtimeConfig';
import AppLayout from '@/components/AppLayout';
import AnimatedBackground from '@/components/AnimatedBackground';
import JobCompletionForm from '@/components/JobCompletionForm';
import { ReviewsSection } from '@/components/reviews/ReviewsSection';

export default function LandscaperProfile() {
  const navigate = useNavigate();
  const [landscaperData, setLandscaperData] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);

  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const maxFileSizeMB = 5;

  const handleInsuranceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      alert('Upload must be a PDF, JPG, PNG, or Word document.');
      return;
    }

    if (file.size > maxFileSizeMB * 1024 * 1024) {
      alert('File must be less than 5MB');
      return;
    }

    setInsuranceFile(file);
  };

  const handleLicenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      alert('Upload must be a PDF, JPG, PNG, or Word document.');
      return;
    }

    if (file.size > maxFileSizeMB * 1024 * 1024) {
      alert('File must be less than 5MB');
      return;
    }

    setLicenseFile(file);
  };

  const handleSubmitDocuments = async () => {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (!user) {
      alert("User not logged in");
      return;
    }

    if (!insuranceFile || !licenseFile) {
      alert("Please upload both insurance and license files.");
      return;
    }

    const timestamp = Date.now();
    const insurancePath = `insurance/${user.id}-${timestamp}-${insuranceFile.name}`;
    const licensePath = `license/${user.id}-${timestamp}-${licenseFile.name}`;

    const { error: insuranceError } = await supabase.storage
      .from('landscaper-uploads')
      .upload(insurancePath, insuranceFile, { upsert: true });

    if (insuranceError) {
      alert("Error uploading insurance file.");
      console.error(insuranceError.message);
      return;
    }

    const { error: licenseError } = await supabase.storage
      .from('landscaper-uploads')
      .upload(licensePath, licenseFile, { upsert: true });

    if (licenseError) {
      alert("Error uploading license file.");
      console.error(licenseError.message);
      return;
    }

    const { error: updateError } = await supabase
      .from('landscapers')
      .update({
        insurance_file: insurancePath,
        license_file: licensePath,
        profile_complete: true
      })
      .eq('user_id', user.id);

    if (updateError) {
      alert("Error updating profile.");
      console.error(updateError.message);
    } else {
      alert("Documents uploaded successfully. You can now access the dashboard.");
      navigate('/landscaper-dashboard', { replace: true });
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError) {
        console.error('Error getting user:', userError.message);
        return;
      }

      const { data, error } = await supabase
        .from('landscapers')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      if (!data) {
        console.warn("No landscaper profile found for this user yet.");
        setLandscaperData(null);
        return;
      }

      if (error) {
        console.error('Error fetching landscaper:', error.message);
      } else {
        setLandscaperData(data);
      }

      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('assigned_email', user.email)
        .order('date', { ascending: true });

      if (jobError) {
        console.error('Error fetching jobs:', jobError.message);
      } else {
        setJobs(jobData);
      }
    };

    fetchProfile();
  }, []);

  return (
    <AppLayout>
      <AnimatedBackground />
      <div className="flex flex-col items-center justify-start min-h-screen px-4 pt-24">
        <div className="w-full max-w-3xl bg-black/80 border border-green-500 rounded-lg p-8 shadow-lg">
          <h1 className="text-3xl font-bold text-green-400 mb-6 text-center">Landscaper Profile</h1>
          {landscaperData ? (
            <div className="text-white space-y-4">
              <p><span className="text-green-400">Full Name:</span> {landscaperData.full_name}</p>
              <p><span className="text-green-400">Email:</span> {landscaperData.email}</p>
              <p><span className="text-green-400">Business Name:</span> {landscaperData.business_name}</p>
              <p><span className="text-green-400">Service Area:</span> {landscaperData.service_area}</p>
              <p><span className="text-green-400">Experience:</span> {landscaperData.years_experience} years</p>

              <div>
                <label className="text-green-400">Upload Insurance File</label><br />
                <input type="file" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" onChange={handleInsuranceChange} />
                {insuranceFile && <p className="text-green-400 mt-1">Selected: {insuranceFile.name}</p>}
              </div>

              <div>
                <label className="text-green-400">Upload License File</label><br />
                <input type="file" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" onChange={handleLicenseChange} />
                {licenseFile && <p className="text-green-400 mt-1">Selected: {licenseFile.name}</p>}
              </div>

              <div className="mt-4 text-center">
                <button
                  className="bg-green-500 text-black font-semibold px-4 py-2 rounded hover:bg-green-600 transition"
                  onClick={handleSubmitDocuments}
                >
                  Submit Documents & Complete Profile
                </button>
              </div>

              <p>
                <span className="text-green-400">Insurance:</span>{' '}
                {landscaperData.insurance_file ? (
                  <a
                    href={`${getRuntimeConfig().url}/storage/v1/object/public/landscaper-uploads/${landscaperData.insurance_file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 underline"
                  >
                    View Insurance File 📄
                  </a>
                ) : (
                  '❌ Not uploaded'
                )}
              </p>

              <p>
                <span className="text-green-400">License:</span>{' '}
                {landscaperData.license_file ? (
                  <a
                    href={`${getRuntimeConfig().url}/storage/v1/object/public/landscaper-uploads/${landscaperData.license_file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 underline"
                  >
                    View License File 📄
                  </a>
                ) : (
                  '❌ Not uploaded'
                )}
              </p>
            </div>
          ) : (
            <p className="text-gray-400 text-center">Loading profile...</p>
          )}
        </div>

        {landscaperData && (
          <div className="mt-8 w-full max-w-3xl bg-black/80 border border-green-500 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl text-green-400 font-semibold mb-4 text-center">Upcoming Jobs</h2>
            {jobs.length > 0 ? (
              <ul className="divide-y divide-green-700">
                {jobs.map((job, index) => (
                  <li key={index} className="py-6 text-white">
                    <p><span className="text-green-400">Date:</span> {job.date}</p>
                    <p><span className="text-green-400">Time:</span> {job.time}</p>
                    <p><span className="text-green-400">Address:</span> {job.address}</p>
                    <p><span className="text-green-400">Price:</span> ${job.price}</p>
                    <p><span className="text-green-400">Status:</span> {job.status}</p>

                    <div className="mt-4">
                      <h3 className="text-lg font-semibold mb-2">Upload Job Photos</h3>
                      <JobCompletionForm
                        jobId={job.id}
                        status={job.status}
                        beforeUrl={job.before_photo_url}
                        afterUrl={job.after_photo_url}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-center">No upcoming jobs assigned yet.</p>
            )}
          </div>
        )}

        {/* Reviews Section */}
        {landscaperData && (
          <div className="mt-8 w-full max-w-3xl bg-black/80 border border-green-500 rounded-lg p-6 shadow-lg">
            <ReviewsSection 
              landscaperId={landscaperData.id}
              canRespond={true}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}