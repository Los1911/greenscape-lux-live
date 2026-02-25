/**
 * ClientQuoteForm - Authenticated Client Request Service Form
 * 
 * This is a wrapper component that renders RequestServiceForm in "client" mode.
 * Client mode provides a streamlined experience for authenticated users:
 * - Auto-fills contact information from the client profile
 * - Contact section is collapsible with pre-filled data
 * - Service address defaults to saved primary address
 * - Option to use a different address
 * - Form focus starts at Service Type section
 * 
 * For unauthenticated users, use GetQuoteEnhanced which renders in "guest" mode.
 */

import RequestServiceForm from './RequestServiceForm';

export default function ClientQuoteForm() {
  return <RequestServiceForm mode="client" />;
}
