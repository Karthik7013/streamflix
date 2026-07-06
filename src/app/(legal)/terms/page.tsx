import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Terms of Service</h1>
        <p className="mt-2 text-muted-foreground">Last updated: July 1, 2026</p>
      </div>

      <div className="space-y-8">
        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            By accessing or using StreamFlix (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service
            (&ldquo;Terms&rdquo;). If you do not agree to all of these Terms, you may not access or use the Service.
            We reserve the right to update or modify these Terms at any time, and your continued use of the Service
            following any changes constitutes acceptance of those changes.
          </p>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-3">2. Description of Service</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            StreamFlix provides a platform for browsing, discovering, and streaming media content, including movies
            and television series. The Service acts as a directory and playback interface for content sourced from
            publicly available third-party archives. We do not host, upload, store, or own any of the media files
            displayed on this site. All content is provided for informational and entertainment purposes only.
          </p>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-3">3. User Accounts</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            To access certain features of the Service, you may be required to create an account. You are responsible
            for maintaining the confidentiality of your account credentials and for all activities that occur under
            your account. You agree to notify us immediately of any unauthorized use of your account. We reserve
            the right to suspend or terminate accounts that violate these Terms or engage in abusive behavior.
          </p>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-3">4. User Conduct</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">You agree not to:</p>
          <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            {[
              "Use the Service for any unlawful purpose or in violation of any applicable laws",
              "Attempt to access, probe, or scan restricted areas of the Service or its infrastructure",
              "Submit false, misleading, or abusive content, including comments, reports, or uploads",
              "Interfere with the proper functioning of the Service, including introducing malware or disrupting servers",
              "Impersonate any person or entity or misrepresent your affiliation with any person or entity",
              "Scrape, crawl, or systematically extract data from the Service without prior written permission",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-3">5. Intellectual Property</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The StreamFlix name, logo, site design, and user interface are our intellectual property and may not be
            reproduced, modified, or distributed without our prior written consent. Media content displayed through
            the Service is the property of its respective owners and is protected by applicable copyright and
            intellectual property laws. StreamFlix does not claim ownership over any third-party content made
            available through the Service.
          </p>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-3">6. Copyright & DMCA Compliance</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We respect the intellectual property rights of others and comply with the Digital Millennium Copyright Act
            (&ldquo;DMCA&rdquo;). If you believe that any content available through the Service infringes your copyright,
            please submit a DMCA notice to our designated Copyright Agent. We will respond to valid takedown requests
            promptly. Please see our <Link href="/dmca" className="text-primary hover:underline">DMCA Policy</Link> for detailed instructions.
          </p>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-3">7. Disclaimer of Warranties</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind,
            whether express or implied. We do not guarantee that the Service will be uninterrupted, timely, secure,
            or error-free. We make no representations about the accuracy, reliability, completeness, or timeliness
            of the content available through the Service. Your use of the Service is at your sole risk.
          </p>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-3">8. Limitation of Liability</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            To the fullest extent permitted by applicable law, StreamFlix and its operators shall not be liable for
            any indirect, incidental, special, consequential, or punitive damages arising out of or related to your
            use of or inability to use the Service. This includes, but is not limited to, damages for loss of data,
            revenue, or goodwill. Some jurisdictions do not allow the exclusion of certain warranties or limitations
            of liability, so the above limitations may not apply to you.
          </p>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-3">9. Changes to Terms</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We reserve the right to modify or replace these Terms at any time. Changes will be posted on this page
            with an updated effective date. Your continued use of the Service after any changes constitutes your
            acceptance of the new Terms. We encourage you to review this page periodically for any updates.
          </p>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-3">10. Governing Law</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which
            StreamFlix operates, without regard to its conflict of law provisions. Any disputes arising under these
            Terms shall be resolved through binding arbitration or in the courts of that jurisdiction.
          </p>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-3">11. Contact Information</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            For questions, concerns, or requests regarding these Terms, please{" "}
            <Link href="/contact" className="text-primary hover:underline">contact us</Link>.
            We aim to respond to all inquiries within two business days.
          </p>
        </section>
      </div>
    </div>
  );
}
