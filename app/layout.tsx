import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "@/app/globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope"
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://inbox-secrets-detector.app"),
  title: "Inbox Secrets Detector | Scan Gmail for leaked API keys",
  description:
    "Connect Gmail read-only and detect leaked API keys, tokens, and credentials buried in emails and attachments before attackers do.",
  openGraph: {
    title: "Inbox Secrets Detector",
    description:
      "Security-first inbox scanner for founders. Detect, redact, and report leaked credentials across email threads and attachments.",
    url: "https://inbox-secrets-detector.app",
    siteName: "Inbox Secrets Detector",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Inbox Secrets Detector",
    description:
      "Find exposed API keys in Gmail attachments and message bodies. Generate actionable remediation reports."
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${spaceGrotesk.variable}`}>
      <body>{children}</body>
    </html>
  );
}
