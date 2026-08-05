"use client";

type CampaignRequest = {
    id: string;
    name: string;
    status: string;
    rejectionReason?: string;
    rejectionDetails?: string;
    rejectionTime?: number;
};

type RejectionGuidanceModalProps = {
    isOpen: boolean;
    onClose: () => void;
    request: CampaignRequest | null;
    openCreateModal: () => void; // opens CreateCampaignModal prefilled with this request's data
};

export default function RejectionGuidanceModal({
    isOpen,
    onClose,
    request,
    openCreateModal,
}: RejectionGuidanceModalProps) {

    if (!isOpen || !request) return null;

    const isChangesRequested = request.status === "changes_requested";

    const handleFixAndResubmit = () => {
        onClose();          // close guidance modal
        openCreateModal();  // open CreateCampaignModal, prefilled with this campaign's data
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center backdrop-blur-md z-50">
            <div className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <p className="text-2xl font-bold text-slate-800">
                        {isChangesRequested ? "Changes Requested" : "Campaign Rejection Guidance"}
                    </p>
                    <button className="text-gray-500 hover:text-black" onClick={onClose}>✕</button>
                </div>

                <div className="text-sm text-slate-700 mb-4">
                    <div className="mb-4">
                        <h3 className="font-bold text-xl mb-4">
                            {isChangesRequested
                                ? <>The reviewer asked for changes to &quot;{request.name}&quot;</>
                                : <>Your campaign &quot;{request.name}&quot; was rejected</>}
                        </h3>

                        {request.rejectionReason && (
                            <div className={`p-3 rounded border mb-4 ${isChangesRequested ? "bg-amber-100 border-amber-200" : "bg-red-200"}`}>
                                <strong>{isChangesRequested ? "What to fix:" : "Reason for rejection:"}</strong> {request.rejectionReason}
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-100 p-3 rounded border mb-4">
                        <strong>Feedbacks from reviewer:</strong>
                        <p className="mt-1 whitespace-pre-wrap">
                            {request.rejectionDetails && request.rejectionDetails.trim().length > 0
                                ? request.rejectionDetails
                                : "No additional details were provided."}
                        </p>
                    </div>

                    <div className="mb-4">
                        <h4 className="font-bold mb-2">Guide on how to improve your resubmission:</h4>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Ensure all information is accurate and complete</li>
                            <li>Provide clear, detailed descriptions of your campaign purpose</li>
                            <li>Upload high-quality, relevant images</li>
                            <li>Verify that your ID documents are clear and valid</li>
                            <li>Check that your campaign goal and timeline are realistic</li>
                        </ul>
                    </div>

                    <div className="mb-4">
                        <h4 className="font-bold mb-2">Notice:</h4>
                        {isChangesRequested ? (
                            <p className="text-amber-700 font-bold mt-2">
                                Your previous details and documents are already saved — you'll only need to
                                update what&apos;s flagged above, then resubmit for another review.
                            </p>
                        ) : (
                            <p className="text-red-600 font-bold mt-2">
                                Your previous details and documents are already saved — fix what&apos;s flagged
                                above and resubmit for re-evaluation.
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-slate-200 hover:bg-slate-300 font-bold py-3 rounded transition border border-slate-300 rounded-md"
                    >
                        Close
                    </button>

                    <button
                        onClick={handleFixAndResubmit}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition border border-blue-800 rounded-md"
                    >
                        Fix &amp; Resubmit
                    </button>
                </div>
            </div>
        </div>
    );
}
