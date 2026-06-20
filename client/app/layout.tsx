import type { Metadata } from "next";
import { Barlow } from "next/font/google";
import "./globals.css";
import Providers from "./_providers/QueryProviders";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
});

export const metadata: Metadata = {
  title: "LB Energy — Intelligent Heat Link",
  description:
    "Intelligente Steuerung für mobile Heizgeräte — Betriebskosten senken, Raumklima halten.",
  icons: { icon: "/brand/favicon-270.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${barlow.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
