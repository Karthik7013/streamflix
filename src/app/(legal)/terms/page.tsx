import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: July 2026</p>

      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
          <p>
            By accessing or using StreamFlix, you agree to be bound by these Terms of Service. If you do not agree, do not use the service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">2. Description of Service</h2>
          <p>
            StreamFlix provides a platform for browsing and streaming media content. We do not host, upload, or own any of the media files displayed on this site. All content is sourced from publicly available third-party archives, including the Internet Archive.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">3. User Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials. You must notify us immediately of any unauthorized use of your account. We reserve the right to terminate accounts that violate these terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">4. User Conduct</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Use the service for any unlawful purpose</li>
            <li>Attempt to access restricted areas of the site</li>
            <li>Submit false or abusive content, including comments or reports</li>
            <li>Interfere with the proper functioning of the service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">5. Intellectual Property</h2>
          <p>
            The StreamFlix name, logo, and site design are our property. Media content displayed on this site is the property of its respective owners. StreamFlix does not claim ownership over any third-party content.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">6. Copyright & DMCA</h2>
          <p>
            If you believe any content on StreamFlix infringes your copyright, please submit a DMCA notice to our designated contact. We will respond to valid takedown requests promptly. See our <a href="/dmca" className="text-primary hover:underline">DMCA page</a> for details.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">7. Disclaimer of Warranties</h2>
          <p>
            StreamFlix is provided &quot;as is&quot; without warranties of any kind, express or implied. We do not guarantee that the service will be uninterrupted or error-free.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">8. Limitation of Liability</h2>
          <p>
            StreamFlix shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">9. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Changes will be posted on this page with an updated date. Continued use of the service after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">10. Contact</h2>
          <p>
            For questions about these terms, please <a href="/contact" className="text-primary hover:underline">contact us</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
