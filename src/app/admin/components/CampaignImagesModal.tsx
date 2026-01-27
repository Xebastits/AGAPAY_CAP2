"use client";

import Image from "next/image";

interface CampaignImagesModalProps {
  open: boolean;
  onClose: () => void;
  images: {
    campaignImage?: string;
    idImage?: string;
    requirementImage?: string;
    barangayCertificate?: string;
    solicitationPermit?: string;
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
              Review submitted documents to verify the legitimacy of this campaign.
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

          {images?.idImage && (
            <ImageCard title="Govt. ID Image" src={images.idImage} />
          )}

          {images?.requirementImage && (
            <ImageCard title="Requirement / Medical Image" src={images.requirementImage} />
          )}

          {images?.barangayCertificate && (
            <ImageCard title="Barangay Certificate" src={images.barangayCertificate} />
          )}

          {images?.solicitationPermit && (
            <ImageCard title="DSWD Solicitation Permit" src={images.solicitationPermit} />
          )}

        </div>
      </div>
    </div>
  );
};

const ImageCard = ({
  title,
  src,
}: {
  title: string;
  src: string;
}) => {
  return (
    <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
      <div className="flex items-center justify-between px-3 pt-3">
        <p className="font-bold text-sm text-slate-700">{title}</p>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold text-blue-600 hover:underline"
        >
          Open
        </a>
      </div>

      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block w-full h-64 p-2 cursor-zoom-in"
      >
        <Image
          src={src}
          alt={title}
          fill
          className="object-contain"
        />
      </a>
    </div>
  );
};
