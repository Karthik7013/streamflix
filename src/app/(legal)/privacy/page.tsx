import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
        <p className="mt-2 text-muted-foreground">Last updated: July 1, 2026</p>
      </div>

      <div className="space-y-8">
        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-3">1. Information We Collect</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We collect only the information necessary to provide and improve the Service. When you create an account,
            we collect your name and email address. You may optionally provide a profile avatar. As you use the
            Service, we record your favorite titles, watch history, and any comments you post. We also collect
            standard technical data such as browser type, device information, and IP address through server logs
            and analytics providers.
          </p>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">We use the information we collect for the following purposes:</p>
          <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            {[
              "To create and maintain your account",
              "To personalize your experience, including your favorites and watch history",
              "To respond to your support requests and inquiries",
              "To improve the Service through anonymous usage analysis",
              "To send essential service-related communications, such as password reset emails",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-3">3. Data Sharing & Third-Party Services</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We do not sell, trade, or share your personal information with third parties for their marketing purposes.
            We use the following trusted third-party services to operate the Service:
          </p>
          <div className="mt-4 space-y-3">
            {[
              { name: "Better Auth", desc: "Authentication and account management. Your credentials are handled securely by this provider." },
              { name: "Vercel Analytics & Speed Insights", desc: "Anonymous, privacy-preserving usage analytics and performance monitoring. No personal data is collected." },
              { name: "Internet Archive", desc: "Public media content source. No user data is shared with this service." },
            ].map((svc) => (
              <div key={svc.name} className="rounded-md border border-border bg-background p-3">
                <p className="text-sm font-medium text-foreground">{svc.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{svc.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-3">4. Data Storage & Security</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your data is stored securely in encrypted databases. We implement industry-standard security measures,
            including encryption in transit and at rest, to protect your information from unauthorized access,
            alteration, or disclosure. Passwords are hashed and salted and are never stored in plain text.
            Despite our efforts, no method of electronic storage is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-3">5. Cookies</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We use essential cookies required for authentication and session management. These cookies are necessary
            for the Service to function properly. We do not use tracking cookies, advertising cookies, or any form
            of third-party cross-site tracking. You can configure your browser to reject cookies, but this may
            affect your ability to use certain features of the Service.
          </p>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-3">6. Your Rights</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">You have the following rights regarding your personal data:</p>
          <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            {[
              "Access the personal data we hold about you upon request",
              "Request correction of inaccurate or incomplete data",
              "Request deletion of your account and associated data at any time through your Settings",
              "Export your data in a portable format upon request",
              "Withdraw consent for data processing where applicable",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-3">7. Data Retention</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We retain your personal data for as long as your account remains active. When you delete your account,
            your personal data is permanently removed from our systems within 30 days. Anonymous usage data and
            aggregated analytics may be retained indefinitely for analytical purposes. Server logs containing IP
            addresses are retained for no more than 30 days.
          </p>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-3">8. Changes to This Policy</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We may update this Privacy Policy from time to time to reflect changes in our practices or legal
            requirements. Changes will be posted on this page with an updated effective date. We encourage you
            to review this page periodically. Material changes will be communicated through the Service.
          </p>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-3">9. Contact</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you have questions about this Privacy Policy or wish to exercise your data rights, please{" "}
            <Link href="/contact" className="text-primary hover:underline">contact us</Link>.
            We will respond to your inquiry within two business days.
          </p>
        </section>
      </div>
    </div>
  );
}
