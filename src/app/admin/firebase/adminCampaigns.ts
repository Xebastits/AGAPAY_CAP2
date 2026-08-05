import { getDb } from "@/app/lib/firebase";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";

export interface Campaign {
  id: string;
  name: string;
  description: string;
  goal: string;
  deadline: number;
  idImages?: string[];
  requirementImages?: string[];
  barangayCertificates?: string[];
  solicitationPermits?: string[];
  status: string;
  creator: string;
  fullName?: string;
  imageUrl?: string;
  createdAt?: number;
  rejectionReason?: string;
  rejectionDetails?: string;
  changesRequestedAt?: number;
}

export const getPendingCampaigns = async (): Promise<Campaign[]> => {
  const db = getDb();
  if (!db) throw new Error("Firestore not available on server");
  
  const q = query(collection(db, "campaigns"), where("status", "==", "pending"));
  const snapshot = await getDocs(q);

  const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign));

  // Sort Newest First
  list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return list;
};

// Campaigns the admin has sent back to the beneficiary for changes. These sit
// on the beneficiary's dashboard (not the admin queue) until they fix and
// resubmit — at which point status flips back to "pending" automatically.
export const getChangesRequestedCampaigns = async (): Promise<Campaign[]> => {
  const db = getDb();
  if (!db) throw new Error("Firestore not available on server");

  const q = query(collection(db, "campaigns"), where("status", "==", "changes_requested"));
  const snapshot = await getDocs(q);

  const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign));

  list.sort((a, b) => (b.changesRequestedAt || 0) - (a.changesRequestedAt || 0));

  return list;
};

export const rejectCampaignById = async (
  campaignId: string,
  reason: string,
  details: string
) => {
  const db = getDb();
  if (!db) throw new Error("Firestore not available");
  
  await updateDoc(doc(db, "campaigns", campaignId), {
    status: "rejected",
    rejectionReason: reason,
    rejectionDetails: details || "",
    rejectedAt: Date.now(),
  });
};

// "Soft" rejection: sends the campaign back to the beneficiary's dashboard
// (status: "changes_requested") with a note on what to fix, instead of
// closing it out entirely. It disappears from the admin's pending queue and
// only reappears there once the beneficiary resubmits.
export const requestCampaignChangesById = async (
  campaignId: string,
  reason: string,
  details: string
) => {
  const db = getDb();
  if (!db) throw new Error("Firestore not available");

  await updateDoc(doc(db, "campaigns", campaignId), {
    status: "changes_requested",
    rejectionReason: reason,
    rejectionDetails: details || "",
    changesRequestedAt: Date.now(),
  });
};

export const approveCampaignById = async (
  campaignId: string,
  contractAddress: string
) => {
  const db = getDb();
  if (!db) throw new Error("Firestore not available");
  
  await updateDoc(doc(db, "campaigns", campaignId), {
    status: "approved",
    campaignAddress: contractAddress,
    deployedAt: Date.now(),
  });
};
