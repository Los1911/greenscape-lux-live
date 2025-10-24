// Input sanitization utilities for security hardening

export class InputSanitizer {
  // Email validation and sanitization
  static sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') return '';
    
    return email
      .trim()
      .toLowerCase()
      .replace(/[<>'"]/g, ''); // Remove potential XSS characters
  }

  // Phone number sanitization
  static sanitizePhone(phone: string): string {
    if (!phone || typeof phone !== 'string') return '';
    
    return phone
      .replace(/[^\d\-\+\(\)\s]/g, '') // Only allow digits, dashes, plus, parentheses, spaces
      .trim();
  }

  // Name sanitization (allows letters, spaces, hyphens, apostrophes)
  static sanitizeName(name: string): string {
    if (!name || typeof name !== 'string') return '';
    
    return name
      .replace(/[<>'"&]/g, '') // Remove XSS characters
      .replace(/[^\w\s\-']/g, '') // Only allow word chars, spaces, hyphens, apostrophes
      .trim()
      .slice(0, 100); // Limit length
  }

  // Address sanitization
  static sanitizeAddress(address: string): string {
    if (!address || typeof address !== 'string') return '';
    
    return address
      .replace(/[<>'"]/g, '') // Remove XSS characters
      .trim()
      .slice(0, 200); // Limit length
  }

  // General text sanitization for descriptions, messages
  static sanitizeText(text: string, maxLength: number = 1000): string {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .replace(/[<>]/g, '') // Remove angle brackets to prevent HTML injection
      .trim()
      .slice(0, maxLength);
  }

  // URL validation and sanitization
  static sanitizeUrl(url: string): string {
    if (!url || typeof url !== 'string') return '';
    
    try {
      const parsed = new URL(url);
      // Only allow http and https protocols
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return '';
      }
      return parsed.toString();
    } catch {
      return '';
    }
  }

  // Validate and sanitize form data
  static sanitizeFormData(data: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        switch (key) {
          case 'email':
            sanitized[key] = this.sanitizeEmail(value);
            break;
          case 'phone':
            sanitized[key] = this.sanitizePhone(value);
            break;
          case 'firstName':
          case 'lastName':
          case 'name':
            sanitized[key] = this.sanitizeName(value);
            break;
          case 'address':
          case 'street':
          case 'city':
          case 'state':
            sanitized[key] = this.sanitizeAddress(value);
            break;
          case 'website':
          case 'url':
            sanitized[key] = this.sanitizeUrl(value);
            break;
          default:
            sanitized[key] = this.sanitizeText(value);
        }
      } else {
        // Keep non-string values as-is (numbers, booleans, etc.)
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  // Rate limiting helper
  static createRateLimiter(maxAttempts: number, windowMs: number) {
    const attempts = new Map<string, { count: number; resetTime: number }>();
    
    return {
      isLimited: (identifier: string): boolean => {
        const now = Date.now();
        const record = attempts.get(identifier);
        
        if (!record || now > record.resetTime) {
          attempts.set(identifier, { count: 1, resetTime: now + windowMs });
          return false;
        }
        
        if (record.count >= maxAttempts) {
          return true;
        }
        
        record.count++;
        return false;
      },
      
      reset: (identifier: string): void => {
        attempts.delete(identifier);
      }
    };
  }
}