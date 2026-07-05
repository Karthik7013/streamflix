import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DMCA & Copyright",
};

export default function DmcaPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-2">DMCA & Copyright Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: July 2026</p>

      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Notice of Copyright Infringement</h2>
          <p>
            StreamFlix respects the intellectual property rights of others. If you believe that any content
            available through our service infringes your copyright, please submit a DMCA notice to our
            designated Copyright Agent with the following information:
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Required Information</h2>
          <p>Your DMCA notice must include:</p>
          <ol className="list-decimal pl-6 mt-2 space-y-2">
            <li>Your physical or electronic signature</li>
            <li>Identification of the copyrighted work you claim has been infringed</li>
            <li>Identification of the material that is infringing and where it is located on the site (URL)</li>
            <li>Your contact information — name, address, email, and phone number</li>
            <li>A statement that you have a good-faith belief that the use is not authorized by the copyright owner</li>
            <li>A statement, under penalty of perjury, that the information in your notice is accurate and that you are the copyright owner or authorized to act on their behalf</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Submit a DMCA Notice</h2>
          <p>
            Send your DMCA notice to our designated Copyright Agent:
          </p>
          <div className="mt-3 rounded-lg border border-border bg-muted/50 p-4 text-sm">
            <p className="font-medium text-foreground">Copyright Agent</p>
            <p>StreamFlix</p>
            <p>Email: dmca@streamflix.app</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Counter-Notification</h2>
          <p>
            If you believe that material you submitted was removed or disabled by mistake or
            misidentification, you may file a counter-notification. Your counter-notification must include:
          </p>
          <ol className="list-decimal pl-6 mt-2 space-y-2">
            <li>Your physical or electronic signature</li>
            <li>Identification of the material that was removed and where it appeared before removal</li>
            <li>A statement under penalty of perjury that you have a good-faith belief the material was removed due to mistake or misidentification</li>
            <li>Your name, address, and phone number, and a statement that you consent to the jurisdiction of the federal court in your district</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Repeat Infringers</h2>
          <p>
            We reserve the right to terminate the accounts of users who are repeat infringers of copyright.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Content Sources</h2>
          <p>
            Media content on StreamFlix is sourced from publicly available archives, including the
            Internet Archive (archive.org), a non-profit digital library. We do not host or control
            the content displayed. If you believe content available through our service infringes your
            copyright, please follow the DMCA process above.
          </p>
        </section>
      </div>
    </div>
  );
}
