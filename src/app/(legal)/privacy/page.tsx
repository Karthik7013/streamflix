import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: July 2026</p>

      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">1. Information We Collect</h2>
          <p>We collect the following information when you use StreamFlix:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong className="text-foreground">Account information:</strong> name, email address, and avatar image when you sign up</li>
            <li><strong className="text-foreground">Usage data:</strong> movies and series you mark as favorites, watch history, and comments you post</li>
            <li><strong className="text-foreground">Technical data:</strong> browser type, device information, and IP address (collected via standard server logs)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>To provide and maintain your account</li>
            <li>To personalize your experience (e.g., favorites, watch history)</li>
            <li>To respond to your support requests</li>
            <li>To improve the service</li>
            <li>To send service-related communications (e.g., password reset emails)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">3. Third-Party Services</h2>
          <p>We use the following third-party services:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong className="text-foreground">Better Auth</strong> — authentication and account management</li>
            <li><strong className="text-foreground">Vercel Analytics & Speed Insights</strong> — anonymous usage analytics and performance monitoring</li>
            <li><strong className="text-foreground">Internet Archive</strong> — media content source (no user data shared)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">4. Data Storage & Security</h2>
          <p>
            Your data is stored securely in our database. We use industry-standard security measures to protect your information. Passwords are never stored in plain text.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">5. Cookies</h2>
          <p>
            We use essential cookies for authentication and session management. We do not use tracking cookies or third-party advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Access the personal data we hold about you</li>
            <li>Request correction or deletion of your data</li>
            <li>Delete your account at any time (available in Settings)</li>
            <li>Export your data upon request</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">7. Data Retention</h2>
          <p>
            We retain your account data for as long as your account is active. When you delete your account, your personal data is permanently removed. Anonymous usage data may be retained longer for analytics purposes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">8. Changes to This Policy</h2>
          <p>
            We may update this policy from time to time. Changes will be posted on this page with an updated date.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">9. Contact</h2>
          <p>
            For questions about this policy or to exercise your data rights, please <a href="/contact" className="text-primary hover:underline">contact us</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
