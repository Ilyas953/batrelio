import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PRODUCTION_SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(PRODUCTION_SITE_URL),
  title: "Batrelio · Ne perdez plus un client parce que vous étiez sur un chantier",
  description:
    "Appel manqué ? Batrelio envoie un SMS à votre nom, récupère la demande du client avec photos, et vous permet d'envoyer un devis signé en ligne avec acompte. Pour les artisans.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
