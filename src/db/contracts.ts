import { isUUID } from '../lib/isUUID';
import type { Job } from '@/types/job';

// Legacy type for backward compatibility
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

  // START JOB → move to in_progress
  start(supabase: any, id: string) {
    if (!isUUID(id)) {
      throw new Error('Invalid job id');
    }

    return supabase
      .from('jobs')
      .update({ status: 'in_progress' })
      .eq('id', id);
  },

  // COMPLETE JOB → move to completed_pending_review
  complete(supabase: any, id: string) {
    if (!isUUID(id)) {
      throw new Error('Invalid job id');
    }

    return supabase
      .from('jobs')
      .update({ status: 'completed_pending_review' })
      .eq('id', id);
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
