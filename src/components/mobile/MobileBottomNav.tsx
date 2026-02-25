/**
 * MobileBottomNav - DISABLED
 * 
 * Mobile bottom navigation has been removed entirely for a premium,
 * scroll-safe Lux experience. Navigation is now handled via:
 * - Top header navigation
 * - Contextual back buttons
 * - Dashboard tab bars
 * 
 * This component is kept for backwards compatibility but renders nothing.
 */

interface MobileBottomNavProps {
  userRole?: string
  notificationCount?: number
  /** Force hide the nav (e.g., during onboarding) */
  forceHide?: boolean
}

export function MobileBottomNav(_props: MobileBottomNavProps) {
  // Mobile bottom navigation is completely disabled for premium Lux experience
  // All navigation is handled via top navigation and contextual back buttons
  return null
}
