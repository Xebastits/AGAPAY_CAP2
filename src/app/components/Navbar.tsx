'use client';
import { useState, useEffect } from "react";
import { client } from "@/app/client";
import Link from "next/link";
import { lightTheme, useActiveAccount, useProfiles } from "thirdweb/react";
import { ConnectButton } from "./ConnectButton";
import Image from 'next/image';
import agapayLogo from '../assets/favicon.png';
import { usePathname } from "next/navigation";
import { isAdmin } from "../constants/constant";
import { inAppWallet } from "thirdweb/wallets";
import { arcTestnet } from "thirdweb/chains";
import { AGAPAY_TOKEN_ADDRESS } from "../constants/constant";
import { useActiveWallet } from "thirdweb/react";
import { AccountProvider, AccountAvatar } from "thirdweb/react";

const GOOGLE_AVATAR_URL = "https://authjs.dev/img/providers/google.svg";

const wallets = [
    inAppWallet({
        auth: {
            options: ["google"],
        },
    }),
];

const Navbar = () => {

    const wallet = useActiveWallet();
    const [email, setEmail] = useState<string | null>(null);
    const account = useActiveAccount();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    //



    if (pathname === "/") return null;

    return (
        <nav className="bg-white border-b-2 border-b-slate-300">
            <div className="mx-auto max-w-8xl px-2 sm:px-6 lg:px-8">
                <div className="relative flex h-16 items-center justify-between">

                    {/* --- MOBILE MENU BUTTON (Hamburger) --- */}
                    <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            type="button"
                            className="relative inline-flex items-center justify-center rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                        >
                            {/* Icon when menu is closed (Hamburger) */}
                            {!isOpen ? (
                                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                </svg>
                            ) : (
                                /* Icon when menu is open (X) */
                                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* --- LOGO & DESKTOP LINKS --- */}
                    <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                        <div className="flex flex-shrink-0 items-center">
                            <Image
                                src={agapayLogo}
                                alt="Agapay"
                                width={32}
                                height={32}
                                style={{
                                    filter: "drop-shadow(0px 0px 24px #a726a9a8)",
                                }}
                                draggable="false"
                            />
                        </div>
                        <span className="hidden sm:block px-3 py-1 text-xl font-bold text-slate-700">
                            Agapay
                        </span>

                        {/* Desktop Menu (Hidden on Mobile) */}
                        <div className="hidden sm:ml-6 sm:block">
                            <div className="flex space-x-4">
                                <Link href={'/campaigns'}>
                                    <p className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors">
                                        Campaigns
                                    </p>
                                </Link>
                                {/* <Link href={'/audit'}>
                                    <p className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors">
                                        Public Audit
                                    </p>
                                </Link> */}

                                {account && !isAdmin(account.address) && (
                                    <Link href={`/dashboard/${account?.address}`}>
                                        <p className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors ">
                                            My Dashboard
                                        </p>
                                    </Link>
                                )}

                                {account && isAdmin(account.address) && (
                                    <Link href="/admin">
                                        <p className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors">
                                            Admin Panel
                                        </p>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* --- CONNECT BUTTON (Always Visible) --- */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                        <ConnectButton
                            client={client}
                            detailsButton={{
                                
                                // displayBalanceToken: {
                                //     [arcTestnet.id]: AGAPAY_TOKEN_ADDRESS,
                                // },
                                showBalanceInFiat: 'USD',
                                connectedAccountAvatarUrl: GOOGLE_AVATAR_URL,
                                connectedAccountName: email || undefined,
                            }}
                            theme={lightTheme()}
                            connectButton={{
                                label: "Sign in",
                            }}
                            accountAbstraction={{
                                chain: arcTestnet,
                                sponsorGas: true,
                            }}
                            connectModal={{
                                showThirdwebBranding: false, size: "compact",
                            }}
                            wallets={wallets}

                        />
                    </div>
                </div>
            </div>

            { }
            {isOpen && (
                <div className="sm:hidden border-t border-slate-200 bg-slate-50" id="mobile-menu">
                    <div className="space-y-1 px-2 pb-3 pt-2">
                        <Link href={'/campaigns'} onClick={() => setIsOpen(false)}>
                            <p className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-200">
                                Campaigns
                            </p>
                        </Link>

                        {account && !isAdmin(account.address) && (
                            <Link href={`/dashboard/${account?.address}`} onClick={() => setIsOpen(false)}>
                                <p className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-200">
                                    My Dashboard
                                </p>
                            </Link>
                        )}

                        {account && isAdmin(account.address) && (
                            <Link href="/admin" onClick={() => setIsOpen(false)}>
                                <p className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-200">
                                    Admin Panel
                                </p>
                            </Link>
                        )}
                                                    {/* <Link href="/audit" onClick={() => setIsOpen(false)}>
                                <p className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-200">
                                    Public Audit
                                </p>
                            </Link> */}
                    </div>
                </div>
            )}
        </nav>
    )
};

export default Navbar;