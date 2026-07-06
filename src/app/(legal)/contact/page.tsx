import type { Metadata } from "next";
import { Mail, Shield, MessageSquare, Building2 } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact",
};

const channels = [
  {
    title: "General Inquiries",
    icon: Mail,
    details: [
      { label: "Email", value: "hello@streamflix.app" },
    ],
    description: "For general questions, feedback, or partnership inquiries.",
  },
  {
    title: "DMCA & Copyright Notices",
    icon: Shield,
    details: [
      { label: "Copyright Agent", value: "dmca@streamflix.app" },
    ],
    description: "Submit copyright takedown requests. Please include all required information as described in our DMCA policy.",
    link: { href: "/dmca", label: "View DMCA Policy" },
  },
  {
    title: "Technical Support",
    icon: MessageSquare,
    details: [
      { label: "Email", value: "support@streamflix.app" },
    ],
    description: "Having trouble with the Service? Reach out to our support team for assistance.",
  },
  {
    title: "Legal Correspondence",
    icon: Building2,
    details: [
      { label: "Entity", value: "StreamFlix" },
    ],
    description: "Legal documents and official correspondence. Contact information for legal matters is available upon request.",
    note: "For DMCA notices, please use the dedicated email above rather than this channel.",
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Contact</h1>
        <p className="mt-2 text-muted-foreground">
          Have a question, concern, or inquiry? We&rsquo;re here to help. Choose the appropriate channel below.
        </p>
      </div>

      <div className="space-y-8">
        {channels.map((channel) => (
          <section key={channel.title} className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                <channel.icon className="size-4 text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-foreground">{channel.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{channel.description}</p>
                <div className="mt-4 space-y-2">
                  {channel.details.map((detail) => (
                    <div key={detail.label} className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">{detail.label}:</span>
                      <span className="font-medium text-foreground">{detail.value}</span>
                    </div>
                  ))}
                </div>
                {channel.link && (
                  <Link href={channel.link.href} className="mt-3 inline-flex text-sm text-primary hover:underline">
                    {channel.link.label} &rarr;
                  </Link>
                )}
                {channel.note && (
                  <p className="mt-3 text-xs text-muted-foreground/70 leading-relaxed">{channel.note}</p>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-lg border border-border bg-muted/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          We aim to respond to all inquiries within two business days. For urgent matters, please include
          &ldquo;Urgent&rdquo; in your email subject line.
        </p>
      </div>
    </div>
  );
}
