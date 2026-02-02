import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#e50914",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "EuDorama - Sua plataforma de doramas",
  description: "Assista aos melhores doramas coreanos, japoneses e chineses. Streaming gratuito de séries asiáticas com legendas em português.",
  keywords: ["dorama", "doramas", "k-drama", "j-drama", "c-drama", "streaming", "séries asiáticas", "legendas em português"],
  manifest: "/manifest.json",
  applicationName: "EuDorama",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "EuDorama",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "EuDorama - Sua plataforma de doramas",
    description: "Assista aos melhores doramas coreanos, japoneses e chineses.",
    type: "website",
    locale: "pt_BR",
    siteName: "EuDorama",
  },
  twitter: {
    card: "summary_large_image",
    title: "EuDorama - Sua plataforma de doramas",
    description: "Streaming gratuito de doramas asiáticos com legendas em português.",
  },
  icons: {
    icon: [
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-180x180.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
