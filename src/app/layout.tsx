import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";
import Navbar from "./components/Navbar";
import NDAWrapper from "./components/NDAWrapper";
import { NetworkProvider } from "./constants/network";
import AuthGuard from "./components/AuthGuard";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agapay",
  description:
    "A BLOCKCHAIN ENABLED WEB APPLICATION CROWDFUNDING PLATFORM FOR SOCIAL WELFARE ASSISTANCE",
  icons: {
    icon: "/logofavicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} text-slate-900 bg-white`}>
        <ThirdwebProvider>
          <NetworkProvider>
            <AuthGuard />
            <Navbar />
            {children}
          </NetworkProvider>
        </ThirdwebProvider>
      </body>
    </html>
  );
}
