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
}: RejectCampaignModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-2">
          Reject Campaign
        </h3>

        <p className="text-m text-slate-700 mb-4">
          Please provide a clear reason so the campaign creator understands why
          their submission was rejected.
        </p>

        <label className="block text-sm font-bold text-slate-700 mb-1">
          Rejection Reason
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
          Additional Details (Optional)
        </label>
        <textarea
          className="w-full border text-m border-slate-300 rounded-md p-3 h-28 focus:ring-1 focus:ring-slate-400 outline-none resize-none"
          placeholder="Add extra context if necessary..."
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
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-bold shadow"
          >
            Confirm Reject
          </button>
        </div>
      </div>
    </div>
  );
};
