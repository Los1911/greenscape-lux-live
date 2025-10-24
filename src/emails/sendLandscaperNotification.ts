import { supabase } from '@/lib/supabase';

interface JobDetails {
  clientName: string;
  serviceType: string;
  date: string;
  address: string;
  jobId?: string;
}

interface NotificationParams {
  landscaperEmail: string;
  landscaperName: string;
  jobDetails: JobDetails;
  type: 'new_job' | 'quote_request';
}

export async function sendLandscaperNotification({
  landscaperEmail,
  landscaperName,
  jobDetails,
  type
}: NotificationParams) {
  try {
    // Call the landscaper-notify edge function instead of using Resend directly
    const { data, error } = await supabase.functions.invoke('landscaper-notify', {
      body: {
        to: landscaperEmail,
        type: type === 'new_job' ? 'new_job' : 'quote_request',
        data: {
          landscaper_name: landscaperName,
          client_name: jobDetails.clientName,
          service_type: jobDetails.serviceType,
          date: jobDetails.date,
          address: jobDetails.address,
          job_id: jobDetails.jobId,
          view_job_url: `${window.location.origin}/landscaper-dashboard`
        }
      }
    });

    if (error) {
      console.error('[EMAIL ERROR] Failed to send landscaper notification:', error);
      return { success: false, error };
    }

    console.log('[EMAIL SUCCESS] Landscaper notification sent:', data);
    return { success: true, data };

  } catch (error) {
    console.error('[EMAIL ERROR] Exception sending landscaper notification:', error);
    return { success: false, error };
  }
}