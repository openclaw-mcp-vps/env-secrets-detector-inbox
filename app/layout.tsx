import type { Metadata } from "next";
import Script from "next/script";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap"
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600"]
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://env-secrets-detector-inbox.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Inbox Secrets Detector | Stop API Key Leaks in Gmail",
  description:
    "Scan Gmail bodies and attachments for leaked API keys, passwords, tokens, and credentials before they become incidents.",
  keywords: [
    "gmail security",
    "api key leak detector",
    "email credential scanner",
    "founder security",
    "secrets detection"
  ],
  openGraph: {
    type: "website",
    title: "Inbox Secrets Detector",
    description:
      "Connect Gmail, scan every thread and attachment for 50+ credential patterns, and ship a redaction report instantly.",
    url: siteUrl,
    siteName: "Inbox Secrets Detector"
  },
  twitter: {
    card: "summary_large_image",
    title: "Inbox Secrets Detector",
    description: "Catch leaked AWS, Stripe, OpenAI, and database credentials hidden in email threads."
  },
  icons: {
    icon: "/favicon.ico"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${headingFont.variable} ${monoFont.variable} min-h-screen antialiased [font-family:var(--font-heading)]`}
      >
        <Script src="https://app.lemonsqueezy.com/js/lemon.js" strategy="afterInteractive" />
        {children}
      </body>
    </html>
  );
}
