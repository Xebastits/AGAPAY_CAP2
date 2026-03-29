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
import { ConnectButton } from "./components/ConnectButton";
import photo1 from './assets/testimonial2.jpg';
import photo2 from './assets/testimonial1.jpg';
import photo3 from './assets/testimonial3.jpg';


const wallets = [
  inAppWallet({
    auth: {
      options: ["google"],
    },
  }),
];

const testimonials = [
  {
    quote: "Tinulungan kami ng Agapay na makapag raise ng funds para sa mga biktima ng typhoon sa loob lang ng 48 hours. Bawat transaction ay transparent at madaling ma verify online.",
    role: "Relief Coordinator @ Cebu",
    image: photo1.src,
  },
  {
    quote: "Bilang donor, sa wakas naging confident na ako dahil alam ko kung saan talaga pumupunta ang pera ko through online. May peace of mind ako.",
    role: "Regular Donor @ Makati",
    image: photo2.src,
  },
  {
    quote: "Ginamit ng barangay namin ang Agapay para mag distribute ng aid pagkatapos ng landslide. Dahil sa smart contract, siguradong zero leakage.",
    role: "Local Government Official",
    image: photo3.src,
  },
];

export default function Home() {
  const account = useActiveAccount();
  const router = useRouter();

  const [showNDA, setShowNDA] = useState(false);
  const [pendingAddress, setPendingAddress] = useState<string | null>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
  if (!account?.address) return;

  const ndaAccepted = localStorage.getItem("nda_accepted") === "true";
  const refreshed = sessionStorage.getItem("has_refreshed") === "true";

  if (!refreshed) {
    sessionStorage.setItem("has_refreshed", "true");
  }

  if (refreshed) {
    if (isAdmin(account.address)) {
      router.push("/admin");
    } else {
      router.push("/campaigns");
    }
    return;
  }

  if (!ndaAccepted) {
    setPendingAddress(account.address);
    setShowNDA(true);
    return;
  }

  if (isAdmin(account.address)) {
    router.push("/admin");
  } else {
    router.push("/campaigns");
  }
}, [account, router]);

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
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-col justify-end w-1/2 relative overflow-hidden">

        {testimonials.map((t, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${t.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
              opacity: activeTestimonial === i ? 1 : 0,
              transition: "opacity 1s ease",
              zIndex: 0,
            }}
          />
        ))}

        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.80) 100%)",
            zIndex: 1,
          }}
        />

        <div style={{ position: "relative", zIndex: 2, padding: "48px" }}>
          <div style={{ position: "relative", minHeight: "170px", marginBottom: "24px" }}>
            {testimonials.map((t, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: activeTestimonial === i ? 1 : 0,
                  transform: activeTestimonial === i ? "translateY(0)" : "translateY(12px)",
                  transition: "opacity 0.7s ease, transform 0.7s ease",
                  pointerEvents: activeTestimonial === i ? "auto" : "none",
                }}
              >
                <div style={{
                  fontSize: "52px", lineHeight: 1, color: "#60a5fa",
                  fontFamily: "Georgia, serif", marginBottom: "6px",
                }}>
                  "
                </div>
                <p style={{
                  color: "#f1f5f9", fontSize: "16px", lineHeight: 1.8,
                  fontWeight: 400, marginBottom: "18px",
                  textShadow: "0 1px 6px rgba(0,0,0,0.6)",
                }}>
                  {t.quote}
                </p>
                <div>
                  <div style={{ color: "#cbd5e1", fontSize: "13px", marginTop: "2px" }}>
                    {t.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                style={{
                  width: activeTestimonial === i ? 28 : 8,
                  height: 8,
                  borderRadius: "999px",
                  background: activeTestimonial === i ? "#3b82f6" : "rgba(255,255,255,0.35)",
                  border: "none",
                  cursor: "pointer",
                  transition: "width 0.4s ease, background 0.4s ease",
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      

      <div
        className="flex-1 flex items-center justify-center px-8 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #e8f0fe 0%, #f0f4ff 40%, #e8f0fe 100%)",
        }}
      >
        <div style={{
          position: "absolute", top: "-100px", right: "-80px",
          width: "380px", height: "380px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,130,246,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
          filter: "blur(40px)",
        }} />
        <div style={{
          position: "absolute", bottom: "-80px", left: "-60px",
          width: "320px", height: "320px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
          filter: "blur(40px)",
        }} />
        <div style={{
          position: "absolute", top: "45%", left: "30%",
          width: "200px", height: "200px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(147,197,253,0.2) 0%, transparent 70%)",
          pointerEvents: "none",
          filter: "blur(30px)",
        }} />

        <div
          style={{
            position: "relative", zIndex: 1,
            background: "rgba(255,255,255,0.55)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.75)",
            borderRadius: "28px",
            padding: "52px 44px",
            boxShadow: "0 8px 40px rgba(99,130,246,0.1), 0 1px 0 rgba(255,255,255,0.8) inset",
            width: "100%",
            maxWidth: "420px",
            textAlign: "center",
          }}
        >
          <img
            src={agapayLogo.src}
            alt="Agapay Logo"
            style={{ width: "120px", height: "auto", margin: "0 auto 16px" }}
            draggable={false}
          />

          <h1 style={{
            fontSize: "32px", fontWeight: 800,
            color: "#1e3a5f", marginBottom: "12px", letterSpacing: "-0.02em",
          }}>
            AgaPay
          </h1>

          <p style={{
            fontSize: "15px", color: "#64748b",
            lineHeight: 1.7, fontWeight: 400, marginBottom: "32px",
          }}>
            Agapay connects generous hearts with meaningful causes. Using secure
            blockchain technology, we ensure every cent of your contribution
            reaches those who need it most.
          </p>

          <div style={{
            height: "1px",
            background: "linear-gradient(to right, transparent, rgba(99,130,246,0.3), transparent)",
            marginBottom: "32px",
          }} />

          <ConnectButton
            connectButton={{ label: "Sign in" }}
            accountAbstraction={{
              chain: arcTestnet,
              sponsorGas: true,
            }}
            client={client}
            connectModal={{
              showThirdwebBranding: false, size: "compact",
            }}
            wallets={wallets}
            detailsModal={{ hideSwitchWallet: true }}
            theme={lightTheme({
              colors: { primaryButtonBg: "hsl(224, 76%, 48%)" },
            })}
          />

          <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "20px" }}>
            Secured by blockchain
          </p>
        </div>
      </div>

      <NDAModal isOpen={showNDA} onAccept={handleAcceptNDA} />
    </div>
  );
}