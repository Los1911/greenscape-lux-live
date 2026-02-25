/**
 * Message Sanitizer Utility
 * Blocks and masks phone numbers, emails, and external contact attempts
 * to keep all communication within GreenScape Lux platform
 */

// Phone number patterns (various formats)
const PHONE_PATTERNS = [
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,  // 123-456-7890, 123.456.7890, 123 456 7890
  /\b\(\d{3}\)\s*\d{3}[-.\s]?\d{4}\b/g,   // (123) 456-7890
  /\b\d{10,11}\b/g,                        // 1234567890, 11234567890
  /\+\d{1,3}[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g, // +1-123-456-7890
  /\bcall\s+me\s+at\s+\d+/gi,             // "call me at 123..."
  /\btext\s+me\s+at\s+\d+/gi,             // "text me at 123..."
  /\bmy\s+number\s+is\s+\d+/gi,           // "my number is 123..."
  /\bphone[:\s]+\d+/gi,                   // "phone: 123..."
  /\bcell[:\s]+\d+/gi,                    // "cell: 123..."
];

// Email patterns
const EMAIL_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,  // standard email
  /\b[A-Za-z0-9._%+-]+\s*@\s*[A-Za-z0-9.-]+\s*\.\s*[A-Z|a-z]{2,}\b/g, // spaced email
  /\bemail\s+me\s+at/gi,                  // "email me at"
  /\bmy\s+email\s+is/gi,                  // "my email is"
  /\bcontact\s+me\s+at/gi,                // "contact me at"
];

// External contact attempt patterns
const EXTERNAL_CONTACT_PATTERNS = [
  /\bwhatsapp/gi,
  /\bfacebook/gi,
  /\binstagram/gi,
  /\bsnapchat/gi,
  /\btelegram/gi,
  /\bsignal\s+app/gi,
  /\bvenmo/gi,
  /\bcashapp/gi,
  /\bzelle/gi,
  /\bpaypal/gi,
  /\bmeet\s+outside/gi,
  /\boff\s+platform/gi,
  /\bdirect\s+contact/gi,
  /\bprivate\s+message/gi,
  /\bDM\s+me/gi,
];

export interface SanitizationResult {
  sanitizedText: string;
  containsBlockedContent: boolean;
  blockedTypes: ('phone' | 'email' | 'external')[];
  warningMessage: string | null;
}

/**
 * Sanitizes a message by blocking/masking contact information
 */
export function sanitizeMessage(text: string): SanitizationResult {
  let sanitizedText = text;
  const blockedTypes: ('phone' | 'email' | 'external')[] = [];
  
  // Check and mask phone numbers
  for (const pattern of PHONE_PATTERNS) {
    if (pattern.test(sanitizedText)) {
      blockedTypes.push('phone');
      sanitizedText = sanitizedText.replace(pattern, '[phone number removed]');
    }
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
  }
  
  // Check and mask emails
  for (const pattern of EMAIL_PATTERNS) {
    if (pattern.test(sanitizedText)) {
      blockedTypes.push('email');
      sanitizedText = sanitizedText.replace(pattern, '[email removed]');
    }
    pattern.lastIndex = 0;
  }
  
  // Check for external contact attempts
  for (const pattern of EXTERNAL_CONTACT_PATTERNS) {
    if (pattern.test(sanitizedText)) {
      blockedTypes.push('external');
      sanitizedText = sanitizedText.replace(pattern, '[external contact removed]');
    }
    pattern.lastIndex = 0;
  }
  
  // Remove duplicates from blockedTypes
  const uniqueBlockedTypes = [...new Set(blockedTypes)] as ('phone' | 'email' | 'external')[];
  
  const containsBlockedContent = uniqueBlockedTypes.length > 0;
  
  let warningMessage: string | null = null;
  if (containsBlockedContent) {
    warningMessage = "For your safety, communication must stay within GreenScape Lux. Contact information has been removed.";
  }
  
  return {
    sanitizedText,
    containsBlockedContent,
    blockedTypes: uniqueBlockedTypes,
    warningMessage,
  };
}

/**
 * Checks if a message contains blocked content without modifying it
 */
export function containsBlockedContent(text: string): boolean {
  const allPatterns = [...PHONE_PATTERNS, ...EMAIL_PATTERNS, ...EXTERNAL_CONTACT_PATTERNS];
  
  for (const pattern of allPatterns) {
    if (pattern.test(text)) {
      pattern.lastIndex = 0;
      return true;
    }
    pattern.lastIndex = 0;
  }
  
  return false;
}

/**
 * Gets a user-friendly warning message based on blocked content types
 */
export function getBlockedContentWarning(blockedTypes: ('phone' | 'email' | 'external')[]): string {
  if (blockedTypes.length === 0) return '';
  
  const warnings: string[] = [];
  
  if (blockedTypes.includes('phone')) {
    warnings.push('phone numbers');
  }
  if (blockedTypes.includes('email')) {
    warnings.push('email addresses');
  }
  if (blockedTypes.includes('external')) {
    warnings.push('external contact methods');
  }
  
  return `For your safety, ${warnings.join(', ')} are not allowed. All communication must stay within GreenScape Lux.`;
}

/**
 * Maximum message length for structured messages
 */
export const MAX_MESSAGE_LENGTH = 500;

/**
 * Validates message length
 */
export function validateMessageLength(text: string): { valid: boolean; message: string | null } {
  if (text.length > MAX_MESSAGE_LENGTH) {
    return {
      valid: false,
      message: `Message is too long. Maximum ${MAX_MESSAGE_LENGTH} characters allowed.`,
    };
  }
  return { valid: true, message: null };
}
