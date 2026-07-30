'use client';

import { client } from "@/app/client";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { getContract, prepareContractCall, sendTransaction } from "thirdweb";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { useNetwork } from "@/app/constants/network";
import { getDb } from "@/app/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { formatNumberWithCommas, stripCommas } from "@/app/lib/format";

const formatBlockchainDate = (timestamp?: bigint) =>
    timestamp
        ? new Date(Number(timestamp) * 1000).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "numeric",
              hour12: true,
          })
        : "—";

// ── Simple Modal Component ──
type ModalProps = {
    isOpen: boolean;
    type: "success" | "error" | "warning";
    title: string;
    message: string;
    onClose: () => void;
};

function Modal({ isOpen, type, title, message, onClose }: ModalProps) {
    if (!isOpen) return null;

    const styles = {
        success: {
            icon: "✓",
            iconBg: "bg-green-100 text-green-600",
            btn: "bg-green-600 hover:bg-green-700",
        },
        error: {
            icon: "✕",
            iconBg: "bg-red-100 text-red-600",
            btn: "bg-red-600 hover:bg-red-700",
        },
        warning: {
            icon: "!",
            iconBg: "bg-yellow-100 text-yellow-600",
            btn: "bg-blue-600 hover:bg-blue-700",
        },
    }[type];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center animate-fade-in">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 ${styles.iconBg}`}>
                    {styles.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm mb-6">{message}</p>
                <button
                    onClick={onClose}
                    className={`w-full py-2.5 rounded-xl text-white font-bold transition ${styles.btn}`}
                >
                    Got it
                </button>
            </div>
        </div>
    );
}

