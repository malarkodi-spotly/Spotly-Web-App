export default function TermsContent() {
  return (
    <div className="space-y-5 text-sm" data-testid="content-terms">
      {/* Section 1 */}
      <section>
        <h2 className="text-base font-bold text-primary mb-3">1. Terms of Service</h2>
        <div className="mb-3">
          <h3 className="font-semibold text-neutral-800 mb-1">1.1 Platform Overview</h3>
          <p className="text-neutral-600 leading-relaxed">
            Spotly is a mobile-based platform that connects individuals who have available parking spaces (&ldquo;Space Providers&rdquo;) with users seeking parking (&ldquo;Space Seekers&rdquo;).
            Spotly acts only as a technology facilitator and does not own, control, manage, or verify any parking spaces listed on the platform.
          </p>
        </div>

        <div className="mb-3">
          <h3 className="font-semibold text-neutral-800 mb-1">1.2 User Roles</h3>
          <div className="space-y-2 text-neutral-600 leading-relaxed pl-1">
            <div>
              <strong className="text-neutral-700 text-xs">Space Providers:</strong>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Can list available parking spaces (car/bike)</li>
                <li>Provide details such as location, rent, and images</li>
                <li>Agree that their listing information will be visible to registered users</li>
              </ul>
            </div>
            <div>
              <strong className="text-neutral-700 text-xs">Space Seekers:</strong>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Can browse available parking listings</li>
                <li>Can contact Space Providers after unlocking contact details (if applicable)</li>
                <li>
                  <strong>Free Public Roadside Parking:</strong> Spotly provides location guidance only. Availability is not guaranteed. Check parking rules and signs before parking. Park at your own risk; Spotly is not responsible for fines or vehicle-related incidents.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <h3 className="font-semibold text-neutral-800 mb-1">1.3 User Responsibilities</h3>
          <ul className="text-neutral-600 leading-relaxed list-disc pl-4 space-y-1">
            <li>Provide accurate and truthful information</li>
            <li>Use the platform in good faith and for lawful purposes only</li>
            <li>Take full responsibility for all interactions, agreements, and transactions</li>
          </ul>
          <p className="text-xs text-neutral-500 italic mt-2">
            All agreements, payments, and arrangements are strictly between users. Spotly is not a party to any transaction.
          </p>
        </div>

        <div className="mb-3">
          <h3 className="font-semibold text-neutral-800 mb-1">1.4 No Verification &amp; No Guarantee</h3>
          <ul className="text-neutral-600 leading-relaxed list-disc pl-4 space-y-1">
            <li>Does not verify users or listings</li>
            <li>Does not guarantee availability, pricing, or quality of parking spaces</li>
            <li>Does not act as an agent, broker, employer, or contractor</li>
          </ul>
          <p className="text-xs text-neutral-500 italic mt-1">
            Users are strongly advised to verify details independently before making any commitments.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-neutral-800 mb-1">1.5 Prohibited Use</h3>
          <ul className="text-neutral-600 leading-relaxed list-disc pl-4 space-y-1">
            <li>Engage in fraud, scams, or illegal activities</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Provide false or misleading information</li>
            <li>Impersonate another person or entity</li>
          </ul>
        </div>
      </section>

      {/* Section 2 */}
      <section>
        <h2 className="text-base font-bold text-primary mb-3">2. Privacy &amp; Data Usage</h2>
        <div className="mb-3">
          <h3 className="font-semibold text-neutral-800 mb-1">2.1 Information Collected</h3>
          <ul className="text-neutral-600 leading-relaxed list-disc pl-4 space-y-1">
            <li><strong>From Space Providers:</strong> Name, Mobile number, Parking space details (location, rent, photos)</li>
            <li><strong>From Space Seekers:</strong> Name, Mobile number, Location preferences</li>
          </ul>
        </div>

        <div className="mb-3">
          <h3 className="font-semibold text-neutral-800 mb-1">2.2 Purpose of Data Collection</h3>
          <ul className="text-neutral-600 leading-relaxed list-disc pl-4 space-y-1">
            <li>Facilitate connections between users</li>
            <li>Display relevant parking listings</li>
            <li>Enable communication between Providers and Seekers</li>
            <li>Improve app functionality and user experience</li>
          </ul>
        </div>

        <div className="mb-3">
          <h3 className="font-semibold text-neutral-800 mb-1">2.3 Consent to Share Information</h3>
          <ul className="text-neutral-600 leading-relaxed list-disc pl-4 space-y-1">
            <li>Space Providers consent to sharing their listing and contact details</li>
            <li>Space Seekers agree to use this information only for parking-related purposes</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-neutral-800 mb-1">2.4 Data Security</h3>
          <p className="text-neutral-600 leading-relaxed">
            Spotly implements reasonable security measures to protect user data. However, we are not responsible for user actions outside the platform. Users should exercise caution when sharing personal or financial information.
          </p>
        </div>
      </section>

      {/* Section 3 */}
      <section>
        <h2 className="text-base font-bold text-primary mb-3">3. Payment &amp; Subscription Policy</h2>
        <div className="mb-3">
          <h3 className="font-semibold text-neutral-800 mb-1">3.1 Premium Features</h3>
          <p className="text-neutral-600 leading-relaxed">
            Spotly may offer paid features such as: Access to contact details, Enhanced listing visibility, and Subscription plans (Basic / Premium).
          </p>
        </div>

        <div className="mb-3">
          <h3 className="font-semibold text-neutral-800 mb-1">3.2 Payments</h3>
          <ul className="text-neutral-600 leading-relaxed list-disc pl-4 space-y-1">
            <li>All payments must be completed through authorized payment methods provided in the App</li>
            <li>Users are responsible for verifying payment details before confirming</li>
          </ul>
        </div>

        <div className="mb-3">
          <h3 className="font-semibold text-neutral-800 mb-1">3.3 Refund Policy</h3>
          <ul className="text-neutral-600 leading-relaxed list-disc pl-4 space-y-1">
            <li>All payments are non-refundable</li>
            <li>Once a subscription is activated, it cannot be cancelled for a refund</li>
            <li>Users are advised to review features before purchasing</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-neutral-800 mb-1">3.4 User Responsibility</h3>
          <ul className="text-neutral-600 leading-relaxed list-disc pl-4 space-y-1">
            <li>Managing subscriptions</li>
            <li>Ensuring timely payments</li>
            <li>Maintaining access to their accounts</li>
          </ul>
        </div>
      </section>

      {/* Section 4 */}
      <section>
        <h2 className="text-base font-bold text-primary mb-3">4. Liability &amp; Disputes</h2>
        <div className="mb-3">
          <h3 className="font-semibold text-neutral-800 mb-1">4.1 Platform Limitation</h3>
          <p className="text-neutral-600 leading-relaxed">
            Spotly is only a facilitator platform. We do not participate in transactions, guarantee service quality, or ensure user reliability.
          </p>
        </div>

        <div className="mb-3">
          <h3 className="font-semibold text-neutral-800 mb-1">4.2 Limitation of Liability</h3>
          <p className="text-neutral-600 leading-relaxed mb-1">
            Spotly shall not be liable for: Any disputes between users; Financial loss, fraud, or damages; Parking-related issues (availability, safety, pricing).
          </p>
          <p className="text-xs text-neutral-500 italic">
            Use of the platform is at your own risk.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-neutral-800 mb-1">4.3 Dispute Resolution</h3>
          <p className="text-neutral-600 leading-relaxed">
            Users must resolve disputes directly with each other. Spotly does not mediate or intervene in conflicts.
          </p>
        </div>
      </section>

      {/* Section 5 */}
      <section>
        <h2 className="text-base font-bold text-primary mb-3">5. Account Suspension &amp; Termination</h2>
        <p className="text-neutral-600 leading-relaxed">
          Spotly reserves the right to suspend or terminate accounts for violations, or remove listings that are misleading or inappropriate.
        </p>
      </section>

      {/* Section 6 */}
      <section>
        <h2 className="text-base font-bold text-primary mb-3">6. Changes to Terms</h2>
        <p className="text-neutral-600 leading-relaxed">
          We may update these Terms &amp; Conditions at any time. Updated versions will be posted within the App and on the website with a revised effective date.
        </p>
      </section>
    </div>
  );
}
