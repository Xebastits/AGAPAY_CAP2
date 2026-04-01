'use client';

import { useReadContract } from "thirdweb/react";
import { client } from "@/app/client";
import { getContract } from "thirdweb";
import { CROWDFUNDING_FACTORY } from "../constants/constant";
import { useState, useEffect, useMemo, useCallback, memo } from "react";
import dynamic from 'next/dynamic';
import { arcTestnet } from "thirdweb/chains";

const MyCampaignCard = dynamic(
  () => import('../components/CampaignCard').then(mod => mod.MyCampaignCard),
  { loading: () => <div className="h-96 bg-slate-100 rounded-lg animate-pulse" />, ssr: false }
);

const ITEMS_PER_PAGE = 9;
const STORAGE_KEY = 'showEmergencyFirst';

type FilterType = 'all' | 'active' | 'successful' | 'failed';
type CampaignStatus = 'active' | 'successful' | 'failed' | 'unknown';

// ─── Sub-components ───────────────────────────────────────────────────────────

const FilterSelect = memo(({ value, onChange }: { value: FilterType; onChange: (v: FilterType) => void }) => (
  <div className="flex items-center bg-white border border-slate-300 rounded-md px-3 py-1">
    <label className="mr-2 text-sm font-bold text-slate-500">Filter:</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as FilterType)}
      className="bg-transparent outline-none py-1 text-slate-700"
    >
      <option value="all">All</option>
      <option value="active">Active</option>
      <option value="successful">Successful</option>
      <option value="failed">Failed</option>
    </select>
  </div>
));
FilterSelect.displayName = 'FilterSelect';

const Pagination = memo(({
  currentPage,
  totalPages,
  onPageChange
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-4 mt-12">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 text-sm bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
      >
        Previous
      </button>
      <span className="text-sm font-bold text-slate-600">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-4 py-2 text-sm bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
      >
        Next
      </button>
    </div>
  );
});
Pagination.displayName = 'Pagination';

function useCampaignStatus(campaignAddress: string): CampaignStatus {
  const contract = useMemo(() => getContract({
    client,
    chain: arcTestnet,
    address: campaignAddress,
  }), [campaignAddress]);

  const { data: state }   = useReadContract({ contract, method: "function state() view returns (uint8)", params: [] });
  const { data: deadline } = useReadContract({ contract, method: "function deadline() view returns (uint256)", params: [] });
  const { data: balance }  = useReadContract({ contract, method: "function getContractBalance() view returns (uint256)", params: [] });
  const { data: goal }     = useReadContract({ contract, method: "function goal() view returns (uint256)", params: [] });

  return useMemo(() => {
    if (state === undefined || !deadline || balance === undefined || goal === undefined) return 'unknown';
    const now = Date.now() / 1000;
    const isExpired = now >= Number(deadline);
    const isGoalMet = balance >= goal;
    if (state === 2 || (state === 0 && isExpired && !isGoalMet)) return 'failed';
    if (state === 1 || (state === 0 && isGoalMet)) return 'successful';
    if (state === 0 && !isExpired && !isGoalMet) return 'active';
    return 'unknown';
  }, [state, deadline, balance, goal]);
}

const CampaignStatusFetcher = memo(({
  campaignAddress,
  onStatusResolved,
}: {
  campaignAddress: string;
  onStatusResolved: (address: string, status: CampaignStatus) => void;
}) => {
  const status = useCampaignStatus(campaignAddress);
  useEffect(() => {
    if (status !== 'unknown') onStatusResolved(campaignAddress, status);
  }, [campaignAddress, status, onStatusResolved]);
  return null;
});
CampaignStatusFetcher.displayName = 'CampaignStatusFetcher';

const CampaignCard = memo(({
  campaignAddress,
  showEmergencyFirst,
}: {
  campaignAddress: string;
  showEmergencyFirst: boolean;
  creationTime: bigint;
}) => (
  <MyCampaignCard campaignAddress={campaignAddress} showEmergencyFirst={showEmergencyFirst} />
));
CampaignCard.displayName = 'CampaignCard';

