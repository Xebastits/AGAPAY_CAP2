import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";
import Navbar from "./components/Navbar";
import NDAWrapper from "./components/NDAWrapper";

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
      <body>
        <ThirdwebProvider>
          <Navbar />
            <NDAWrapper>
              {children}
            </NDAWrapper>
        </ThirdwebProvider>
      </body>
    </html>
  );
}
