"use client";

import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { collection, addDoc } from "firebase/firestore";
import { getDb } from "@/app/lib/firebase";
import { uploadToCloudinary, uploadManyToCloudinary } from "@/app/lib/cloudinary";
import { formatFileSize, isImageMimeType } from "@/app/lib/fileUtils";
import { formatNumberWithCommas, stripCommas } from "@/app/lib/format";

type CreateCampaignModalProps = {
    setIsModalOpen: (value: boolean) => void;
    refreshRequests: () => void;
};

// --- Reusable multi-file attachment picker + preview list ---
// Accepts ANY file type (images, PDFs, docs, etc.) and lets the user attach
// multiple files per document category.
function FileAttachments({
    label,
    files,
    onAdd,
    onRemove,
}: {
    label: string;
    files: File[];
    onAdd: (newFiles: FileList | null) => void;
    onRemove: (index: number) => void;
}) {
    const inputId = `file-input-${label.replace(/\s+/g, "-").toLowerCase()}`;

    return (
        <div>
            <input
                id={inputId}
                type="file"
                multiple
                onChange={(e) => {
                    onAdd(e.target.files);
                    // allow re-selecting the same file(s) again later
                    e.target.value = "";
                }}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-200 file:text-slate-800 hover:file:bg-slate-300"
            />
            {files.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                    {files.map((file, i) => {
                        const isImage = isImageMimeType(file.type);
                        const url = isImage ? URL.createObjectURL(file) : null;
                        const ext = file.name.split(".").pop()?.toUpperCase().slice(0, 4) || "FILE";

                        return (
                            <div
                                key={`${file.name}-${file.lastModified}-${i}`}
                                className="relative flex items-center gap-2 pl-2 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-lg max-w-[240px]"
                            >
                                {isImage && url ? (
                                    <img
                                        src={url}
                                        alt="preview"
                                        className="w-10 h-10 object-cover rounded border border-slate-300 flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-10 h-10 flex items-center justify-center rounded border border-slate-300 bg-slate-200 text-slate-500 text-[9px] font-bold flex-shrink-0">
                                        {ext}
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className="text-xs text-slate-700 truncate" title={file.name}>
                                        {file.name}
                                    </p>
                                    <p className="text-[10px] text-slate-400">{formatFileSize(file.size)}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onRemove(i)}
                                    aria-label={`Remove ${file.name}`}
                                    className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-slate-300 hover:bg-red-500 text-white text-[10px] leading-none transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// --- Single-image picker for the campaign cover photo ---
// Unlike FileAttachments, this only ever holds ONE image: picking a new file
// replaces whatever was selected before.
function SingleImageAttachment({
    file,
    onChange,
}: {
    file: File | null;
    onChange: (file: File | null) => void;
}) {
    const url = file ? URL.createObjectURL(file) : null;

    return (
        <div>
            <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                    onChange(e.target.files?.[0] ?? null);
                    e.target.value = "";
                }}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-200 file:text-slate-800 hover:file:bg-slate-300"
            />
            {file && url && (
                <div className="relative mt-2 inline-flex items-center gap-2 pl-2 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-lg max-w-[240px]">
                    <img
                        src={url}
                        alt="preview"
                        className="w-10 h-10 object-cover rounded border border-slate-300 flex-shrink-0"
                    />
                    <p className="text-xs text-slate-700 truncate" title={file.name}>
                        {file.name}
                    </p>
                    <button
                        type="button"
                        onClick={() => onChange(null)}
                        aria-label="Remove image"
                        className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-slate-300 hover:bg-red-500 text-white text-[10px] leading-none transition-colors"
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
}

export default function CreateCampaignModal({
    setIsModalOpen,
    refreshRequests
}: CreateCampaignModalProps) {

    const account = useActiveAccount();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- STEP TRACKER ---
    const [step, setStep] = useState(1);

    // Form State (Step 1)
    const [fullName, setFullName] = useState("");
    const [name, setName] = useState("");
    const [age, setAge] = useState("");
    const [description, setDescription] = useState("");
    const [goal, setGoal] = useState("100");
    const [deadline, setDeadline] = useState("30");
    const [isEmergency, setIsEmergency] = useState(false);

    // Form State (Step 2) — the campaign cover is a SINGLE image; the other
    // document categories can each hold MULTIPLE files of any type.
    const [campaignImage, setCampaignImage] = useState<File | null>(null);
    const [idImages, setIdImages] = useState<File[]>([]);
    const [requirementImages, setRequirementImages] = useState<File[]>([]);
    const [barangayCertificates, setBarangayCertificates] = useState<File[]>([]);
    const [solicitationPermits, setSolicitationPermits] = useState<File[]>([]);

    // --- Step 3 Agreements ---
    const [agreements, setAgreements] = useState({
        authenticity: false,
        privacy: false,
        disbursement: false,
    });

    // Status Modal State
    const [statusModal, setStatusModal] = useState<{
        isOpen: boolean;
        type: "success" | "error";
        title: string;
        message: string;
        onClose?: () => void;
    }>({ isOpen: false, type: "success", title: "", message: "" });

    const closeStatusModal = () => {
        const callback = statusModal.onClose;
        setStatusModal({ ...statusModal, isOpen: false });
        if (callback) callback();
    };

    // Number Input Helpers
    const preventNonIntegers = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault();
    };

    const handleIntegerChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
        const val = e.target.value;
        if (val === "" || /^\d+$/.test(val)) setter(val);
    };

    // For comma-formatted fields (e.g. Goal): the input displays "100,000"
    // but the underlying state always stays a plain digit string ("100000"),
    // which is what gets validated/submitted.
    const handleFormattedIntegerChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
        setter(stripCommas(e.target.value));
    };

    const handleBlur = (value: string, setter: (val: string) => void, min: number, max?: number) => {
        let num = parseInt(value);
        if (isNaN(num)) num = min;
        if (num < min) num = min;
        if (max && num > max) num = max;
        setter(num.toString());
    };

    // --- Generic add/remove helpers for the multi-file attachment categories ---
    const addFilesTo = (setter: React.Dispatch<React.SetStateAction<File[]>>) => (newFiles: FileList | null) => {
        if (!newFiles || newFiles.length === 0) return;
        setter((prev) => {
            const existingKeys = new Set(prev.map((f) => `${f.name}-${f.size}-${f.lastModified}`));
            const toAdd = Array.from(newFiles).filter(
                (f) => !existingKeys.has(`${f.name}-${f.size}-${f.lastModified}`)
            );
            return [...prev, ...toAdd];
        });
    };

    const removeFileFrom = (setter: React.Dispatch<React.SetStateAction<File[]>>) => (index: number) => {
        setter((prev) => prev.filter((_, i) => i !== index));
    };

    // --- Handle Next Step (Validates Step 1) ---
    const handleNext = () => {
        if (!fullName || !name || !description || !age || !goal || !deadline) {
            setStatusModal({ isOpen: true, type: "error", title: "Missing Fields", message: "Please fill out all the text fields." });
            return;
        }
        if (parseInt(age) < 18) {
            setStatusModal({ isOpen: true, type: "error", title: "Invalid Age", message: "You must be at least 18 years old." });
            return;
        }
        setStep(2);
    };


    const handleSubmit = async () => {
        if (!account) {
            setStatusModal({ isOpen: true, type: "error", title: "Wallet Required", message: "Please connect your wallet first." });
            return;
        }

        // --- Validates Step 2: campaign cover image + at least one attachment per document category ---
        if (
            !campaignImage ||
            idImages.length === 0 ||
            requirementImages.length === 0 ||
            barangayCertificates.length === 0 ||
            solicitationPermits.length === 0
        ) {
            setStatusModal({ isOpen: true, type: "error", title: "Missing Attachments", message: "Please attach a campaign cover image and at least one file for each required document." });
            return;
        }

        // --- Validates Step 3 ---
        if (!agreements.authenticity || !agreements.privacy || !agreements.disbursement) {
            setStatusModal({ isOpen: true, type: "error", title: "Consent Required", message: "Please accept all declarations to proceed." });
            return;
        }

        try {
            setIsSubmitting(true);

            const [campUrl, idUrls, reqUrls, barangayUrls, permitUrls] = await Promise.all([
                uploadToCloudinary(campaignImage),
                uploadManyToCloudinary(idImages),
                uploadManyToCloudinary(requirementImages),
                uploadManyToCloudinary(barangayCertificates),
                uploadManyToCloudinary(solicitationPermits),
            ]);

            const finalName = isEmergency ? `(EMERGENCY) ${name}` : name;

            const db = getDb();
            if (!db) {
                setStatusModal({ isOpen: true, type: "error", title: "Error", message: "Database not available. Please refresh the page." });
                return;
            }

            await addDoc(collection(db, "campaigns"), {
                creator: account.address,
                fullName,
                name: finalName,
                description,
                age: parseInt(age),
                goal: goal,
                deadline: parseInt(deadline),
                isEmergency,

                // Campaign cover is a single URL; the rest are arrays since
                // each of those categories can hold multiple files of any type
                imageUrl: campUrl,
                idImages: idUrls,
                requirementImages: reqUrls,
                barangayCertificates: barangayUrls,
                solicitationPermits: permitUrls,

                agreements,
                status: "pending",
                createdAt: Date.now()
            });

            setStatusModal({
                isOpen: true,
                type: "success",
                title: "Success",
                message: "Your campaign request has been submitted successfully.",
                onClose: () => {
                    refreshRequests();
                    setIsModalOpen(false);
                }
            });

        } catch (error) {
            console.error("Submission Error:", error);
            setStatusModal({ isOpen: true, type: "error", title: "Submission Failed", message: "An error occurred while saving your request." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const allAgreementsChecked = Object.values(agreements).every(Boolean);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center backdrop-blur-md z-50 p-6">
            <div className="w-[70vw] bg-white p-6 rounded-lg shadow-xl max-h-[95vh] overflow-y-auto relative"
            >



                {/* HEADER & STEP INDICATOR */}
                <div className="flex justify-between items-center mb-4">
                    <p className="text-xl font-bold">New Campaign Request<span style={{ color: 'red' }}>*</span></p>
                    <button className="text-gray-500 hover:text-black" onClick={() => setIsModalOpen(false)}>✕</button>
                </div>

                {/* --- Progress Bar --- */}
                <div className="w-full bg-slate-100 rounded-full h-2 mb-10 border border-slate-200">
                    <div className={`bg-blue-600 h-1.5 rounded-full transition-all duration-10000
  ${step === 1 ? 'w-[10%]' : step === 2 ? 'w-[60%]' : 'w-[100%]'}`}></div>



                    <div className="flex justify-between mt-1 text-xs font-bold text-slate-500">
                        <span className={`${step === 1 ? 'text-blue-600' : ''}`}>1. Details</span>
                        <span className={`${step === 2 ? 'text-blue-600' : ''}`}>2. Documents</span>
                        <span className={`${step === 3 ? 'text-blue-600' : ''}`}>3. Consent</span>
                    </div>
                </div>

                <div className="flex flex-col gap-4">

                    {/* ======================= STEP 1: TEXT DETAILS ======================= */}
                    {step === 1 && (
                        <>    <div className="mb-4">
                            <p className="text-m m-1">
                                This is a <strong>campaign request</strong> form. Please complete the details below for review and approval.
                            </p>
                        </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold mb-1"> <span className="text-red-600">*</span> Full Legal Name</label>
                                    <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1"><span className="text-red-600">*</span> Age (18+)</label>
                                    <input type="number" value={age} onChange={(e) => handleIntegerChange(e, setAge)} onBlur={() => handleBlur(age, setAge, 18, 150)} onKeyDown={preventNonIntegers} className="w-full px-3 py-2 border rounded" placeholder="18" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1"><span className="text-red-600">*</span> Campaign Title</label>
                                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="e.g. Medical Help for Juan" />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1"><span className="text-red-600">*</span> Description</label>
                                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded min-h-[50px] max-h-[220px] overflow-y-auto" placeholder="Add further context and reasons..." />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold mb-1"><span className="text-red-600">*</span> Goal (PHP)</label>
                                    <input type="text" inputMode="numeric" value={formatNumberWithCommas(goal)} onChange={(e) => handleFormattedIntegerChange(e, setGoal)} onBlur={() => handleBlur(goal, setGoal, 1)} className="w-full px-3 py-2 border rounded" placeholder="1,000" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1"><span className="text-red-600">*</span> Duration (Days)</label>
                                    <input type="number" value={deadline} onChange={(e) => handleIntegerChange(e, setDeadline)} onBlur={() => handleBlur(deadline, setDeadline, 1)} onKeyDown={preventNonIntegers} className="w-full px-3 py-2 border rounded" placeholder="30" />
                                </div>
                            </div>

                            <div
                                className={`p-4 rounded border cursor-pointer flex items-start gap-3 
    ${isEmergency ? "bg-red-50 border-red-300" : "bg-slate-50 border-slate-200"}`}
                                onClick={() => setIsEmergency(!isEmergency)}
                            >
                                <input
                                    type="checkbox"
                                    checked={isEmergency}
                                    onChange={(e) => setIsEmergency(e.target.checked)}
                                    className="w-5 h-5 text-red-600 rounded mt-1"
                                />

                                <div className="flex flex-col">
                                    <label
                                        className={`block font-bold text-sm cursor-pointer 
        ${isEmergency ? "text-red-700" : "text-slate-600"}`}
                                    >
                                        Mark as Emergency (Optional)
                                    </label>

                                    <p className="text-xs text-slate-600 italic">
                                        Use this if your situation is urgent. Emergency campaigns are reviewed faster and
                                        prioritized.
                                    </p>
                                </div>
                            </div>


                            <div className="flex gap-4 pt-4 mt-4 border-t justify-end">

                                <button
                                    onClick={handleNext}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded transition-colors"
                                >
                                    ➤ Next: Upload Documents
                                </button>
                            </div>


                        </>
                    )}

                    {/* ======================= STEP 2: DOCUMENT ATTACHMENTS ======================= */}
                    {step === 2 && (
                        <div className="space-y-4 animate-fadeIn">
                            <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-lg p-3">
                                You can attach <strong>multiple files</strong> per document, and any file type is
                                accepted (photos, scans, PDFs, Word docs, etc.).
                            </div>

                            {/* 1. Campaign Image (single) */}
                            <div>
                                <label className="block text-sm font-bold text-slate-800 mb-2">
                                    <span className="text-red-600">*</span> 1. Campaign Cover Image
                                </label>
                                <p className="text-xs text-slate-600 mb-2 italic">
                                    Add one clear cover photo that represents your campaign. This will be displayed on the campaign page.
                                </p>
                                <SingleImageAttachment
                                    file={campaignImage}
                                    onChange={setCampaignImage}
                                />
                            </div>

                            {/* 2. ID Attachment(s) */}
                            <div>
                                <label className="block text-sm font-bold text-slate-800 mb-2">
                                    <span className="text-red-600">*</span> 2. ID Verification
                                </label>
                                <p className="text-xs text-slate-600 mb-2 italic">
                                    Upload clear file(s) of a valid National ID for verification (photo, scan, or PDF).
                                </p>
                                <FileAttachments
                                    label="ID Verification"
                                    files={idImages}
                                    onAdd={addFilesTo(setIdImages)}
                                    onRemove={removeFileFrom(setIdImages)}
                                />
                            </div>

                            {/* 3. Requirement Attachment(s) */}
                            <div>
                                <label className="block text-sm font-bold text-slate-800 mb-1">
                                    <span className="text-red-600">*</span> 3. Proof of Need (Requirements)
                                </label>
                                <p className="text-xs text-slate-600 mb-2 italic">
                                    Upload medical bill(s), prescription(s), hospital certificate, etc. — any format.
                                </p>
                                <FileAttachments
                                    label="Proof of Need"
                                    files={requirementImages}
                                    onAdd={addFilesTo(setRequirementImages)}
                                    onRemove={removeFileFrom(setRequirementImages)}
                                />
                            </div>

                            {/* 4. Barangay Certificate(s) */}
                            <div>
                                <label className="block text-sm font-bold text-slate-800 mb-1">
                                    <span className="text-red-600">*</span> 4. Barangay Certificate of Indigency
                                </label>
                                <p className="text-xs text-slate-600 mb-2 italic">
                                    Proof that you are eligible for assistance (issued by your barangay).
                                </p>
                                <FileAttachments
                                    label="Barangay Certificate"
                                    files={barangayCertificates}
                                    onAdd={addFilesTo(setBarangayCertificates)}
                                    onRemove={removeFileFrom(setBarangayCertificates)}
                                />
                            </div>

                            {/* 5. Public Solicitation Permit(s) */}
                            <div>
                                <label className="block text-sm font-bold text-slate-800 mb-1">
                                    <span className="text-red-600">*</span> 5. Public Solicitation Permit
                                </label>
                                <p className="text-xs text-slate-600 mb-2 italic">
                                    Permit needed to legally fundraise publicly according to PD No. 1564.
                                </p>
                                <FileAttachments
                                    label="Solicitation Permit"
                                    files={solicitationPermits}
                                    onAdd={addFilesTo(setSolicitationPermits)}
                                    onRemove={removeFileFrom(setSolicitationPermits)}
                                />
                            </div>

                            <div className="flex gap-4 pt-4 mt-4 border-t justify-between">
                                <button
                                    onClick={() => setStep(1)}
                                    disabled={isSubmitting}
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 px-6 rounded transition-colors"
                                >
                                    Back
                                </button>

                                <button
                                    onClick={() => setStep(3)}
                                    disabled={isSubmitting}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded transition-colors shadow-lg"
                                >
                                    ➤ Next: Consent
                                </button>
                            </div>


                        </div>
                    )}
                    {/* ======================= STEP 3: DECLARATION & CONSENT ======================= */}
                    {step === 3 && (
                        <div className="space-y-4 animate-fadeIn">

                            {/* Warning Header */}
                            <div className="border border-red-200 bg-red-50 rounded-lg p-4 flex items-start gap-3">
                                <div className="text-red-600 font-bold text-xl">!</div>
                                <div>
                                    <div className="font-bold text-sm text-red-700">Declaration & Consent</div>
                                    <div className="text-xs text-red-600">
                                        Please read carefully. Your application will not be processed unless all statements are accepted.
                                    </div>
                                </div>
                            </div>

                            {/* Checkbox 1 */}
                            <div className="p-4 rounded border border-slate-200">
                                <label className="flex items-start gap-2">
                                    <input
                                        type="checkbox"
                                        checked={agreements.authenticity}
                                        onChange={(e) => setAgreements({ ...agreements, authenticity: e.target.checked })}
                                        className="w-4 h-4 mt-1"
                                    />
                                    <div>
                                        <div className="font-bold text-sm"><span className="text-red-600">*</span> I promise my documents are real.</div>
                                        <div className="text-xs text-slate-600">
                                            I understand that falsified documents may lead to rejection of my request.
                                        </div>
                                    </div>
                                </label>
                            </div>

                            {/* Checkbox 2 */}
                            <div className="p-4 rounded border border-slate-200">
                                <label className="flex items-start gap-2">
                                    <input
                                        type="checkbox"
                                        checked={agreements.privacy}
                                        onChange={(e) => setAgreements({ ...agreements, privacy: e.target.checked })}
                                        className="w-4 h-4 mt-1"
                                    />
                                    <div>
                                        <div className="font-bold text-sm"><span className="text-red-600">*</span> I allow the Admin and validators to check my background.</div>
                                        <div className="text-xs text-slate-600">
                                            Validators may review my documents to confirm authenticity and prevent misuse.
                                        </div>
                                    </div>
                                </label>
                            </div>

                            {/* Checkbox 3 */}
                            <div className="p-4 rounded border border-slate-200">
                                <label className="flex items-start gap-2">
                                    <input
                                        type="checkbox"
                                        checked={agreements.disbursement}
                                        onChange={(e) => setAgreements({ ...agreements, disbursement: e.target.checked })}
                                        className="w-4 h-4 mt-1"
                                    />
                                    <div>
                                        <div className="font-bold text-sm"><span className="text-red-600">*</span> I understand how I will receive the money.</div>
                                        <div className="text-xs text-slate-600">
                                           I understand that fund disbursement will follow the platform&apos;s approved process and timeline.
                                        </div>
                                    </div>
                                </label>
                            </div>

                            <div className="flex gap-4 pt-4 mt-4 border-t justify-between">
                                <button
                                    onClick={() => setStep(2)}
                                    disabled={isSubmitting}
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 px-6 rounded transition-colors"
                                >
                                    Back
                                </button>

                                <button
                                    onClick={handleSubmit}
                                    disabled={!allAgreementsChecked || isSubmitting}
                                    className={`text-white font-bold py-3 px-6 rounded transition-colors shadow-lg ${!allAgreementsChecked ? "bg-slate-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                                        }`}
                                >
                                    {isSubmitting ? "Uploading..." : "Submit for Approval"}
                                </button>
                            </div>


                        </div>
                    )}
                </div>
            </div>

            {/* STATUS MODAL (Unchanged) */}
            {statusModal.isOpen && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 z-[60]">
                    <div className="bg-white rounded-lg shadow-2xl p-6 max-w-sm w-full">
                        <h3 className={`text-xl font-bold text-center mb-2 ${statusModal.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{statusModal.title}</h3>
                        <p className="text-center text-gray-600 mb-6">{statusModal.message}</p>
                        <button onClick={closeStatusModal} className={`w-full py-2.5 rounded-lg text-white font-bold ${statusModal.type === 'error' ? 'bg-red-500 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>Okay</button>
                    </div>
                </div>
            )}
        </div >
    );
}