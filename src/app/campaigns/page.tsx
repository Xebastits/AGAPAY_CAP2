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

// Hook to fetch campaign status - called for each campaign
function useCampaignStatus(campaignAddress: string): CampaignStatus {
  const contract = useMemo(() => getContract({
    client,
    chain: arcTestnet,
    address: campaignAddress,
  }), [campaignAddress]);

  const { data: state } = useReadContract({ contract, method: "function state() view returns (uint8)", params: [] });
  const { data: deadline } = useReadContract({ contract, method: "function deadline() view returns (uint256)", params: [] });
  const { data: balance } = useReadContract({ contract, method: "function getContractBalance() view returns (uint256)", params: [] });
  const { data: goal } = useReadContract({ contract, method: "function goal() view returns (uint256)", params: [] });

  return useMemo(() => {
    if (state === undefined || !deadline || balance === undefined || goal === undefined) {
      return 'unknown';
    }

    const now = Date.now() / 1000;
    const isExpired = now >= Number(deadline);
    const isGoalMet = balance >= goal;

    if (state === 2 || (state === 0 && isExpired && !isGoalMet)) return 'failed';
    if (state === 1 || (state === 0 && isGoalMet)) return 'successful';
    if (state === 0 && !isExpired && !isGoalMet) return 'active';
    return 'unknown';
  }, [state, deadline, balance, goal]);
}

// Component that fetches status and reports it up
const CampaignStatusFetcher = memo(({
  campaignAddress,
  onStatusResolved
}: {
  campaignAddress: string;
  onStatusResolved: (address: string, status: CampaignStatus) => void;
}) => {
  const status = useCampaignStatus(campaignAddress);

  useEffect(() => {
    if (status !== 'unknown') {
      onStatusResolved(campaignAddress, status);
    }
  }, [campaignAddress, status, onStatusResolved]);

  return null; // Invisible component
});
CampaignStatusFetcher.displayName = 'CampaignStatusFetcher';

// Simple card wrapper
const CampaignCard = memo(({
  campaignAddress,
  showEmergencyFirst,
  creationTime
}: {
  campaignAddress: string;
  showEmergencyFirst: boolean;
  creationTime: bigint;
}) => (
  <MyCampaignCard
    campaignAddress={campaignAddress}
    showEmergencyFirst={showEmergencyFirst}
    creationTime={creationTime}
  />
));
CampaignCard.displayName = 'CampaignCard';

export default function CampaignsPage() {
  const [showEmergencyFirst, setShowEmergencyFirst] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusMap, setStatusMap] = useState<Record<string, CampaignStatus>>({});

  const contract = useMemo(() => getContract({
    client,
    chain: arcTestnet,
    address: CROWDFUNDING_FACTORY,
  }), []);

  const { data: campaigns, isLoading } = useReadContract({
    contract,
    method: "function getAllCampaigns() view returns ((address campaignAddress, address owner, string name, uint256 creationTime)[])",
    params: []
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setShowEmergencyFirst(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(showEmergencyFirst));
  }, [showEmergencyFirst]);

  // Stable callback for status updates
  const handleStatusResolved = useCallback((address: string, status: CampaignStatus) => {
    setStatusMap(prev => {
      if (prev[address] === status) return prev; // No change
      return { ...prev, [address]: status };
    });
  }, []);

  // Filter and sort campaigns based on resolved statuses
  const { filteredCampaigns, pendingCount } = useMemo(() => {
    if (!campaigns?.length) return { filteredCampaigns: [], pendingCount: 0 };

    let pending = 0;
    const filtered = campaigns.filter(campaign => {
      const status = statusMap[campaign.campaignAddress];
      if (!status || status === 'unknown') {
        pending++;
        return false; // Still loading
      }
      return selectedFilter === 'all' || status === selectedFilter;
    });

    // Sort
    filtered.sort((a, b) => {
      if (showEmergencyFirst) {
        const aEmergency = a.name.toLowerCase().includes('emergency');
        const bEmergency = b.name.toLowerCase().includes('emergency');
        if (aEmergency !== bEmergency) return aEmergency ? -1 : 1;
      }
      return Number(b.creationTime - a.creationTime);
    });

    return { filteredCampaigns: filtered, pendingCount: pending };
  }, [campaigns, statusMap, selectedFilter, showEmergencyFirst]);

  // Pagination based on filtered results
  const totalPages = Math.max(1, Math.ceil(filteredCampaigns.length / ITEMS_PER_PAGE));

  // Auto-adjust page if it exceeds total
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter, showEmergencyFirst]);

  const visibleCampaigns = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCampaigns.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCampaigns, currentPage]);

  const handleFilterChange = useCallback((v: FilterType) => setSelectedFilter(v), []);
  const handleEmergencyToggle = useCallback(() => setShowEmergencyFirst(p => !p), []);
  const handlePageChange = useCallback((page: number) => setCurrentPage(page), []);

  const isStillLoading = isLoading || (campaigns && pendingCount > 0);

  return (
    <main className="mx-auto max-w-7xl px-4 mt-4 sm:px-6 lg:px-8 pb-20">
      {/* Invisible status fetchers for all campaigns */}
      {campaigns?.map(campaign => (
        <CampaignStatusFetcher
          key={`status-${campaign.campaignAddress}`}
          campaignAddress={campaign.campaignAddress}
          onStatusResolved={handleStatusResolved}
        />
      ))}

      <div className="py-5">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex flex-col">
            <h1 className="text-4xl font-bold text-slate-800">Campaigns</h1>
            <p className="text-sm text-gray-600">
              Help others by donating to their campaigns, or start one for someone you care about.
            </p>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center space-x-4">
            <FilterSelect value={selectedFilter} onChange={handleFilterChange} />

            <button
              onClick={handleEmergencyToggle}
              className={`px-4 py-2 rounded-md font-bold transition-colors shadow-sm ${showEmergencyFirst
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Initial skeleton
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
            // Still loading statuses
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
    </main>
  );
}