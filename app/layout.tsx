import type { Metadata } from "next";
import localFont from "next/font/local";
import MotionProvider from "@/components/MotionProvider";
import "./globals.css";

// Self-hosted (OFL, licences beside the files) so the app needs no font CDN and works offline.
const serif = localFont({
  src: "./fonts/YoungSerif-Regular.ttf",
  variable: "--font-serif",
  weight: "400",
});
const sans = localFont({
  src: [
    { path: "./fonts/WorkSans-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/WorkSans-Italic.ttf", weight: "400", style: "italic" },
    { path: "./fonts/WorkSans-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
});
const mono = localFont({
  src: "./fonts/IBMPlexMono-Regular.ttf",
  variable: "--font-mono",
  weight: "400",
});

const description =
  "Upload your lecture notes, name something you love, and get every key concept explained through it, with a concept map, a quiz and a PDF.";

export const metadata: Metadata = {
  // Absolute URLs for the share card. On Vercel, the production domain: per-deployment URLs sit
  // behind Deployment Protection by default, so crawlers could not fetch the image from them.
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000",
  ),
  title: "Bridge",
  description,
  openGraph: {
    title: "Bridge",
    description,
    siteName: "Bridge",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${serif.variable} ${sans.variable} ${mono.variable} antialiased`}>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
