import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "./components/Navbar";
import "./globals.css";

export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      "https://emag.kptmangaluru.in"
  ),

  title: {
    default:
      "KPT Mangaluru eMagazine | Karnataka Government Polytechnic",
    template: "%s | KPT Mangaluru eMagazine",
  },

  description:
    "KPT Mangaluru eMagazine showcases academic activities, student achievements, institutional events, department activities and campus highlights of Karnataka Government Polytechnic, Mangaluru.",

  keywords: [
    "KPT Mangaluru",
    "Karnataka Government Polytechnic Mangaluru",
    "KPT Mangaluru eMagazine",
    "Polytechnic Mangaluru",
    "Diploma College Mangaluru",
    "student achievements",
    "college activities",
    "technical education",
  ],

  authors: [
    {
      name: "Karnataka Government Polytechnic, Mangaluru",
    },
  ],

  creator:
    "Karnataka Government Polytechnic, Mangaluru",

  publisher:
    "Karnataka Government Polytechnic, Mangaluru",

  applicationName:
    "KPT Mangaluru eMagazine",

  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "KPT Mangaluru eMagazine",
    title:
      "KPT Mangaluru eMagazine | Karnataka Government Polytechnic",
    description:
      "Academic activities, student achievements, institutional events and campus highlights from KPT Mangaluru.",
  },

  icons: {
    icon: "/favicon.ico",
  },

  verification: {
    google:
      process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
      "",
  },
};

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>

          <Navbar />

          {children}

        </ClerkProvider>
      </body>
    </html>
  );
}