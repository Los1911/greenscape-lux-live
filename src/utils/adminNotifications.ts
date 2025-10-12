export type AdminEvent = 'landscaper_signup' | 'client_quote';

// Safe environment variable access
const getAdminEmail = () => {
  try {
    return globalThis.import?.meta?.env?.VITE_ADMIN_EMAIL || 'admin.1@greenscapelux.com';
  } catch (error) {
    return 'admin.1@greenscapelux.com';
  }
};

const ADMIN_EMAIL = getAdminEmail();

export async function notifyAdmin(type: AdminEvent, data: Record<string, any>) {
  try {
    // Validate environment variables
    if (!ADMIN_EMAIL) {
      console.error('❌ VITE_ADMIN_EMAIL environment variable is missing');
      return;
    }

    // Use the supabase client to call the unified-email edge function
    const { supabase } = await import('@/lib/supabase');
    
    // Map event types to email templates
    const templateMap: Record<AdminEvent, string> = {
      'landscaper_signup': 'landscaper_welcome',
      'client_quote': 'quote_confirmation'
    };

    const templateType = templateMap[type];
    
    const { data: result, error } = await supabase.functions.invoke('unified-email', {
      body: {
        template_type: templateType,
        to: ADMIN_EMAIL,
        template_data: {
          ...data,
          timestamp: new Date().toISOString(),
        },
      },
    });

    if (error) {
      console.error('❌ Admin notification failed:', error);
      return;
    }

    if (result?.success) {
      console.log('✅ Admin email sent successfully:', type);
    } else {
      console.warn('⚠️ Admin email may have failed:', result);
    }
  } catch (err) {
    console.error('❌ notifyAdmin error:', type, err);
  }
}
