import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Contact</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Have a question, concern, or DMCA inquiry? Reach out to us.
      </p>

      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">General Inquiries</h2>
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <p className="font-medium text-foreground">Email</p>
            <p>hello@streamflix.app</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">DMCA / Copyright Notices</h2>
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <p className="font-medium text-foreground">Copyright Agent</p>
            <p>Email: dmca@streamflix.app</p>
            <p className="mt-2 text-xs">
              Please include all required information as described in our{" "}
              <a href="/dmca" className="text-primary hover:underline">DMCA policy</a>.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Support</h2>
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <p className="font-medium text-foreground">Email</p>
            <p>support@streamflix.app</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Legal Address</h2>
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <p className="font-medium text-foreground">StreamFlix</p>
            <p className="text-xs text-muted-foreground mt-1">Contact information for legal correspondence available upon request.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
