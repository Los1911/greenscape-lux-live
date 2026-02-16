import { isUUID } from '../lib/isUUID';
import type { Job } from '@/types/job';

// Legacy type for backward compatibility - use Job from @/types/job instead
export type { Job } from '@/types/job';

export type Doc = {
  id: string;
  landscaper_id: string;
  file_url: string;
  file_type: string;
  uploaded_at: string;
};

export const Jobs = {
  forLandscaper(supabase: any, uid: string, email: string) {
    return supabase
      .from('jobs')
      .select(
        'id, service_name, service_type, service_address, price, preferred_date, status, customer_name, created_at, updated_at'
      )
      .or(`landscaper_id.eq.${uid},assigned_email.eq.${email}`)
      .order('preferred_date', { ascending: true });
  },

  start(supabase: any, id: string) {
    if (!isUUID(id)) {
      throw new Error('Invalid job id');
    }

    return supabase.functions.invoke('job-execution', {
      body: JSON.stringify({
        action: 'start',
        jobId: id
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  },

  complete(supabase: any, id: string) {
    if (!isUUID(id)) {
      throw new Error('Invalid job id');
    }

    return supabase.functions.invoke('job-execution', {
      body: JSON.stringify({
        action: 'complete',
        jobId: id
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

export const Docs = {
  list(supabase: any, uid: string) {
    return supabase
      .from('v_landscaper_documents')
      .select('id,file_url,file_type,uploaded_at')
      .eq('landscaper_id', uid)
      .order('uploaded_at', { ascending: false });
  }
};
