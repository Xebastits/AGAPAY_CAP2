'use client';

import { client } from "@/app/client";
import { useParams } from "next/navigation";
import { useState } from "react";
import { getContract, prepareContractCall, sendTransaction } from "thirdweb";
import { useActiveAccount, useReadContract} from "thirdweb/react";
import { useNetwork } from '@/app/constants/network';

export default function CampaignPage() {
    const { campaignAddress } = useParams();
    const { selectedChain } = useNetwork();
    const account = useActiveAccount();
    
    // State
    const [donationAmount, setDonationAmount] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);
    const contract = getContract({ 
        client, 
        chain: selectedChain, 
        address: campaignAddress as string 
    });

    // --- 3. READ DATA (Simplified) ---
    const { data: name, isLoading: loadingName } = useReadContract({ contract, method: "function name() view returns (string)", params: [] });
    const { data: description } = useReadContract({ contract, method: "function description() view returns (string)", params: [] });
    const { data: goal } = useReadContract({ contract, method: "function goal() view returns (uint256)", params: [] });
    const { data: balance } = useReadContract({ contract, method: "function getContractBalance() view returns (uint256)", params: [] });

    // --- 4. SIMPLE ACTIONS ---
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
            // Optional: window.location.reload(); 
        } catch (e) {
            console.error(e);
            alert("Transaction Failed (Check console for details)");
        } finally {
            setIsProcessing(false);
        }
    };

    if (loadingName) return <div className="p-10">Loading Campaign...</div>;

    // --- 5. RENDER FRONTEND ---
    return (
        <div className="mx-auto max-w-5xl px-4 py-10">
            {/* HEADER */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-slate-900 mb-2">{name}</h1>
                <p className="text-sm text-slate-500 break-all font-mono">Contract: {campaignAddress}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* LEFT: Description */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold mb-4 border-b pb-2">About this Campaign</h3>
                        <p className="text-slate-600 whitespace-pre-wrap">{description}</p>
                    </div>
                </div>

                {/* RIGHT: Stats & Donate */}
                <div className="flex flex-col gap-6">
                    {/* STATS CARD */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                        <div className="mb-2">
                            <p className="text-3xl font-extrabold text-blue-600">
                                ₱{balance?.toString() || "0"}
                            </p>
                            <p className="text-sm text-slate-500">
                                raised of ₱{goal?.toString() || "0"} goal
                            </p>
                        </div>
                    </div>

                    {/* DONATE CARD */}
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 shadow-sm">
                        <h3 className="text-lg font-bold text-blue-900 mb-4">Donate Now</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Amount</label>
                                <input 
                                    type="number" 
                                    value={donationAmount} 
                                    onChange={(e) => setDonationAmount(e.target.value)} 
                                    placeholder="Amount" 
                                    disabled={isProcessing} 
                                    className="w-full p-3 border rounded text-lg font-bold" 
                                />
                            </div>
                            
                            <button 
                                onClick={handleDonate} 
                                disabled={isProcessing} 
                                className={`w-full py-3 text-lg font-bold rounded text-white transition-all ${
                                    isProcessing ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
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