import { supabase } from './supabase';

export interface LandscaperProfileData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  approved?: boolean;
  insurance_file?: string | null;
  license_file?: string | null;
}

export async function ensureLandscaperProfile(profileData: LandscaperProfileData) {
  try {
    console.log('🌿 Creating landscaper profile:', profileData);
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('No authenticated user found');
    }

    console.log('✅ User authenticated:', user.id);

    // 1. First ensure public.users record exists
    const { error: userUpsertError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: profileData.email,
        role: 'landscaper',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });

    if (userUpsertError) {
      console.error('❌ Error creating users record:', userUpsertError);
      throw userUpsertError;
    }

    console.log('✅ Users record created/updated');

    // 2. Create landscaper profile
    const { data: landscaper, error: landscaperError } = await supabase
      .from('landscapers')
      .upsert({
        id: user.id,
        email: profileData.email,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        phone: profileData.phone || null,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (landscaperError) {
      console.error('❌ Error creating landscaper profile:', landscaperError);
      throw landscaperError;
    }

    console.log('✅ Landscaper profile created:', landscaper);
    return landscaper;

  } catch (error) {
    console.error('❌ ensureLandscaperProfile failed:', error);
    throw error;
  }
}

export async function fetchLandscaperProfile(emailOrUserId: string) {
  try {
    // Try by ID first (UUID format)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(emailOrUserId);
    
    const { data, error } = await supabase
      .from('landscapers')
      .select('*')
      .eq(isUUID ? 'id' : 'email', emailOrUserId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching landscaper profile:', error);
    throw error;
  }
}