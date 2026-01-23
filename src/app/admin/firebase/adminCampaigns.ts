import { db } from "@/app/lib/firebase";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";

export interface Campaign {
  id: string;
  name: string;
  description: string;
  goal: string;
  deadline: number;
  idImageUrl: string;
  status: string;
  creator: string;
  fullName?: string;
  imageUrl?: string;
  createdAt?: number;
}

export const getPendingCampaigns = async (): Promise<Campaign[]> => {
  const q = query(collection(db, "campaigns"), where("status", "==", "pending"));
  const snapshot = await getDocs(q);

  const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign));

  // Sort Newest First
  list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return list;
};

export const rejectCampaignById = async (
  campaignId: string,
  reason: string,
  details: string
) => {
  await updateDoc(doc(db, "campaigns", campaignId), {
    status: "rejected",
    rejectionReason: reason,
    rejectionDetails: details || "",
    rejectedAt: Date.now(),
  });
};

export const approveCampaignById = async (
  campaignId: string,
  contractAddress: string
) => {
  await updateDoc(doc(db, "campaigns", campaignId), {
    status: "approved",
    campaignAddress: contractAddress,
    deployedAt: Date.now(),
  });
};
