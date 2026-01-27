'use client';

import { client } from "@/app/client";
import Link from "next/link";
import Image from "next/image";
import { getContract } from "thirdweb";
import { useReadContract, useActiveAccount } from "thirdweb/react";
import { prepareContractCall, sendTransaction } from "thirdweb";
import { useState, useEffect, useMemo, useCallback } from "react";
import { db } from "@/app/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { arcTestnet } from "thirdweb/chains";

type CampaignCardProps = {
    campaignAddress: string;
    showEmergencyFirst?: boolean;
    creationTime?: bigint;
    imageUrl?: string;
};

// Simple utility - kept outside to avoid recreation
const formatDate = (timestamp?: bigint) =>
    timestamp ? new Date(Number(timestamp) * 1000).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: 'numeric', hour12: true
    }) : "";

export const MyCampaignCard: React.FC<CampaignCardProps> = ({
    campaignAddress,
    showEmergencyFirst = false,
    creationTime,
    imageUrl,
}) => {
    const account = useActiveAccount();
    const [firebaseImage, setFirebaseImage] = useState("");
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [statusModal, setStatusModal] = useState<{
        isOpen: boolean;
        type: 'success' | 'error';
        title: string;
        message: string;
        shouldReload?: boolean;
    }>({ isOpen: false, type: 'success', title: '', message: '' });


    const contract = useMemo(() => getContract({
        client,
        chain: arcTestnet,
        address: campaignAddress,
    }), [campaignAddress]);


    const { data: campaignName } = useReadContract({ contract, method: "function name() view returns (string)", params: [] });
    const { data: campaignDescription } = useReadContract({ contract, method: "function description() view returns (string)", params: [] });
    const { data: goal } = useReadContract({ contract, method: "function goal() view returns (uint256)", params: [] });
    const { data: balance, isLoading: isLoadingBalance } = useReadContract({ contract, method: "function getContractBalance() view returns (uint256)", params: [] });
    const { data: owner } = useReadContract({ contract, method: "function owner() view returns (address)", params: [] });
    const { data: state } = useReadContract({ contract, method: "function state() view returns (uint8)", params: [] });
    const { data: deadline } = useReadContract({ contract, method: "function deadline() view returns (uint256)", params: [] });

    // Computed values
    const stats = useMemo(() => {
        const displayBalance = balance?.toString() ?? "0";
        const displayGoal = goal?.toString() ?? "0";
        const percentage = goal && balance ? (Number(balance) / Number(goal)) * 100 : 0;
        const isSuccessful =
            state === 1 ||
            (state === 0 &&
                typeof balance === "bigint" &&
                typeof goal === "bigint" &&
                balance >= goal);

        const canWithdraw =
            owner === account?.address &&
            isSuccessful &&
            balance &&
            balance > 0n;

        const isEmergency = `${campaignName} ${campaignDescription}`.toLowerCase().includes('emergency');

        return { displayBalance, displayGoal, percentage, isSuccessful, canWithdraw, isEmergency };
    }, [balance, goal, state, owner, account?.address, campaignName, campaignDescription]);

    // Firebase image fetch
    useEffect(() => {
        if (!campaignName) return;

        getDocs(query(collection(db, "campaigns"), where("name", "==", campaignName)))
            .then(snap => { if (!snap.empty) setFirebaseImage(snap.docs[0].data().imageUrl || ""); })
            .catch(console.error);
    }, [campaignName]);

    // Withdraw handler
    const handleWithdraw = useCallback(async () => {
        if (!account) return;
        setIsWithdrawing(true);

        try {
            await sendTransaction({
                transaction: prepareContractCall({ contract, method: "function withdraw()", params: [] }),
                account
            });
            setStatusModal({ isOpen: true, type: 'success', title: 'Withdrawal Successful!', message: 'Funds transferred.', shouldReload: true });
        } catch (e: any) {
            if (!e?.message?.includes("rejected")) {
                setStatusModal({ isOpen: true, type: 'error', title: 'Withdrawal Failed', message: 'Please try again.', shouldReload: false });
            }
        } finally {
            setIsWithdrawing(false);
        }
    }, [account, contract]);

    const closeModal = () => {
        if (statusModal.shouldReload) window.location.reload();
        setStatusModal(m => ({ ...m, isOpen: false }));
    };

    const finalImageUrl = imageUrl || firebaseImage;

    return (
        <>
            <div className="flex flex-col justify-between max-w-sm bg-white border border-slate-200 rounded-lg shadow relative h-full hover:shadow-lg transition-shadow overflow-hidden group">
                {/* Image */}
                <div className="h-48 w-full bg-slate-100 relative overflow-hidden">
                    {finalImageUrl ? (
                        <Image
                            src={finalImageUrl}
                            alt={campaignName || "Campaign"}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, 384px"
                            quality={40}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 text-sm font-bold">No Image</div>
                    )}
                    {showEmergencyFirst && stats.isEmergency && (
                        <span className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">Emergency</span>
                    )}
                </div>

                <div className="p-5 flex-1 flex flex-col">
                    <h5 className="mb-2 text-xl font-bold text-slate-900 line-clamp-1">{campaignName || "Loading..."}</h5>
                    <p className="text-sm text-slate-600 line-clamp-3">
                        {campaignDescription}
                    </p>
                    <div className="my-1 h-px w-full bg-slate-200" />
                    {/* Dates */}
                    <div className="mb-2 text-xs font-medium">
                        {creationTime && <p className="text-slate-400">Created: {formatDate(creationTime)}</p>}
                        {deadline && <p className="text-red-400">Deadline: {formatDate(deadline)}</p>}
                    </div>
                    {/* Progress / Success */}
                    {!isLoadingBalance && (
                        stats.isSuccessful ? (
                            <div className="mb-4 bg-green-100 border border-green-200 text-green-800 text-xs font-bold px-3 py-2 rounded text-center">
                                GOAL REACHED! (₱{stats.displayGoal})
                            </div>
                        ) : (
                            <div className="mb-4">
                                <div className="flex justify-between font-bold text-m mb-1.5 text-slate-600">
                                    <span>Raised: ₱{stats.displayBalance}</span>
                                    <span>Goal: ₱{stats.displayGoal}</span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${Math.min(stats.percentage, 100)}%` }} />
                                </div>
                                <p className="text-right mt-1 text-xs text-slate-500 font-medium">{stats.percentage.toFixed(0)}% Funded</p>
                            </div>
                        )
                    )}


                    <Link href={`/campaign/${campaignAddress}`} className="mt-auto">
                        <button className="w-full px-4 py-2.5 text-sm font-bold text-white bg-blue-700 rounded-lg hover:bg-slate-600 transition-colors">View Details</button>
                    </Link>

                    {stats.canWithdraw && (
                        <button onClick={handleWithdraw} disabled={isWithdrawing} className={`mt-3 w-full px-4 py-2.5 text-sm font-bold text-white rounded-lg ${isWithdrawing ? "bg-green-400" : "bg-green-600 hover:bg-green-700"}`}>
                            {isWithdrawing ? "Processing..." : "⚡ Withdraw Funds"}
                        </button>
                    )}
                </div>
            </div>

            {/* Modal */}
            {statusModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-lg shadow-2xl p-6 max-w-sm w-full">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto ${statusModal.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {statusModal.type === 'success' ? '✓' : '⚠'}
                        </div>
                        <h3 className="text-xl font-bold text-center mb-2">{statusModal.title}</h3>
                        <p className="text-center text-gray-600 mb-6">{statusModal.message}</p>
                        <button onClick={closeModal} className={`w-full py-2.5 rounded-lg font-bold text-white ${statusModal.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                            Okay
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};