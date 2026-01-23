"use client";

import { useState } from "react";

type NDAModalProps = {
  isOpen: boolean;
  onAccept: () => void;
};

export default function NDAModal({ isOpen, onAccept }: NDAModalProps) {
  const [ndaAccepted, setNdaAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);

  const canProceed = ndaAccepted && privacyAccepted;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center backdrop-blur-xs z-50 p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-slate-800">Legal Agreements</h2>
          <p className="text-sm text-slate-500 mt-1">Please review and accept to continue.</p>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          
          <section>
            <h3 className="font-bold text-slate-800 mb-2">1. Non-Disclosure Agreement</h3>
            <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1">
              <li>Confidentiality of all campaign and donor data.</li>
              <li>Strict prohibition of fraudulent fundraising activities.</li>
              <li>Acknowledgement of legal liability for data breaches.</li>
            </ul>
          </section>

          <section className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-2">2. Data Privacy Act of 2012 (RA 10173)</h3>
            <p className="text-sm text-slate-600 mb-3">
              We value your privacy. Your data is processed based on <strong>Transparency, Legitimate Purpose, and Proportionality.</strong>
            </p>
            
            <button 
              onClick={() => setShowFullDetails(!showFullDetails)}
              className="text-blue-600 text-sm font-semibold hover:underline mb-2"
            >
              {showFullDetails ? "Hide Details" : "Show Your Rights as a Data Subject"}
            </button>

            {showFullDetails && (
              <div className="mt-3 text-xs text-slate-500 space-y-2 animate-in fade-in duration-300">
                <p><strong>Your Rights:</strong></p>
                <div className="grid grid-cols-2 gap-2">
                  <p>• Right to be Informed</p>
                  <p>• Right to Object</p>
                  <p>• Right to Access</p>
                  <p>• Right to Rectification</p>
                  <p>• Right to Erasure</p>
                  <p>• Right to Damages</p>
                </div>
                <p className="pt-2">
                  Read the full Republic Act at the {" "}
                  <a 
                    href="https://www.officialgazette.gov.ph/2012/08/15/republic-act-no-10173/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    Official Gazette of the Philippines
                  </a>.
                </p>
              </div>
            )}
          </section>
        </div>

        <div className="p-6 border-t bg-slate-50 rounded-b-xl">
          <div className="space-y-3 mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={ndaAccepted}
                onChange={(e) => setNdaAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">I agree to the <strong>Non-Disclosure Agreement</strong> terms.</span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">
                I give my <strong>Consent to Process Data</strong> under RA 10173.
              </span>
            </label>
          </div>

          <button
            onClick={onAccept}
            disabled={!canProceed}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg shadow-md transition-all active:scale-[0.98]"
          >
            Confirm and Continue
          </button>
        </div>
      </div>
    </div>
  );
}