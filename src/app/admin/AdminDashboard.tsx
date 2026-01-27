"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useActiveAccount, useReadContract, useSendTransaction } from "thirdweb/react";
import { getContract, prepareContractCall } from "thirdweb";
import { client } from "@/app/client";
import { CROWDFUNDING_FACTORY } from "@/app/constants/constant";
import { isAdmin } from "../constants/constant";
import { arcTestnet } from "thirdweb/chains";
import { useAdminGuard } from "../admin/hooks/useAdminGuard";
import Image from "next/image";
import Link from "next/link";
import { RejectCampaignModal } from "./components/RejectModal";
import { ApproveCampaignModal } from "./components/ApproveModal";
import { getPendingCampaigns, rejectCampaignById, approveCampaignById } from "./firebase/adminCampaigns";
import { CampaignImagesModal } from "./components/CampaignImagesModal";


interface Campaign {
    id: string;
    name: string;
    description: string;
    goal: string;
    deadline: number;
    status: string;
    creator: string;

    imageUrl?: string;
    idImageUrl?: string;
    requirementImageUrl?: string;
    barangayCertificateUrl?: string;
    solicitationPermitUrl?: string;

    fullName?: string;
    createdAt?: number;
}


const REJECTION_REASONS = [
    "ID image is blurry or unreadable",
    "Lacks sufficient campaign context",
    "Invalid or suspicious information",
    "Goal amount is unrealistic",
    "Duplicate or spam campaign",
    "Violates platform guidelines",
    "Other",
];

const ITEMS_PER_PAGE = 5;

