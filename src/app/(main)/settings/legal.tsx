import { FileText, Shield, Flag, Mail, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const links = [
  { label: "Terms of Service", href: "/terms", icon: FileText },
  { label: "Privacy Policy", href: "/privacy", icon: Shield },
  { label: "DMCA", href: "/dmca", icon: Flag },
  { label: "Contact", href: "/contact", icon: Mail },
];

export default function LegalLinks() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Legal</CardTitle>
        <CardDescription>Terms, privacy, and other policies.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors border-t border-border first:border-t-0"
          >
            <link.icon className="size-4 shrink-0" />
            <span className="flex-1">{link.label}</span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
