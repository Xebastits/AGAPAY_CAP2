"use client";

import { DocumentImageGallery } from "./DocumentImageGallery";

interface CampaignImagesModalProps {
  open: boolean;
  onClose: () => void;
  images: {
    idImages?: string[];
    requirementImages?: string[];
    barangayCertificates?: string[];
    solicitationPermits?: string[];
  } | null;
}

export const CampaignImagesModal = ({
  open,
  onClose,
  images,
}: CampaignImagesModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-xl p-6 w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-xl text-slate-800">
              Verification Documents
            </h3>
            <p className="text-sm text-slate-500">
              Review submitted documents to verify the legitimacy of this campaign. Click any thumbnail to view it full size.
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg font-bold transition"
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <DocumentImageGallery title="Govt. ID" files={images?.idImages || []} />
          <DocumentImageGallery title="Requirement / Proof of Need" files={images?.requirementImages || []} />
          <DocumentImageGallery title="Barangay Certificate of Indigency" files={images?.barangayCertificates || []} />
          <DocumentImageGallery title="Public Solicitation Permit" files={images?.solicitationPermits || []} />

          {!images?.idImages?.length &&
            !images?.requirementImages?.length &&
            !images?.barangayCertificates?.length &&
            !images?.solicitationPermits?.length && (
              <p className="text-sm text-slate-400 col-span-full text-center py-8">
                No documents were submitted for this campaign.
              </p>
          )}

        </div>
      </div>
    </div>
  );
};
