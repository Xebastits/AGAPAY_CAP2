"use client";

import { useState, useEffect } from "react";

interface ApproveCampaignModalProps {
  open: boolean;
  campaignName: string;    
  isDeploying: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ApproveCampaignModal = ({
  open,
  campaignName,
  isDeploying,
  onCancel,
  onConfirm,
}: ApproveCampaignModalProps) => {
  const [checks, setChecks] = useState({
    idVerification: false,
    proofOfNeed: false,
    barangayCertificate: false,
    solicitationPermit: false,
  });

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
    }
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* MAIN MODAL */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            Approve Campaign?
          </h3>

          <p className="text-sm text-slate-900 mb-4">
            Approving this campaign will deploy{" "}
            <strong>"{campaignName}"</strong> to the blockchain. This action is
            irreversible.
          </p>

          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Notice:</strong> By proceeding, you confirm that all
              submitted documents have been reviewed and validated.
            </p>
          </div>

          {/* CHECKLIST */}
          <div className="mb-4 space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={checks.idVerification}
                onChange={(e) =>
                  setChecks((prev) => ({ ...prev, idVerification: e.target.checked }))
                }
              />
              <span className="text-sm font-medium text-slate-700">
                ID Verification
              </span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={checks.proofOfNeed}
                onChange={(e) =>
                  setChecks((prev) => ({ ...prev, proofOfNeed: e.target.checked }))
                }
              />
              <span className="text-sm font-medium text-slate-700">
                Proof of Need (Requirements)
              </span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={checks.barangayCertificate}
                onChange={(e) =>
                  setChecks((prev) => ({ ...prev, barangayCertificate: e.target.checked }))
                }
              />
              <span className="text-sm font-medium text-slate-700">
                Barangay Certificate of Indigency
              </span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={checks.solicitationPermit}
                onChange={(e) =>
                  setChecks((prev) => ({ ...prev, solicitationPermit: e.target.checked }))
                }
              />
              <span className="text-sm font-medium text-slate-700">
                Public Solicitation Permit
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-3">
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
            <h3 className="text-2xl font-bold text-slate-800 mb-2">
              Final Confirmation Required
            </h3>

            <p className="text-sm text-slate-900 mb-4">
              Deploying this campaign is irreversible. <br />
            </p>

            <p className="text-sm text-slate-900 mb-4">
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
