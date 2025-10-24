import React from 'react';
import SiteChrome from '@/components/SiteChrome';

const TermsOfService: React.FC = () => {
  return (
    <SiteChrome>

      <div className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-green-400 mb-4">
              Terms of Service
            </h1>
            <p className="text-gray-400 text-lg">Effective Date: January 2025</p>
          </div>

          {/* Content Sections */}
          <div className="space-y-8">
            {/* Section 1 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-green-400 mb-4">
                <span className="text-green-400 mr-2">1.</span>Introduction
              </h2>
              <p className="text-gray-300 leading-relaxed">
                Welcome to GreenScape Lux. By accessing our website or using our services, you agree to be bound by these Terms of Service.
              </p>
            </div>

            {/* Section 2 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-green-400 mb-4">
                <span className="text-green-400 mr-2">2.</span>Services Provided
              </h2>
              <p className="text-gray-300 leading-relaxed">
                GreenScape Lux offers landscaping services, including but not limited to design, maintenance, and consultation.
              </p>
            </div>

            {/* Section 3 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-green-400 mb-4">
                <span className="text-green-400 mr-2">3.</span>User Accounts
              </h2>
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p><strong className="text-white">Registration:</strong> Users may need to create an account to access certain features.</p>
                <p><strong className="text-white">Responsibility:</strong> Users are responsible for maintaining the confidentiality of their account information.</p>
              </div>
            </div>

            {/* Section 4 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-green-400 mb-4">
                <span className="text-green-400 mr-2">4.</span>Payments and Refunds
              </h2>
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p><strong className="text-white">Pricing:</strong> All prices are listed on our website and are subject to change.</p>
                <p><strong className="text-white">Refunds:</strong> Refund policies are outlined in our Refund Policy.</p>
              </div>
            </div>

            {/* Section 5 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-green-400 mb-4">
                <span className="text-green-400 mr-2">5.</span>User Conduct
              </h2>
              <div className="text-gray-300 leading-relaxed">
                <p className="mb-3">Users agree not to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Violate any laws or regulations.</li>
                  <li>Infringe upon the rights of others.</li>
                  <li>Post harmful or offensive content.</li>
                </ul>
              </div>
            </div>

            {/* Section 6 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-green-400 mb-4">
                <span className="text-green-400 mr-2">6.</span>Intellectual Property
              </h2>
              <p className="text-gray-300 leading-relaxed">
                All content on this site is the property of GreenScape Lux and is protected by intellectual property laws.
              </p>
            </div>

            {/* Section 7 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-green-400 mb-4">
                <span className="text-green-400 mr-2">7.</span>Disclaimers and Limitation of Liability
              </h2>
              <p className="text-gray-300 leading-relaxed">
                Services are provided "as is" without warranties of any kind. GreenScape Lux is not liable for any damages arising from the use of our services.
              </p>
            </div>

            {/* Section 8 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-green-400 mb-4">
                <span className="text-green-400 mr-2">8.</span>Termination
              </h2>
              <p className="text-gray-300 leading-relaxed">
                We reserve the right to terminate or suspend access to our services at our discretion, without prior notice.
              </p>
            </div>

            {/* Section 9 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-green-400 mb-4">
                <span className="text-green-400 mr-2">9.</span>Changes to Terms
              </h2>
              <p className="text-gray-300 leading-relaxed">
                We may modify these Terms of Service at any time. Continued use of our services constitutes acceptance of the new terms.
              </p>
            </div>

            {/* Section 10 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-green-400 mb-4">
                <span className="text-green-400 mr-2">10.</span>Contact Information
              </h2>
              <p className="text-gray-300 leading-relaxed">
                For any questions regarding these Terms, please contact us at{' '}
                <a href="mailto:contact@greenscapelux.com" className="text-green-400 hover:text-green-300 underline">
                  contact@greenscapelux.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </SiteChrome>

  );
};

export default TermsOfService;