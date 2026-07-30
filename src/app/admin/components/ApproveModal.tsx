"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { isImageFile } from "@/app/lib/fileUtils";

interface ApproveCampaignModalProps {
  open: boolean;
  campaignName: string;
  isDeploying: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  images?: {
    campaignImage?: string;
    idImages?: string[];
    requirementImages?: string[];
    barangayCertificates?: string[];
    solicitationPermits?: string[];
  };
}

const CHECKLIST_ITEMS = [
  {
    key: "idVerification" as const,
    label: "ID Verification",
    imageKey: "idImages" as const,
  },
  {
    key: "proofOfNeed" as const,
    label: "Proof of Need (Requirements)",
    imageKey: "requirementImages" as const,
  },
  {
    key: "barangayCertificate" as const,
    label: "Barangay Certificate of Indigency",
    imageKey: "barangayCertificates" as const,
  },
  {
    key: "solicitationPermit" as const,
    label: "Public Solicitation Permit",
    imageKey: "solicitationPermits" as const,
  },
];

type CheckKeys = "idVerification" | "proofOfNeed" | "barangayCertificate" | "solicitationPermit";

export const ApproveCampaignModal = ({
  open,
  campaignName,
  isDeploying,
  onCancel,
  onConfirm,
  images,
}: ApproveCampaignModalProps) => {
  const [checks, setChecks] = useState<Record<CheckKeys, boolean>>({
    idVerification: false,
    proofOfNeed: false,
    barangayCertificate: false,
    solicitationPermit: false,
  });

  // Which checklist item is currently previewed, and which file within it (an
  // item can hold multiple files) is showing in the right-hand viewer.
  const [activeKey, setActiveKey] = useState<CheckKeys | "campaignImage" | null>(null);
  const [activeLabel, setActiveLabel] = useState<string>("");
  const [activeFiles, setActiveFiles] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [confirmText, setConfirmText] = useState("");
  const [showFinalWarning, setShowFinalWarning] = useState(false);

  const allChecked = Object.values(checks).every(Boolean);
  const isConfirmed = confirmText.trim() === "CONFIRM";
  const canApprove = allChecked && isConfirmed;

  useEffect(() => {
    if (!open) {
      setChecks({
        idVerification: false,
        proofOfNeed: false,
        barangayCertificate: false,
        solicitationPermit: false,
      });
      setConfirmText("");
      setShowFinalWarning(false);
      setActiveKey(null);
      setActiveLabel("");
      setActiveFiles([]);
      setActiveIndex(0);
    }
  }, [open]);

  if (!open) return null;

  const handleItemClick = (key: CheckKeys | "campaignImage", files: string[] | undefined, label: string) => {
    if (!files || files.length === 0) return;
    setActiveKey(key);
    setActiveLabel(label);
    setActiveFiles(files);
    setActiveIndex(0);
  };

  const activeSrc = activeFiles[activeIndex];
  const activeIsImage = activeSrc ? isImageFile(activeSrc) : false;

  return (
    <>
      {/* MAIN MODAL */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden">

          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b">
            <h3 className="text-xl font-bold text-slate-800">Approve Campaign?</h3>
            <p className="text-sm text-slate-600 mt-1">
              Approving will deploy <strong>&quot;{campaignName}&quot;</strong> to the blockchain. This is irreversible.
            </p>
          </div>

          {/* Body — two columns */}
          <div className="flex flex-1 overflow-hidden">

            {/* LEFT: Checklist */}
            <div className="w-1/2 border-r flex flex-col overflow-y-auto p-5 gap-4">

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                <strong>Notice:</strong> Click each item to preview its document(s), then check it off.
              </div>

              <div className="space-y-2">
                {CHECKLIST_ITEMS.map((item) => {
                  const files = images?.[item.imageKey];
                  const isActive = activeKey === item.key;

                  return (
                    <div
                      key={item.key}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer
                        ${isActive ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}
                        ${!files?.length ? "opacity-50 cursor-not-allowed" : ""}
                      `}
                      onClick={() => handleItemClick(item.key, files, item.label)}
                    >
                      <input
                        type="checkbox"
                        checked={checks[item.key]}
                        disabled={!files?.length}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          setChecks((prev) => ({ ...prev, [item.key]: e.target.checked }))
                        }
                        className="w-4 h-4 accent-green-600 cursor-pointer flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{item.label}</p>
                        {!files?.length ? (
                          <p className="text-xs text-red-400">No document uploaded</p>
                        ) : (
                          <p className="text-xs text-slate-400">{files.length} file{files.length > 1 ? "s" : ""}</p>
                        )}
                      </div>
                      {!!files?.length && (
                        <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Campaign image preview thumbnail (single) */}
              {images?.campaignImage && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Campaign Image</p>
                  <div
                    className="relative w-full h-32 rounded-lg overflow-hidden border border-slate-200 cursor-pointer"
                    onClick={() => handleItemClick(
                      "campaignImage",
                      [images.campaignImage as string],
                      "Campaign Image"
                    )}
                  >
                    <Image src={images.campaignImage} alt="Campaign" fill className="object-cover" />
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Image Viewer */}
            <div className="w-1/2 flex flex-col items-center justify-center bg-slate-50 p-5">
              {activeSrc ? (
                <>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-3 text-center">
                    {activeLabel} {activeFiles.length > 1 && `(${activeIndex + 1}/${activeFiles.length})`}
                  </p>
                  <div className="relative w-full flex-1 min-h-[200px] rounded-lg overflow-hidden border border-slate-200 bg-white">
                    {activeIsImage ? (
                      <Image
                        src={activeSrc}
                        alt={activeLabel}
                        fill
                        className="object-contain"
                        sizes="400px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm text-slate-500 text-center px-4">
                        This file type can&apos;t be previewed here — use &quot;Open full image&quot; below.
                      </div>
                    )}
                  </div>

                  {activeFiles.length > 1 && (
                    <div className="flex items-center justify-between w-full mt-2">
                      <button
                        type="button"
                        onClick={() => setActiveIndex((i) => (i - 1 + activeFiles.length) % activeFiles.length)}
                        className="text-xs font-bold text-slate-600 hover:text-blue-600"
                      >
                        ← Prev
                      </button>
                      <div className="flex gap-1">
                        {activeFiles.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setActiveIndex(i)}
                            className={`w-2 h-2 rounded-full ${i === activeIndex ? "bg-blue-600" : "bg-slate-300"}`}
                            aria-label={`Show file ${i + 1}`}
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveIndex((i) => (i + 1) % activeFiles.length)}
                        className="text-xs font-bold text-slate-600 hover:text-blue-600"
                      >
                        Next →
                      </button>
                    </div>
                  )}

                  <a
                    href={activeSrc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Open full image
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </>
              ) : (
                <div className="text-center text-slate-400">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Click a checklist item to preview its document(s)</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t flex justify-end gap-3 bg-white">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-md font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowFinalWarning(true)}
              disabled={isDeploying || !allChecked}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-bold shadow disabled:opacity-50"
            >
              {isDeploying ? "Waiting..." : "Proceed"}
            </button>
          </div>
        </div>
      </div>

      {/* FINAL WARNING MODAL */}
      {showFinalWarning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Final Confirmation Required</h3>
            <p className="text-sm text-slate-900 mb-4">
              Deploying this campaign is irreversible.<br />
              Please type <strong>CONFIRM</strong> in uppercase to proceed.
            </p>
            <div className="mb-4">
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Type CONFIRM here..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowFinalWarning(false)}
                className="px-4 py-2 text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-md font-medium"
              >
                Go Back
              </button>
              <button
                onClick={onConfirm}
                disabled={!canApprove}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-bold shadow disabled:opacity-50"
              >
                {isDeploying ? "Deploying..." : "Deploy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
