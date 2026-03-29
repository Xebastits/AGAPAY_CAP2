'use client';

import { client } from "@/app/client";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { getContract, prepareContractCall, sendTransaction } from "thirdweb";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { useNetwork } from "@/app/constants/network";
import { getDb } from "@/app/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function CampaignPage() {
    const { campaignAddress } = useParams();
    const { selectedChain } = useNetwork();
    const account = useActiveAccount();

    const [donationAmount, setDonationAmount] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [campaignImage, setCampaignImage] = useState("");
    const [Name, setName] = useState("");

    // NEW STATE
    const [creator, setCreator] = useState<string>("");
    const [createdAt, setCreatedAt] = useState<number | null>(null);

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

    // FETCH FIREBASE DATA
    useEffect(() => {
        if (!name) return;
        const db = getDb();
        if (!db) return;

        getDocs(query(collection(db, "campaigns"), where("name", "==", name)))
            .then((snap) => {
                if (!snap.empty) {
                    const data = snap.docs[0].data();
                    setName(data.name || name);
                    setCampaignImage(data.imageUrl || "");
                    setCreator(data.creator || "");
                    setCreatedAt(data.createdAt || null);
                }
            })
            .catch(console.error);
    }, [name]);

    const handleDonate = async () => {
        if (!account) return alert("Please connect your wallet first.");
        if (!donationAmount) return alert("Enter an amount.");

        setIsProcessing(true);
        try {
            const transaction = prepareContractCall({
                contract,
                method: "function donate()",
                params: [],
                value: BigInt(donationAmount)
            });
            await sendTransaction({ transaction, account });
            alert("Donation Successful!");
            setDonationAmount("");
        } catch (e) {
            console.error(e);
            alert("Transaction Failed");
        } finally {
            setIsProcessing(false);
        }
    };

    const formatAddress = (addr?: string) => {
        if (!addr) return "—";
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const formatDate = (timestamp?: number | null) => {
        if (!timestamp) return "—";
        return new Date(timestamp).toLocaleDateString();
    };

    if (loadingName) return <div className="p-10">Loading Campaign...</div>;

    return (
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
                    <h1 className="text-3xl font-bold text-slate-900">
                        {name}
                    </h1>
                    <p className="text-xs text-slate-500 break-all">
                        {campaignAddress}
                    </p>
                </div>

                <div className="border rounded-lg px-4 py-3 shadow-sm flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-m text-slate-700">
                            Check Campaign Online
                        </span>
                        <span className="text-xs text-slate-400">
                            View on Arc blockchain explorer
                        </span>
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
                        <span className="text-slate-500">Created</span>
                        <span>{formatDate(createdAt)}</span>
                    </div>

                </div>

                {/* CONTENT */}
                <div className="grid md:grid-cols-3 gap-8">

                    {/* LEFT */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-md border">
                            <h3 className="text-lg font-bold mb-4">
                                About this Campaign
                            </h3>
                            <p className="text-slate-600 whitespace-pre-wrap">
                                {description}
                            </p>
                        </div>
                    </div>

                    {/* RIGHT */}
                    <div className="space-y-6">

                        {/* STATS */}
                        <div className="bg-white p-6 rounded-xl shadow-md border">
                            <p className="text-3xl font-extrabold text-blue-600">
                                ₱{balance?.toString() || "0"}
                            </p>
                            <p className="text-sm text-slate-500">
                                raised of ₱{goal?.toString() || "0"}
                            </p>

                            <div className="mt-4 w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-600"
                                    style={{
                                        width: goal && balance
                                            ? `${Math.min(
                                                (Number(balance) / Number(goal)) * 100,
                                                100
                                            )}%`
                                            : "0%"
                                    }}
                                />
                            </div>
                        </div>

                        {/* DONATE */}
                        <div className="bg-white p-6 rounded-xl shadow-md border">
                            <h3 className="text-lg font-bold mb-4">Donate</h3>

                            <input
                                type="number"
                                value={donationAmount}
                                onChange={(e) => setDonationAmount(e.target.value)}
                                placeholder="Enter amount"
                                disabled={isProcessing}
                                className="w-full p-3 border rounded-lg text-lg mb-4"
                            />

                            <button
                                onClick={handleDonate}
                                disabled={isProcessing}
                                className={`w-full py-3 rounded-lg text-white font-bold transition ${isProcessing
                                    ? "bg-slate-400"
                                    : "bg-blue-600 hover:bg-blue-700"
                                    }`}
                            >
                                {isProcessing ? "Processing..." : "Donate Funds"}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}