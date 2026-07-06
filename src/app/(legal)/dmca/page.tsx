import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "DMCA & Copyright",
};

export default function DmcaPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">DMCA & Copyright Policy</h1>
        <p className="mt-2 text-muted-foreground">Last updated: July 1, 2026</p>
      </div>

      <div className="space-y-8">
        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-3">Notice of Copyright Infringement</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            StreamFlix respects the intellectual property rights of others and complies with the Digital Millennium
            Copyright Act (&ldquo;DMCA&rdquo;). If you believe that any content available through our Service infringes
            your copyright, you may submit a written DMCA notice to our designated Copyright Agent. We will respond
            to valid notices promptly and take appropriate action, including removal of the allegedly infringing
            material.
          </p>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-3">Required Information</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            To be effective, your DMCA notice must include the following information:
          </p>
          <ol className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            {[
              "Your physical or electronic signature",
              "Identification of the copyrighted work you claim has been infringed, including registration number if applicable",
              "Identification of the material that is infringing and sufficient information to locate it on the Service, including the specific URL",
              "Your contact information, including your full name, mailing address, telephone number, and email address",
              "A statement that you have a good-faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law",
              "A statement, made under penalty of perjury, that the information in your notice is accurate and that you are the copyright owner or authorized to act on the copyright owner&rsquo;s behalf",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-3">Submit a DMCA Notice</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Send your completed DMCA notice to our designated Copyright Agent:
          </p>
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-sm font-medium text-foreground">Copyright Agent</p>
            <p className="text-sm text-muted-foreground">StreamFlix</p>
            <p className="text-sm text-muted-foreground mt-2">
              Email: <span className="font-mono text-foreground">dmca@streamflix.app</span>
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              We will acknowledge receipt of your notice within two business days and begin our investigation.
              Please do not send multiple follow-ups during this period.
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-3">Counter-Notification</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            If you believe that material you submitted was removed or disabled as a result of mistake or
            misidentification, you may file a counter-notification with our Copyright Agent. Your
            counter-notification must include:
          </p>
          <ol className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            {[
              "Your physical or electronic signature",
              "Identification of the material that was removed and the location where it appeared before removal",
              "A statement, under penalty of perjury, that you have a good-faith belief that the material was removed or disabled as a result of mistake or misidentification",
              "Your name, address, and telephone number, and a statement that you consent to the jurisdiction of the federal district court for the judicial district in which your address is located",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-3">Repeat Infringer Policy</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We reserve the right to terminate the accounts of users who are determined to be repeat infringers
            of copyrighted content. A repeat infringer is any user who has been the subject of more than one
            valid DMCA notice. We also reserve the right to suspend or terminate accounts at our discretion
            based on the severity or frequency of alleged infringement.
          </p>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-3">Content Sources</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Media content available through StreamFlix is sourced from publicly accessible third-party archives,
            including the Internet Archive (archive.org), a non-profit digital library. We do not host, upload,
            or control the content displayed on our platform. If you believe that any content available through
            our Service infringes your copyright, please follow the DMCA process outlined above.
          </p>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-3">Questions</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            For questions about this DMCA policy or the copyright compliance process, please{" "}
            <Link href="/contact" className="text-primary hover:underline">contact us</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
