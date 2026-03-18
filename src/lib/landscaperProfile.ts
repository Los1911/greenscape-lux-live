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
    // CRITICAL: Include all NOT NULL columns (first_name, last_name, email)
    // and use user_id for conflict resolution (has UNIQUE constraint)
    const { data: landscaper, error: landscaperError } = await supabase
      .from('landscapers')
      .upsert({
        user_id: user.id,
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        email: profileData.email || user.email || '',
        phone: profileData.phone || null,
        business_name: `${profileData.first_name} ${profileData.last_name}`.trim() || null,
        approved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'user_id',
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

export async function fetchLandscaperProfile(emailOrUserId?: string) {
  try {
    console.log('🔍 fetchLandscaperProfile: Starting with:', emailOrUserId);
    
    // Get current user if no emailOrUserId provided
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ No authenticated user found:', userError);
      return null;
    }
    
    console.log('👤 User Auth ID:', user.id);
    console.log('📧 User Email:', user.email);
    
    // Query by user_id - use maybeSingle() to prevent PGRST116 errors
    // The landscapers table has email as a column but user_id is the canonical lookup key
    const { data: landscaperByUserId, error: userIdError } = await supabase

      .from('landscapers')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (userIdError) {
      console.error('❌ Error fetching landscaper by user_id:', userIdError);
    }
    
    if (landscaperByUserId) {
      console.log('✅ Landscaper found by user_id:', landscaperByUserId);
      return landscaperByUserId;
    }
    
    // Fallback: user_id lookup returned nothing

    console.warn('⚠️ No landscaper profile found for user_id:', user.id);
    return null;
  } catch (error) {
    console.error('❌ Error fetching landscaper profile:', error);
    return null;
  }
}