// ─── How It Works section ─────────────────────────────────────────────────────

type FlowColor = 'blue' | 'amber' | 'teal';
const colorMap: Record<FlowColor, string> = {
  blue:  'bg-blue-50 text-blue-700',
  amber: 'bg-amber-50 text-amber-700',
  teal:  'bg-teal-50 text-teal-700',
};

function FlowStep({ num, color, label, desc }: { num: string; color: FlowColor; label: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${colorMap[color]}`}>
        {num}
      </span>
      <div>
        <p className="text-sm font-medium text-slate-800 leading-snug">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function StepArrow() {
  return <p className="text-slate-300 text-m ml-3 my-1.5">↓</p>;
}

function ChainArrow() {
  return <span className="text-slate-300 text-3xl flex-shrink-0 px-1">→</span>;
}

function ChainBlock({ color, label, sub }: { color: 'teal' | 'blue' | 'amber'; label: string; sub: string }) {
  const styles: Record<string, string> = {
    teal:  'bg-teal-50 border-teal-200 text-teal-700',
    blue:  'bg-blue-50 border-blue-200 text-blue-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
  };
  return (
    <div className={`rounded-lg border px-3 py-2 text-center flex-shrink-0 min-w-[200px] ${styles[color]}`}>
      <p className="text-m font-semibold">{label}</p>
      <p className="text-[12px] opacity-80 mt-0.5">{sub}</p>
    </div>
  );
}

function HowItWorks() {
  return (
    <div className="w-full border-t border-slate-100 mt-8">
      {/* ── Section header ── */}
      <div className="text-center pt-12 pb-8 px-4">
        <h2 className="text-4xl font-bold text-blue-600 mb-2">Simple for everyone</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Blockchain explained simply.
        </p>
      </div>

      {/* ── Flow cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-10xl mx-auto px-4 pb-10">
        {/* Donor */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 font-bold text-slate-800 mb-5">
            I want to donate as a donor.
          </div>
          <FlowStep num="1" color="blue"  label="Browse campaigns"     desc="Find a cause you care about — medical, disaster, emergency" />
          <StepArrow />
          <FlowStep num="2" color="blue"  label="Send your donation"   desc="Donate using money from GCASH (Trade pesos to USDC) directly to the campaign." />
          <StepArrow />
          <FlowStep num="✓" color="teal"  label="Blockchain records it" desc="Your donation is permanently recorded — no one can alter it" />
          <StepArrow />
          <FlowStep num="✓" color="teal"  label="Funds reach the owner" desc="When the goal is met, the campaign owner withdraws directly" />
        </div>

        {/* Campaigner */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 font-bold text-slate-800 mb-5">
            I need help as an individual.
          </div>
          <FlowStep num="1" color="blue" label="Submit a request"       desc="Fill out your campaign details — what you need and why" />
          <StepArrow />
          <FlowStep num="2" color="amber" label="Pending review"         desc="AgaPay reviews your request to prevent fraud and abuse" />
          <StepArrow />
          <FlowStep num="3" color="teal" label="Approved"             desc="Your campaign is verified and approved by the admin" />
          <StepArrow />
          <FlowStep num="🔗" color="teal" label="Deployed to blockchain" desc="Your campaign goes live as a smart contract — permanent and public" />
        </div>
      </div>

      {/* ── Blockchain explainer ── */}
      <div className="border-t border-slate-100 px-4 py-10 max-w-10xl mx-auto w-full">
        <h2 className="text-center text-4xl font-bold text-blue-600 mb-1">
          What even is blockchain?
        </h2>
        <p className="text-center text-m text-slate-500 mb-6">
          Don&apos;t worry — here&apos;s all you need to know, Madali lang.
        </p>

{/* Analogy */}
<div className="flex items-stretch gap-0 mb-6">
  <div className="flex-1 rounded-xl border border-slate-200 bg-white p-5">
    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
      The old way
    </p>
    <p className="font-semibold text-slate-800 text-sm mb-1.5">One notebook</p>
    <p className="text-sm text-slate-500 leading-relaxed">
      One person keeps all the records. If they edit it, lose it, or lie —
      no one can tell. You just have to trust them.
    </p>
  </div>

  <div className="flex flex-col items-center justify-center px-2.5 flex-shrink-0">
    <div className="w-7 h-7 flex items-center justify-center text-blue-400 text-4xl">
      →
    </div>
  </div>

  <div className="flex-1 rounded-xl border-[1.5px] border-blue-600 bg-blue-50 p-5">
    <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 mb-2.5">
      The blockchain way
    </p>
    <p className="font-semibold text-blue-900 text-sm mb-1.5">Thousands of notebooks</p>
    <p className="text-sm text-blue-700 leading-relaxed">
      10,000 people each hold a copy. To change one entry you&apos;d have
      to change all 10,000 at once — impossible. That&apos;s blockchain.
    </p>
  </div>
</div>

        {/* Chain viz */}
        <div className="mb-10">
          <p className="text-center text-s text-slate-500 mb-6">
            Every donation = a new &quot;block&quot; added to the chain
          </p>
          <div className="flex items-center gap-1 overflow-x-auto pb-2 justify-center">
            <ChainBlock color="blue"  label="Block #1" sub="Campaign created" />
            <ChainArrow />
            <ChainBlock color="blue"  label="Block #2" sub="₱500 donated" />
            <ChainArrow />
            <ChainBlock color="blue"  label="Block #3" sub="₱1,200 donated" />
            <ChainArrow />
            <ChainBlock color="blue" label="Block #4" sub="Goal reached!" />
          </div>
          <p className="text-center text-s text-slate-500 mt-6">
            Each block is locked and linked to the one before it — nothing can be deleted or changed
          </p>
        </div>

        {/* Trust pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Transparent',  desc: 'Anyone can see where the money went — no hidden fees' },
            { label: 'Secure', desc: 'Once recorded, no one — not even us — can change the record' },
            { label: 'Direct',        desc: 'No middlemen. Funds go straight from donor to campaign owner' },
          ].map(({ label, desc }) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 text-center">
              <p className="font-bold text-slate-800 text-sm mb-1">{label}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const [showEmergencyFirst, setShowEmergencyFirst] = useState(false);
  const [selectedFilter, setSelectedFilter]         = useState<FilterType>('active');
  const [currentPage, setCurrentPage]               = useState(1);
  const [statusMap, setStatusMap]                   = useState<Record<string, CampaignStatus>>({});

  const contract = useMemo(() => getContract({
    client,
    chain: arcTestnet,
    address: CROWDFUNDING_FACTORY,
  }), []);

  const { data: campaigns, isLoading } = useReadContract({
    contract,
    method: "function getAllCampaigns() view returns ((address campaignAddress, address owner, string name, uint256 creationTime)[])",
    params: [],
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setShowEmergencyFirst(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(showEmergencyFirst));
  }, [showEmergencyFirst]);

  const handleStatusResolved = useCallback((address: string, status: CampaignStatus) => {
    setStatusMap(prev => {
      if (prev[address] === status) return prev;
      return { ...prev, [address]: status };
    });
  }, []);

  const { filteredCampaigns, pendingCount } = useMemo(() => {
    if (!campaigns?.length) return { filteredCampaigns: [], pendingCount: 0 };
    let pending = 0;
    const filtered = campaigns.filter(campaign => {
      const status = statusMap[campaign.campaignAddress];
      if (!status || status === 'unknown') { pending++; return false; }
      return selectedFilter === 'all' || status === selectedFilter;
    });
    filtered.sort((a, b) => {
      if (showEmergencyFirst) {
        const aE = a.name.toLowerCase().includes('emergency');
        const bE = b.name.toLowerCase().includes('emergency');
        if (aE !== bE) return aE ? -1 : 1;
      }
      return Number(b.creationTime - a.creationTime);
    });
    return { filteredCampaigns: filtered, pendingCount: pending };
  }, [campaigns, statusMap, selectedFilter, showEmergencyFirst]);

  const totalPages = Math.max(1, Math.ceil(filteredCampaigns.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => { setCurrentPage(1); }, [selectedFilter, showEmergencyFirst]);

  const visibleCampaigns = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCampaigns.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCampaigns, currentPage]);

  const handleFilterChange    = useCallback((v: FilterType) => setSelectedFilter(v), []);
  const handleEmergencyToggle = useCallback(() => setShowEmergencyFirst(p => !p), []);
  const handlePageChange      = useCallback((page: number) => setCurrentPage(page), []);

  const isStillLoading = isLoading || (campaigns && pendingCount > 0);

  const scrollToLearnMore = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="mx-auto max-w-7xl px-4 mt-4 sm:px-6 lg:px-8 pb-20">
      {/* Invisible status fetchers */}
      {campaigns?.map(campaign => (
        <CampaignStatusFetcher
          key={`status-${campaign.campaignAddress}`}
          campaignAddress={campaign.campaignAddress}
          onStatusResolved={handleStatusResolved}
        />
      ))}

      <div className="py-5">
        {/* ── Mini hero ── */}
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 leading-tight mb-2 text-center">
          Tulong na may <span className="text-blue-600">tiwala</span>.
        </h1>
        <p className="text-base text-gray-500 text-center mx-auto">
          AgaPay makes crowdfunding for disaster relief and social welfare transparent,
          tamper-proof, and direct — every peso tracked on the blockchain.
        </p>

        {/* ── Learn more arrow button ── */}
        <div className="flex justify-center mt-4 mb-6">
          
          <button
            onClick={scrollToLearnMore}
            className="group flex flex-col items-center gap-1 text-m text-slate-700 hover:text-blue-600 transition-colors"
            aria-label="Learn how AgaPay works"
          >
            <span className="w-7 h-7 m-2 rounded-full border border-slate-300 group-hover:border-blue-400 flex items-center justify-center transition-colors animate-bounce">
              ↓
            </span>
          </button>
        </div>
        {/* ── Campaigns header + controls ── */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex flex-col">
            <h2 className="text-4xl font-bold text-slate-800">Campaigns</h2>
            <p className="text-sm text-gray-600">
              Help others by donating to their campaigns, or start one for someone you care about.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <FilterSelect value={selectedFilter} onChange={handleFilterChange} />
            <button
              onClick={handleEmergencyToggle}
              className={`px-4 py-2 rounded-md font-bold transition-colors shadow-sm ${
                showEmergencyFirst
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {showEmergencyFirst ? 'EMERGENCY: ON' : 'EMERGENCY: OFF'}
            </button>
          </div>
        </div>

        {/* Loading indicator */}
        {isStillLoading && (
          <div className="text-center text-sm text-slate-500 mb-4">
            Loading campaigns... {campaigns ? `(${Object.keys(statusMap).length}/${campaigns.length})` : ''}
          </div>
        )}

        {/* Campaign grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-96 bg-slate-100 rounded-lg animate-pulse" />
            ))
          ) : visibleCampaigns.length > 0 ? (
            visibleCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.campaignAddress}
                campaignAddress={campaign.campaignAddress}
                showEmergencyFirst={showEmergencyFirst}
                creationTime={campaign.creationTime}
              />
            ))
          ) : pendingCount > 0 ? (
            Array.from({ length: Math.min(pendingCount, 3) }).map((_, i) => (
              <div key={i} className="h-96 bg-slate-100 rounded-lg animate-pulse" />
            ))
          ) : (
            <p className="col-span-3 text-center text-slate-400 py-10">
              No {selectedFilter !== 'all' ? selectedFilter : ''} campaigns found
            </p>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {/* ── How It Works — anchored below campaigns ── */}
      <div id="how-it-works">
        <HowItWorks />
      </div>
    </main>
  );
}