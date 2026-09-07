import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#191a1a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Perplexity BYOK - AI Search Engine",
  description:
    "Perplexity-style real-time AI search powered by your own API keys (Google, OpenAI, Grok, Anthropic, Kimi, Qwen, Deepgram)",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Perplexity",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="bg-[#191a1a] text-[#e4e7e7] min-h-screen antialiased selection:bg-perplexity-teal/30 selection:text-white"
      >
        {children}
      </body>
    </html>
  );
}
