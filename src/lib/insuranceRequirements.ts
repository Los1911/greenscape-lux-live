/**
 * Insurance Requirements Configuration
 * 
 * Defines which services require verified landscaper insurance
 * for liability protection and premium service positioning.
 */

// High-risk services that require verified insurance
export const INSURANCE_REQUIRED_SERVICES = [
  'Tree Removal',
  'Tree Trimming & Pruning',
  'Stump Grinding',
  'Land Clearing',
  'Property Flip Cleanups (Real Estate Ready)',
  'HOA or Multi-Property Contracts',
] as const;

// Category name for these services
export const INSURANCE_REQUIRED_CATEGORY = 'Tree & Property Care';

// Type for insurance-required services
export type InsuranceRequiredService = typeof INSURANCE_REQUIRED_SERVICES[number];

/**
 * Check if a single service requires insurance
 */
export function serviceRequiresInsurance(serviceName: string): boolean {
  if (!serviceName) return false;
  
  const normalizedService = serviceName.trim().toLowerCase();
  return INSURANCE_REQUIRED_SERVICES.some(
    service => service.toLowerCase() === normalizedService
  );
}

/**
 * Check if a job requires insurance based on its service_type or selected_services
 */
export function jobRequiresInsurance(job: {
  service_type?: string | null;
  service_name?: string | null;
  selected_services?: string[] | null;
}): boolean {
  // Check service_type
  if (job.service_type && serviceRequiresInsurance(job.service_type)) {
    return true;
  }
  
  // Check service_name (fallback)
  if (job.service_name && serviceRequiresInsurance(job.service_name)) {
    return true;
  }
  
  // Check selected_services array
  if (job.selected_services && Array.isArray(job.selected_services)) {
    return job.selected_services.some(service => serviceRequiresInsurance(service));
  }
  
  return false;
}

/**
 * Get all insurance-required services from a job's selected services
 */
export function getInsuranceRequiredServicesFromJob(job: {
  service_type?: string | null;
  service_name?: string | null;
  selected_services?: string[] | null;
}): string[] {
  const requiredServices: string[] = [];
  
  if (job.service_type && serviceRequiresInsurance(job.service_type)) {
    requiredServices.push(job.service_type);
  }
  
  if (job.service_name && serviceRequiresInsurance(job.service_name) && 
      !requiredServices.includes(job.service_name)) {
    requiredServices.push(job.service_name);
  }
  
  if (job.selected_services && Array.isArray(job.selected_services)) {
    job.selected_services.forEach(service => {
      if (serviceRequiresInsurance(service) && !requiredServices.includes(service)) {
        requiredServices.push(service);
      }
    });
  }
  
  return requiredServices;
}

/**
 * Check if a landscaper has verified insurance
 */
export function landscaperHasVerifiedInsurance(landscaper: {
  insurance_verified?: boolean | null;
  insurance_file_url?: string | null;
}): boolean {
  // Primary check: insurance_verified flag
  if (landscaper.insurance_verified === true) {
    return true;
  }
  
  // Fallback check: insurance_file_url exists (for backwards compatibility)
  if (landscaper.insurance_file_url && landscaper.insurance_file_url.length > 0) {
    return true;
  }
  
  return false;
}

/**
 * Determine if a landscaper can accept a specific job
 */
export function canLandscaperAcceptJob(
  job: {
    service_type?: string | null;
    service_name?: string | null;
    selected_services?: string[] | null;
  },
  landscaper: {
    insurance_verified?: boolean | null;
    insurance_file_url?: string | null;
  }
): { canAccept: boolean; reason?: string } {
  const requiresInsurance = jobRequiresInsurance(job);
  
  if (!requiresInsurance) {
    return { canAccept: true };
  }
  
  const hasInsurance = landscaperHasVerifiedInsurance(landscaper);
  
  if (hasInsurance) {
    return { canAccept: true };
  }
  
  const requiredServices = getInsuranceRequiredServicesFromJob(job);
  
  return {
    canAccept: false,
    reason: `Insurance verification required to accept ${requiredServices.length > 1 ? 'these services' : 'this service'}: ${requiredServices.join(', ')}`
  };
}

/**
 * Filter jobs to only show those a landscaper can accept
 */
export function filterJobsForLandscaper<T extends {
  service_type?: string | null;
  service_name?: string | null;
  selected_services?: string[] | null;
}>(
  jobs: T[],
  landscaper: {
    insurance_verified?: boolean | null;
    insurance_file_url?: string | null;
  },
  options: {
    hideInsuranceRequired?: boolean; // If true, hide jobs requiring insurance; if false, include but mark them
  } = {}
): T[] {
  const hasInsurance = landscaperHasVerifiedInsurance(landscaper);
  
  // If landscaper has insurance, show all jobs
  if (hasInsurance) {
    return jobs;
  }
  
  // If hideInsuranceRequired is true, filter out insurance-required jobs
  if (options.hideInsuranceRequired) {
    return jobs.filter(job => !jobRequiresInsurance(job));
  }
  
  // Otherwise return all jobs (UI will handle disabled state)
  return jobs;
}

/**
 * Error message for insurance requirement
 */
export const INSURANCE_REQUIRED_ERROR = 'Insurance verification required to accept this job';

/**
 * Tooltip text for locked jobs
 */
export const INSURANCE_REQUIRED_TOOLTIP = 'Insurance required to accept this service';
