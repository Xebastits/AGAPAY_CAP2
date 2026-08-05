"use client";

interface RejectCampaignModalProps {
  open: boolean;
  reasons: string[];
  rejectReason: string;
  rejectDetails: string;
  onReasonChange: (value: string) => void;
  onDetailsChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  // "reject" closes the request out; "request_changes" sends it back to the
  // beneficiary's dashboard so they can fix and resubmit it.
  mode?: "reject" | "request_changes";
}

export const RejectCampaignModal = ({
  open,
  reasons,
  rejectReason,
  rejectDetails,
  onReasonChange,
  onDetailsChange,
  onCancel,
  onConfirm,
  mode = "reject",
}: RejectCampaignModalProps) => {
  if (!open) return null;

  const isRequestChanges = mode === "request_changes";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-2">
          {isRequestChanges ? "Request Changes" : "Reject Campaign"}
        </h3>

        <p className="text-m text-slate-700 mb-4">
          {isRequestChanges
            ? "This sends the request back to the beneficiary's dashboard so they can fix the specific issue and resubmit — it won't reappear in your queue until they do."
            : "Please provide a clear reason so the campaign creator understands why their submission was rejected."}
        </p>

        <label className="block text-sm font-bold text-slate-700 mb-1">
          {isRequestChanges ? "What needs to change" : "Rejection Reason"}
        </label>
        <select
          value={rejectReason}
          onChange={(e) => onReasonChange(e.target.value)}
          className="w-full border text-m border-slate-300 rounded-md px-3 py-2 mb-4 focus:ring-1 focus:ring-slate-400 outline-none"
        >
          <option value="">Select a reason</option>
          {reasons.map((reason) => (
            <option key={reason} value={reason}>
              {reason}
            </option>
          ))}
        </select>

        <label className="block text-sm font-bold text-slate-700 mb-1">
          Additional Details {isRequestChanges ? "(recommended — be specific)" : "(Optional)"}
        </label>
        <textarea
          className="w-full border text-m border-slate-300 rounded-md p-3 h-28 focus:ring-1 focus:ring-slate-400 outline-none resize-none"
          placeholder={isRequestChanges ? "e.g. \"The ID photo is blurry — please re-upload a clearer scan.\"" : "Add extra context if necessary..."}
          value={rejectDetails}
          onChange={(e) => onDetailsChange(e.target.value)}
        />

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-200 text-slate-600 hover:bg-slate-300 border border-slate-300 rounded-md font-medium"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className={`px-6 py-2 text-white rounded-md font-bold shadow ${isRequestChanges ? "bg-amber-600 hover:bg-amber-700" : "bg-red-600 hover:bg-red-700"}`}
          >
            {isRequestChanges ? "Send Back for Changes" : "Confirm Reject"}
          </button>
        </div>
      </div>
    </div>
  );
};