export const AdminDashboard = () => {
    const account = useActiveAccount();
    const router = useRouter();

    const factoryContract = getContract({
        client: client,
        chain: arcTestnet,
        address: CROWDFUNDING_FACTORY,
    });

    const { mutate: sendTransaction, isPending: isDeploying } = useSendTransaction();

    const { data: liveCampaigns, refetch: refetchLive, isLoading: isLoadingLive } = useReadContract({
        contract: factoryContract,
        method: "function getAllCampaigns() view returns ((address campaignAddress, address owner, string name, uint256 creationTime)[])",
        params: []
    });

    const [isImagesModalOpen, setIsImagesModalOpen] = useState(false);
    const [selectedCampaignImages, setSelectedCampaignImages] = useState<any>(null);


    const [pendingCampaigns, setPendingCampaigns] = useState<Campaign[]>([]);
    const [loadingFirebase, setLoadingFirebase] = useState(true);

    const [pendingPage, setPendingPage] = useState(1);
    const [livePage, setLivePage] = useState(1);

    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectDetails, setRejectDetails] = useState("");
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [campaignToApprove, setCampaignToApprove] = useState<Campaign | null>(null);
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false, message: '', type: 'success'
    });

    const visiblePending = useMemo(() => {
        const start = (pendingPage - 1) * ITEMS_PER_PAGE;
        return pendingCampaigns.slice(start, start + ITEMS_PER_PAGE);
    }, [pendingCampaigns, pendingPage]);

    const totalPendingPages = Math.ceil(pendingCampaigns.length / ITEMS_PER_PAGE);

    const visibleLive = useMemo(() => {
        if (!liveCampaigns) return [];
        const reversed = [...liveCampaigns].reverse();
        const start = (livePage - 1) * ITEMS_PER_PAGE;
        return reversed.slice(start, start + ITEMS_PER_PAGE);
    }, [liveCampaigns, livePage]);

    const totalLivePages = liveCampaigns ? Math.ceil(liveCampaigns.length / ITEMS_PER_PAGE) : 0;

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
    };

    const isAllowed = useAdminGuard(account);

    const getCampaignImages = (campaign: any) => ({
        campaignImage: campaign.imageUrl,
        idImage: campaign.idImageUrl,
        requirementImage: campaign.requirementImageUrl,
        barangayCertificate: campaign.barangayCertificateUrl,
        solicitationPermit: campaign.solicitationPermitUrl,
    });

    useEffect(() => {
        if (!account) return;
        if (!isAdmin(account.address)) return;

        const fetchPendingCampaigns = async () => {
            try {
                const list = await getPendingCampaigns();
                setPendingCampaigns(list);
            } catch (e) {
                console.error("Firebase Error:", e);
                showToast("Error fetching pending campaigns.", "error");
            } finally {
                setLoadingFirebase(false);
            }
        };

        fetchPendingCampaigns();
    }, [account]);

    if (!isAllowed) return null;

    const openRejectModal = (id: string) => {
        setSelectedCampaignId(id);
        setRejectReason("");
        setIsRejectModalOpen(true);
    };

    const submitRejection = async () => {
        if (!selectedCampaignId || !rejectReason) {
            return showToast("Please select a rejection reason.", "error");
        }

        try {
            await rejectCampaignById(selectedCampaignId, rejectReason, rejectDetails);

            setPendingCampaigns(prev => prev.filter(c => c.id !== selectedCampaignId));
            setIsRejectModalOpen(false);
            setRejectReason("");
            setRejectDetails("");
            showToast("Campaign rejected successfully.", "success");
        } catch (e) {
            showToast("Error updating database.", "error");
        }
    };

    const openApproveModal = (campaign: Campaign) => {
        setCampaignToApprove(campaign);
        setIsApproveModalOpen(true);
    };

    const confirmApprove = async () => {
        if (!campaignToApprove) return;

        try {
            const transaction = prepareContractCall({
                contract: factoryContract,
                method: "function createCampaign(address _owner, string _name, string _description, uint256 _goal, uint256 _durationInDays)",
                params: [
                    campaignToApprove.creator,
                    campaignToApprove.name,
                    campaignToApprove.description,
                    BigInt(campaignToApprove.goal),
                    BigInt(campaignToApprove.deadline || 30),
                ],
            });

            sendTransaction(transaction, {
                onSuccess: async () => {
                    showToast("Deployed! Linking to database...", "success");

                    const result = await refetchLive();
                    const latestList = result.data || [];

                    const newDeployment = latestList.find(c =>
                        c.owner.toLowerCase() === campaignToApprove.creator.toLowerCase() &&
                        c.name === campaignToApprove.name
                    );

                    const contractAddress = newDeployment ? newDeployment.campaignAddress : "";

                    await approveCampaignById(campaignToApprove.id, contractAddress);

                    setPendingCampaigns(prev => prev.filter(c => c.id !== campaignToApprove.id));
                    setIsApproveModalOpen(false);
                    showToast(" Linked & Approved!", "success");
                },
                onError: (error) => {
                    console.error("Blockchain Error:", error);
                    setIsApproveModalOpen(false);
                    showToast(" Transaction Failed.", "error");
                },
            });
        } catch (e) {
            console.error(e);
            showToast("Error preparing transaction.", "error");
        }
    };

    return (
        /* Added 'overflow-x-hidden' to the main wrapper to prevent any accidental horizontal scroll on the entire page */
        <div className="min-h-screen bg-slate-50 p-6 relative overflow-x-hidden">

            {toast.show && (
                <div className={`fixed top-5 right-5 z-[100] px-6 py-4 rounded-lg shadow-2xl border-l-4 flex items-center gap-3 animate-slide-in bg-white ${toast.type === 'success' ? 'border-green-500 text-green-800' : 'border-red-500 text-red-800'}`}>
                    <span className="text-xl font-bold">{toast.type === 'success' ? 'Success:' : 'Error:'}</span>
                    <p className="">{toast.message}</p>
                </div>
            )}

            <div className="max-w-7xl mx-auto space-y-12">
                {/* HEADER */}
                <div className="flex justify-between items-end border-b pb-4">
                    {/* Add min-w-0 to allow the child to shrink */}
                    <div className="min-w-0">
                        <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
                        <p className="text-slate-500">Manage requests...</p>
                    </div>
                    {/* Add min-w-0 and shrink-0 to control the width */}
                    <div className="text-right max-w-[50%] min-w-0 flex-shrink-0">
                        <p className="text-sm font-bold text-slate-600">Logged in as:</p>
                        <p className="font-mono text-xs bg-slate-200 px-2 py-1 rounded truncate w-full inline-block">
                            {account?.address ?? "No account connected"}
                        </p>
                    </div>
                </div>

                {/* 1. PENDING REQUESTS */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-slate-700">Pending Requests</h2>
                            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">
                                {pendingCampaigns.length} Needs Review
                            </span>
                        </div>
                    </div>

                    {pendingCampaigns.length === 0 ? (
                        <div className="bg-white p-8 rounded-lg border border-dashed border-slate-300 text-center text-slate-400">
                            No pending requests at the moment.
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-6">
                                {visiblePending.map((campaign) => {
                                    const deadlineDate = campaign.createdAt
                                        ? new Date(campaign.createdAt + (campaign.deadline * 24 * 60 * 60 * 1000))
                                        : null;

                                    return (
                                        <div key={campaign.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-8 min-w-0">
                                            <div className="w-full lg:w-1/4 bg-slate-100 rounded-lg h-48 flex items-center justify-center overflow-hidden border relative group flex-shrink-0">
                                                {campaign.imageUrl ? (
                                                    <>
                                                        <Image
                                                            src={campaign.imageUrl}
                                                            alt="Campaign"
                                                            fill
                                                            className="object-cover"
                                                            sizes="(max-width: 768px) 100vw, 300px"
                                                        />


                                                    </>
                                                ) : (
                                                    <span className="text-xs text-slate-400">No Image</span>
                                                )}



                                            </div>


                                            <div className="flex-1 flex flex-col justify-between min-w-0">

                                                <div className="min-w-0">
                                                    <h3 className="text-xl font-bold text-slate-800 truncate">{campaign.name}</h3>
                                                    <div className="text-sm text-slate-500 mb-2 space-y-1">
                                                        <p className="break-all"><strong>Creator:</strong> {campaign.fullName ? `${campaign.fullName} (${campaign.creator})` : campaign.creator}</p>

                                                        <p><strong>Created:</strong> {campaign.createdAt ? new Date(campaign.createdAt).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true }) : 'N/A'}</p>

                                                        {deadlineDate && (
                                                            <p>
                                                                <strong>Deadline:</strong> {deadlineDate.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <p className="text-m text-slate-800 mt-2"><strong>Description:</strong></p>

                                                    {/* FIX: Moved background and padding to a wrapper div */}
                                                    <div className="bg-slate-50 p-3 rounded mb-4 w-full">
                                                        {/* FIX: Applied line-clamp and overflow-hidden just to the text */}
                                                        <p className="text-slate-600 break-words whitespace-normal line-clamp-3 overflow-hidden">
                                                            {campaign.description}
                                                        </p>
                                                    </div>


                                                    <div className="flex flex-wrap gap-2 text-sm font-medium text-slate-700 line">

                                                        {(`${campaign.name} ${campaign.description}`.toLowerCase().includes("emergency")) ? (
                                                            <span className="bg-red-500 text-white px-2 py-1 rounded border border-red-200 font-bold uppercase">
                                                                Emergency
                                                            </span>
                                                        ) : (
                                                            <span className="bg-blue-500 text-white px-2 py-1 rounded border border-slate-200 font-bold uppercase">
                                                                Normal
                                                            </span>
                                                        )}
                                                        <span className="bg-blue-50 px-2 py-1 rounded border border-blue-100">Goal: ₱{campaign.goal}</span>
                                                        <span className="bg-blue-50 px-2 py-1 rounded border border-blue-100">Duration: {campaign.deadline} Days</span>
                                                    </div>
                                                </div>

                                                <div className="flex w-full items-center justify-between mt-6 pt-6 border-t border-slate-100">

                                                    {/* LEFT SIDE: Utility Button */}
                                                    <button
                                                        onClick={() => {
                                                            setSelectedCampaignImages(getCampaignImages(campaign));
                                                            setIsImagesModalOpen(true);
                                                        }}
                                                        className="flex items-center gap-2 bg-slate-200 border-slate-300 hover:bg-slate-300 text-slate-700 px-4 py-2.5 rounded-lg font-semibold shadow-sm transition-all"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                        View All Images
                                                    </button>

                                                    {/* RIGHT SIDE: Action Buttons Grouped Together */}
                                                    <div className="flex items-center gap-3">
                                                        {/* Destructive Action */}
                                                        <button
                                                            onClick={() => openRejectModal(campaign.id)}
                                                            disabled={isDeploying}
                                                            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white border border-red-100 px-5 py-2.5 rounded-lg font-semibold shadow-sm transition-all disabled:opacity-50"
                                                        >
                                                            Reject
                                                        </button>

                                                        {/* Primary Action */}
                                                        <button
                                                            onClick={() => openApproveModal(campaign)}
                                                            disabled={isDeploying}
                                                            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-semibold shadow-md transition-all disabled:opacity-50"
                                                        >
                                                            {isDeploying ? (
                                                                "Processing..."
                                                            ) : (
                                                                <>

                                                                    Approve & Deploy
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>


                                            </div>
                                        </div>

                                    );
                                })}
                            </div>

                            {totalPendingPages > 1 && (
                                <div className="flex justify-center items-center gap-4 mt-6">
                                    <button
                                        onClick={() => setPendingPage(p => Math.max(1, p - 1))}
                                        disabled={pendingPage === 1}
                                        className="px-4 py-2 text-sm bg-white border rounded hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-sm font-bold text-slate-600">Page {pendingPage} of {totalPendingPages}</span>
                                    <button
                                        onClick={() => setPendingPage(p => Math.min(totalPendingPages, p + 1))}
                                        disabled={pendingPage === totalPendingPages}
                                        className="px-4 py-2 text-sm bg-white border rounded hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </section>




                {/* 2. LIVE ON BLOCKCHAIN - UPDATED TABLE */}
                <section className="pb-20">
                    <div className="flex items-center justify-between mb-6 pt-8 border-t">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-slate-700">Live on Blockchain</h2>
                            <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
                                {liveCampaigns?.length || 0} Active
                            </span>
                        </div>
                    </div>

                    {/* FIX: Replaced table-fixed with overflow-x-auto on the wrapper */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-x-auto w-full">
                        {/* FIX: Added min-w-[700px] so the table doesn't crush content on mobile, forcing scroll instead */}
                        <table className="w-full min-w-[700px] text-left text-sm text-slate-600">
                            <thead className="bg-slate-100 text-xs uppercase font-bold text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 w-1/3">Campaign Name</th>
                                    <th className="px-6 py-4 w-1/3">Contract Address</th>
                                    <th className="px-6 py-4 text-right w-1/3">Links</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoadingLive ? (
                                    <tr><td colSpan={3} className="px-6 py-8 text-center">Loading blockchain data...</td></tr>
                                ) : visibleLive.length > 0 ? (
                                    visibleLive.map((camp, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition">
                                            <td className="px-6 py-4 font-bold text-slate-800 truncate">
                                                {camp.name}
                                            </td>

                                            <td className="px-6 py-4 font-mono text-xs text-blue-600">
                                                <a
                                                    href={`https://testnet.arcscan.app/address/${camp.campaignAddress}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hover:underline flex items-center gap-1 w-full max-w-[200px]"
                                                >
                                                    <span className="truncate block w-full">
                                                        {camp.campaignAddress}
                                                    </span>
                                                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                                </a>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    href={`/campaign/${camp.campaignAddress}`}
                                                    className="text-slate-700 hover:text-blue-600 font-bold text-xs"
                                                >
                                                    View Page →
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400">No campaigns found on the blockchain.</td></tr>
                                )}
                            </tbody>
                        </table>

                        {/* Live Pagination Controls */}
                        {!isLoadingLive && totalLivePages > 1 && (
                            <div className="flex justify-center items-center gap-4 py-4 border-t bg-slate-50">
                                <button
                                    onClick={() => setLivePage(p => Math.max(1, p - 1))}
                                    disabled={livePage === 1}
                                    className="px-4 py-2 text-sm bg-white border rounded hover:bg-slate-100 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <span className="text-sm font-bold text-slate-600">Page {livePage} of {totalLivePages}</span>
                                <button
                                    onClick={() => setLivePage(p => Math.min(totalLivePages, p + 1))}
                                    disabled={livePage === totalLivePages}
                                    className="px-4 py-2 text-sm bg-white border rounded hover:bg-slate-100 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </section>

            </div>
            <RejectCampaignModal
                open={isRejectModalOpen}
                reasons={REJECTION_REASONS}
                rejectReason={rejectReason}
                rejectDetails={rejectDetails}
                onReasonChange={setRejectReason}
                onDetailsChange={setRejectDetails}
                onCancel={() => setIsRejectModalOpen(false)}
                onConfirm={submitRejection}
            />

            <ApproveCampaignModal
                open={isApproveModalOpen && !!campaignToApprove}
                campaignName={campaignToApprove?.name || ""}
                isDeploying={isDeploying}
                onCancel={() => setIsApproveModalOpen(false)}
                onConfirm={confirmApprove}
            />

            <CampaignImagesModal
                open={isImagesModalOpen}
                onClose={() => setIsImagesModalOpen(false)}
                images={selectedCampaignImages}
            />
        </div>
    );
};