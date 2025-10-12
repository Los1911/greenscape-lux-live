import React from 'react';
import SiteChrome from '@/components/SiteChrome';

const PrivacyPolicy: React.FC = () => {
  return (
    <SiteChrome>

      <div className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-green-400 mb-4">
              Privacy Policy
            </h1>
            <p className="text-gray-400 text-lg">Effective Date: January 1, 2024</p>
          </div>

          {/* Content Sections */}
          <div className="space-y-8">
            {/* Section 1 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-green-400 mb-4">
                <span className="text-green-400 mr-2">1.</span>Information We Collect
              </h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <div>
                  <p className="font-semibold text-white mb-2">Personal Information:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Full name</li>
                    <li>Email address</li>
                    <li>Phone number</li>
                    <li>Property address</li>
                    <li>Any details submitted through forms or service requests</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-white mb-2">Technical Information:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Browser type and version</li>
                    <li>Device and operating system</li>
                    <li>IP address</li>
                    <li>Pages visited and time spent on site</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-green-400 mb-4">
                <span className="text-green-400 mr-2">2.</span>How We Use Your Information
              </h2>
              <div className="text-gray-300 leading-relaxed">
                <p className="mb-3">We use your information to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Respond to service inquiries and process quotes</li>
                  <li>Schedule and confirm landscaping appointments</li>
                  <li>Communicate updates or promotions</li>
                  <li>Improve our website performance and content</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </div>
            </div>

            {/* Section 3 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-green-400 mb-4">
                <span className="text-green-400 mr-2">3.</span>Sharing Your Information
              </h2>
              <div className="text-gray-300 leading-relaxed">
                <p className="mb-3">We do not sell your information. We may share it with:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Verified GreenScape Lux landscapers or subcontractors</li>
                  <li>Website and communication service providers</li>
                  <li>Legal authorities if required by law</li>
                </ul>
              </div>
            </div>

            {/* Section 4 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-green-400 mb-4">
                <span className="text-green-400 mr-2">4.</span>Cookies and Tracking
              </h2>
              <p className="text-gray-300 leading-relaxed">
                We use cookies to improve user experience and track site usage. You can disable cookies in your browser settings.
              </p>
            </div>

            {/* Section 5 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-green-400 mb-4">
                <span className="text-green-400 mr-2">5.</span>How We Protect Your Information
              </h2>
              <ul className="list-disc list-inside space-y-2 ml-4 text-gray-300">
                <li>Data is encrypted in transit</li>
                <li>Access is restricted to authorized team members</li>
                <li>Secure platforms are used for storage</li>
              </ul>
            </div>

            {/* Section 6 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-green-400 mb-4">
                <span className="text-green-400 mr-2">6.</span>Your Rights
              </h2>
              <div className="text-gray-300 leading-relaxed">
                <p className="mb-3">You may:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Request access to your data</li>
                  <li>Update or delete your information</li>
                  <li>Unsubscribe from emails</li>
                  <li>Contact us at{' '}
                    <a href="mailto:privacy@greenscapelux.com" className="text-green-400 hover:text-green-300 underline">
                      privacy@greenscapelux.com
                    </a>{' '}for requests
                  </li>
                </ul>
              </div>
            </div>

            {/* Section 7 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-green-400 mb-4">
                <span className="text-green-400 mr-2">7.</span>Policy Updates
              </h2>
              <p className="text-gray-300 leading-relaxed">
                We may update this policy. The new version will be posted with a revised effective date.
              </p>
            </div>

            {/* Section 8 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-green-400 mb-4">
                <span className="text-green-400 mr-2">8.</span>Contact Us
              </h2>
              <div className="text-gray-300 leading-relaxed space-y-2">
                <p>📧{' '}
                  <a href="mailto:privacy@greenscapelux.com" className="text-green-400 hover:text-green-300 underline">
                    privacy@greenscapelux.com
                  </a>
                </p>
                <p>📍 GreenScape Lux – Charlotte, NC</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteChrome>

  );
};

export default PrivacyPolicy;