/**
 * Helper utility to generate and test ?sb= query parameters
 */

export function generateSbParam(url: string, anonKey: string): string {
  const payload = `URL ${url}|ANON ${anonKey}`;
  return btoa(payload);
}

export function parseSbParam(sbParam: string): { url: string; anon: string } | null {
  try {
    const decoded = atob(sbParam);
    const urlMatch = decoded.match(/URL\s+(\S+)/i);
    const anonMatch = decoded.match(/ANON\s+(\S+)/i);
    
    if (urlMatch?.[1] && anonMatch?.[1]) {
      return {
        url: urlMatch[1],
        anon: anonMatch[1]
      };
    }
  } catch (error) {
    console.error('Failed to parse sb parameter:', error);
  }
  return null;
}

export function createTestUrl(baseUrl: string, supabaseUrl: string, anonKey: string): string {
  const sbParam = generateSbParam(supabaseUrl, anonKey);
  return `${baseUrl}?sb=${sbParam}`;
}

// Example usage for testing:
export function logTestExample() {
  const exampleUrl = "https://your-project.supabase.co";
  const exampleAnon = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example";
  
  const sbParam = generateSbParam(exampleUrl, exampleAnon);
  const testUrl = `${window.location.origin}?sb=${sbParam}`;
  
  console.log("🧪 Test URL with ?sb= parameter:");
  console.log(testUrl);
  console.log("\n📋 Copy this URL to test dynamic config loading");
  
  return { sbParam, testUrl };
}