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

export const metadata: Metadata = {
  title: "Bridge — lecture notes, explained through what you love",
  description: "Lecture notes explained through the things you already love.",
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