export default function CampaignPage() {
    const { campaignAddress } = useParams();
    const { selectedChain } = useNetwork();
    const account = useActiveAccount();

    const [donationAmount, setDonationAmount] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [campaignImage, setCampaignImage] = useState("");
    const [Name, setName] = useState("");
    const [creator, setCreator] = useState<string>("");

    // Modal state
    const [modal, setModal] = useState<{
        isOpen: boolean;
        type: "success" | "error" | "warning";
        title: string;
        message: string;
    }>({ isOpen: false, type: "success", title: "", message: "" });

    const showModal = (type: "success" | "error" | "warning", title: string, message: string) => {
        setModal({ isOpen: true, type, title, message });
    };

    const closeModal = () => setModal(m => ({ ...m, isOpen: false }));

    const contract = getContract({
        client,
        chain: selectedChain,
        address: campaignAddress as string
    });

    const { data: name, isLoading: loadingName } = useReadContract({
        contract,
        method: "function name() view returns (string)",
        params: []
    });

    const { data: description } = useReadContract({
        contract,
        method: "function description() view returns (string)",
        params: []
    });

    const { data: goal } = useReadContract({
        contract,
        method: "function goal() view returns (uint256)",
        params: []
    });

    const { data: balance } = useReadContract({
        contract,
        method: "function getContractBalance() view returns (uint256)",
        params: []
    });

    const { data: creationTime } = useReadContract({
        contract,
        method: "function creationTime() view returns (uint256)",
        params: []
    });

    const { data: deadline } = useReadContract({
        contract,
        method: "function deadline() view returns (uint256)",
        params: []
    });

    // ── ADD: read on-chain state ──
    const { data: state } = useReadContract({
        contract,
        method: "function state() view returns (uint8)",
        params: []
    });

    useEffect(() => {
        if (!name) return;
        const db = getDb();
        if (!db) return;

        getDocs(query(collection(db, "campaigns"), where("name", "==", name)))
            .then((snap) => {
                if (!snap.empty) {
                    const data = snap.docs[0].data();
                    setName(data.fullName || "");
                    setCampaignImage(data.imageUrl || "");
                    setCreator(data.creator || "");
                }
            })
            .catch(console.error);
    }, [name]);

    // ── ADD: compute failed status ──
    const now = Date.now() / 1000;
    const isExpired = deadline ? now >= Number(deadline) : false;
    const isGoalMet = typeof balance === "bigint" && typeof goal === "bigint" && balance >= goal;
    const isFailed = state === 2 || (state === 0 && isExpired && !isGoalMet);

    const handleDonate = async () => {
        if (!account) return showModal("warning", "Wallet Not Connected", "Please connect your wallet first before donating.");
        if (!donationAmount) return showModal("warning", "No Amount Entered", "Please enter a donation amount to continue.");

        setIsProcessing(true);
        try {
            const transaction = prepareContractCall({
                contract,
                method: "function donate()",
                params: [],
                value: BigInt(donationAmount)
            });
            await sendTransaction({ transaction, account });
            setDonationAmount("");
            showModal("success", "Donation Successful!", "Thank you for your generosity. Your contribution has been recorded!");
        } catch (e) {
            console.error(e);
            showModal("error", "Transaction Failed", "Something went wrong with your donation. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const formatAddress = (addr?: string) => {
        if (!addr) return "—";
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    if (loadingName) return <div className="p-10">Loading Campaign...</div>;

    return (
        <>
            <Modal
                isOpen={modal.isOpen}
                type={modal.type}
                title={modal.title}
                message={modal.message}
                onClose={closeModal}
            />

            <div className="bg-slate-50 min-h-screen py-12 px-4">
                <div className="max-w-5xl mx-auto space-y-6">

                    {/* IMAGE */}
                    <div className="w-full overflow-hidden rounded-xl shadow-md border bg-white">
                        <div className="w-full h-[220px] md:h-[280px] lg:h-[320px] bg-slate-100">
                            {campaignImage ? (
                                <img
                                    src={campaignImage}
                                    alt="campaign"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-slate-200" />
                            )}
                        </div>
                    </div>

                    {/* TITLE */}
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">{name}</h1>
                        <p className="text-xs text-slate-500 break-all">{campaignAddress}</p>
                    </div>

                    {/* EXPLORER LINK */}
                    <div className="border rounded-lg px-4 py-3 shadow-sm flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-m text-slate-700">Check Campaign Online</span>
                            <span className="text-xs text-slate-400">View on Arc blockchain explorer</span>
                        </div>
                        <a
                            href={`https://testnet.arcscan.app/address/${campaignAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 font-mono text-sm hover:underline"
                        >
                            {formatAddress(campaignAddress as string)}
                        </a>
                    </div>

                    {/* INFO CARD */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border text-sm space-y-2">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Creator</span>
                            <span className="text-slate-800">
                                {Name
                                    ? `${Name} (${formatAddress(creator)})`
                                    : formatAddress(creator || account?.address)
                                }
                            </span>
                        </div>
                        <div className="flex justify-between">
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Deadline</span>
                            <span className="text-red-500 font-medium">{formatBlockchainDate(deadline)}</span>
                        </div>
                    </div>

                    {/* CONTENT */}
                    <div className="grid md:grid-cols-3 gap-8">

                        {/* LEFT */}
                        <div className="md:col-span-2 space-y-6">
                            <div className="bg-white p-6 rounded-xl shadow-md border">
                                <h3 className="text-lg font-bold mb-4">About this Campaign</h3>
                                <p className="text-slate-600 whitespace-pre-wrap">{description}</p>
                            </div>
                        </div>

                        {/* RIGHT */}
                        <div className="space-y-6">

                            {/* STATS */}
                            <div className="bg-white p-6 rounded-xl shadow-md border">
                                <p className="text-3xl font-extrabold text-blue-600">
                                    ₱{formatNumberWithCommas(balance?.toString() || "0")}
                                </p>
                                <p className="text-sm text-slate-500">
                                    raised of ₱{formatNumberWithCommas(goal?.toString() || "0")}
                                </p>
                                <div className="mt-4 w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600"
                                        style={{
                                            width: goal && balance
                                                ? `${Math.min((Number(balance) / Number(goal)) * 100, 100)}%`
                                                : "0%"
                                        }}
                                    />
                                </div>
                            </div>

                            {/* DONATE — hidden when campaign is failed */}
                            {isFailed ? (
                                <div className="bg-red-50 border border-red-200 p-6 rounded-xl shadow-md text-center">
                                    <p className="text-red-600 font-bold text-m">This campaign has ended</p>
                                    <p className="text-red-400 text-xs mt-1">Donations are no longer accepted</p>
                                </div>
                            ) : (
                                <div className="bg-white p-6 rounded-xl shadow-md border">
                                    <h3 className="text-lg font-bold mb-4">Donate</h3>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={formatNumberWithCommas(donationAmount)}
                                        onChange={(e) => setDonationAmount(stripCommas(e.target.value))}
                                        placeholder="Enter amount"
                                        disabled={isProcessing}
                                        className="w-full p-3 border rounded-lg text-lg mb-4"
                                    />
                                    <button
                                        onClick={handleDonate}
                                        disabled={isProcessing}
                                        className={`w-full py-3 rounded-lg text-white font-bold transition ${
                                            isProcessing ? "bg-slate-400" : "bg-blue-600 hover:bg-blue-700"
                                        }`}
                                    >
                                        {isProcessing ? "Processing..." : "Donate Funds"}
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}