import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "./components/Navbar";
import ApiAuth from "./components/ApiAuth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL("https://emag.kptmangaluru.in"),

  title: {
    default: "KPT Mangaluru eMagazine",
    template: "%s | KPT Mangaluru eMagazine",
  },

  description:
    "KPT Mangaluru eMagazine featuring institutional activities, departmental events, student achievements, workshops, industrial visits and other activities of Karnataka Government Polytechnic Mangaluru.",

  keywords: [
    "eMagazine" ,"Magazine" ,"eMagazine KPT " ,"Magazine KPT","KPT eMagazine","KPT Magazine",
    "KPT Mangaluru eMagazine",
    "KPT Mangalore eMagazine",
    "KPT Mangaluru Magazine",
    "KPT Mangalore Magazine",
    "Karnataka Government Polytechnic Mangaluru",
    "Karnataka Government Polytechnic Mangalore",
    "KPT Mangaluru activities",
    "KPT Mangaluru events",
    "KPT Mangalore events",
    "KPT student activities",
    "KPT student achievements",
    "KPT Mangaluru student achievements",
    "KPT workshops",
    "KPT industrial visits",
    "KPT departmental activities",
    "polytechnic activities Mangaluru",
    "polytechnic events Mangaluru",
    "college events Mangaluru",
    "student achievements Mangaluru",
    "Karnataka Polytechnic activities",
  ],

  authors: [
    {
      name: "Karnataka Government Polytechnic Mangaluru",
    },
  ],

  creator: "Karnataka Government Polytechnic Mangaluru",

  publisher: "Karnataka Government Polytechnic Mangaluru",

  applicationName: "KPT Mangaluru eMagazine",

  category: "Education",

  classification: "Educational Institution",

  referrer: "origin-when-cross-origin",

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  // Google Search Console verification
  verification: {
    google: "O67tWHY9xLUtBxSrAxCliKSiLNqr1KiTwmd_uKb_iVA",
  },

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_IN",

    url: "https://emag.kptmangaluru.in",

    siteName: "KPT Mangaluru eMagazine",

    title: "KPT Mangaluru eMagazine",

    description:
      "Explore departmental activities, student achievements, workshops, industrial visits, events and institutional activities of Karnataka Government Polytechnic Mangaluru.",

    // Add /public/og-image.jpg when available
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "KPT Mangaluru eMagazine",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: "KPT Mangaluru eMagazine",

    description:
      "Departmental activities, student achievements, workshops, industrial visits and events of KPT Mangaluru.",

    images: ["/og-image.jpg"],
  },

  alternates: {
    canonical: "https://emag.kptmangaluru.in",
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",

  name: "Karnataka Government Polytechnic Mangaluru",

  alternateName: [
    "KPT Mangaluru",
    "KPT Mangalore",
    "Karnataka Government Polytechnic Mangalore",
  ],

  url: "https://emag.kptmangaluru.in",

  description:
    "Karnataka Government Polytechnic Mangaluru eMagazine featuring institutional activities, departmental events, student achievements and other college activities.",

  address: {
    "@type": "PostalAddress",
    addressLocality: "Mangaluru",
    addressRegion: "Karnataka",
    addressCountry: "IN",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",

  name: "KPT Mangaluru eMagazine",

  alternateName: "KPT Mangalore eMagazine",

  url: "https://emag.kptmangaluru.in",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable}`}
        >
          <ApiAuth />
           <Navbar />
          {children}

          {/* Educational Organization Structured Data */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(organizationSchema),
            }}
          />

          {/* Website Structured Data */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(websiteSchema),
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}