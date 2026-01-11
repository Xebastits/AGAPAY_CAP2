"use client";

import { client } from "@/app/client";
import { useActiveAccount } from "thirdweb/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { arcTestnet } from "thirdweb/chains";
import { inAppWallet } from "thirdweb/wallets";
import agapayLogo from './assets/favicon.png';
import { lightTheme } from "thirdweb/react";
import { isAdmin } from "./constants/constant";
import NDAModal from "./components/NDAModal";
import { AGAPAY_TOKEN_ADDRESS } from "./constants/constant";
import { ConnectButton } from "./components/ConnectButton";


const wallets = [
  inAppWallet({
    auth: {
      options: ["google"],
    },
  }),
];

export default function Home() {
  const account = useActiveAccount();
  const router = useRouter();

  const [showNDA, setShowNDA] = useState(false);
  const [pendingAddress, setPendingAddress] = useState<string | null>(null);

  // useEffect(() => {
  //   if (!account?.address) return;

  //   const ndaAccepted = localStorage.getItem("nda_accepted") === "true";

  //   // --- IMPORTANT ---
  //   // Detect if this page load is NEW or REFRESH
  //   const refreshed = sessionStorage.getItem("has_refreshed") === "true";

  //   // Mark this session as already refreshed once
  //   if (!refreshed) {
  //     sessionStorage.setItem("has_refreshed", "true");
  //   }

  //   // If the user refreshed the page:
  //   if (refreshed) {
  //     // Do NOT show NDA again on refresh → skip straight to redirect
  //     if (isAdmin(account.address)) {
  //       router.push("/admin");
  //     } else {
  //       router.push("/campaigns");
  //     }
  //     return;
  //   }

  //   // First time account connects (NO refresh)
  //   if (!ndaAccepted) {
  //     setPendingAddress(account.address);
  //     setShowNDA(true);
  //     return;
  //   }

  //   // If NDA already accepted
  //   if (isAdmin(account.address)) {
  //     router.push("/admin");
  //   } else {
  //     router.push("/campaigns");
  //   }

  // }, [account, router]);

  const handleAcceptNDA = () => {
    localStorage.setItem("nda_accepted", "true");
    setShowNDA(false);

    if (!pendingAddress) return;

    if (isAdmin(pendingAddress)) {
      router.push("/admin");
    } else {
      router.push("/campaigns");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="text-center">
        {/* 2. Use the variable in the src using curly braces */}
        <img
          src={agapayLogo.src}
          alt="Agapay Logo"
          className="mx-auto mb-4 w-64 h-auto"
          draggable="false"
          
        />

        <h1 className="text-4xl font-bold mb-8 text-slate-700">Agapay</h1>
        <p className="text-lg mb-8 text-slate-600">Sign with your Google account to get started.</p>
        <ConnectButton

          detailsButton={{
            displayBalanceToken: {
              [arcTestnet.id]: AGAPAY_TOKEN_ADDRESS, 
            },
          }}
          connectButton={{
            label: "Sign in"
          }}
          accountAbstraction={{
            chain: arcTestnet,
            sponsorGas: true,
          }}
          client={client}
          connectModal={{
            showThirdwebBranding: false, size: "compact",
          }}
          wallets={wallets}

          detailsModal={{
            hideSwitchWallet: true,
          }}
          theme={lightTheme()}
        />
      </div>

      {/* NDA modal */}
      <NDAModal isOpen={showNDA} onAccept={handleAcceptNDA} />
    </div>
  );
}   
