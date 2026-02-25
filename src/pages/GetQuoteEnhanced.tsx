/**
 * GetQuoteEnhanced - Public Guest Estimate Form
 * 
 * This is a wrapper component that renders RequestServiceForm in "guest" mode.
 * Guest mode provides the full estimate form experience for unauthenticated users.
 * 
 * For authenticated clients, use ClientQuoteForm which renders in "client" mode
 * with auto-filled profile data and a streamlined experience.
 */

import RequestServiceForm from './RequestServiceForm';

export default function GetQuoteEnhanced() {
  return <RequestServiceForm mode="guest" />;
}
