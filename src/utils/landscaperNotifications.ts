export type LandscaperEvent = 'signup' | 'new_job' | 'client_quote';

const FN = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;

export async function notifyLandscaper(
  type: LandscaperEvent,
  email: string | null | undefined,
  data: Record<string, any> = {}
) {
  try {
    if (!email) return; // silently no-op when we don't have a target landscaper
    if (!FN) throw new Error('Functions URL missing (VITE_SUPABASE_FUNCTIONS_URL)');

    // Generalized function for landscaper messages
    const res = await fetch(`${FN}/landscaper-notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        type,
        data,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      console.warn(`landscaper-notify failed: ${res.status} ${res.statusText}`);
      return;
    }
    console.log('✅ Landscaper email sent:', type, email);
  } catch (err) {
    console.warn('❌ notifyLandscaper failed:', type, email, err);
  }
}