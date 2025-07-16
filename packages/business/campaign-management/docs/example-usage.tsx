/**
 * @company/campaign-management - Example Usage
 * 
 * This file demonstrates how to use the campaign management module
 * in a real-world application.
 */

import React, { useEffect, useState } from 'react';
import {
  initializeCampaignService,
  useCampaign,
  useCampaignDetails,
  useCampaignActions,
  useCampaignParticipants,
  CampaignStatusBadge,
  CampaignCard,
  CampaignProgress,
  Platform,
  ContentType,
  CampaignStatus,
  formatMoney,
  formatCampaignDate,
  getTimeRemaining
} from '@company/campaign-management';

// 1. Initialize the service (do this once in your app)
initializeCampaignService({
  apiUrl: process.env.REACT_APP_API_URL || 'https://api.example.com',
  apiKey: process.env.REACT_APP_API_KEY
});

// 2. Campaign List Component
export function CampaignListExample() {
  const { campaigns, loading, error, listCampaigns, setFilters } = useCampaign();
  const [selectedStatus, setSelectedStatus] = useState<CampaignStatus[]>([]);

  useEffect(() => {
    // Load campaigns with filters
    listCampaigns({
      status: selectedStatus.length > 0 ? selectedStatus : undefined,
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        end: new Date()
      }
    });
  }, [selectedStatus, listCampaigns]);

  if (loading) return <div>Loading campaigns...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Campaign Management</h1>
      
      {/* Filters */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Filter by Status</label>
        <select
          multiple
          value={selectedStatus}
          onChange={(e) => {
            const values = Array.from(e.target.selectedOptions, option => option.value as CampaignStatus);
            setSelectedStatus(values);
          }}
          className="w-full p-2 border rounded"
        >
          {Object.values(CampaignStatus).map(status => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {/* Campaign Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map(campaign => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            onClick={() => window.location.href = `/campaigns/${campaign.id}`}
          />
        ))}
      </div>
    </div>
  );
}

// 3. Campaign Detail Component
export function CampaignDetailExample({ campaignId }: { campaignId: string }) {
  const { campaign, loading, error } = useCampaignDetails(campaignId);
  const { publish, pause, resume, cancel } = useCampaignActions(campaignId);
  const { 
    applicants, 
    approveApplicant, 
    rejectApplicant 
  } = useCampaignParticipants(campaignId);

  if (loading) return <div>Loading campaign...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!campaign) return <div>Campaign not found</div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{campaign.title}</h1>
            <CampaignStatusBadge status={campaign.status} />
          </div>
          
          {/* Actions */}
          <div className="flex gap-2">
            {campaign.status === CampaignStatus.DRAFT && (
              <button
                onClick={() => publish()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Publish
              </button>
            )}
            {campaign.status === CampaignStatus.RECRUITING && (
              <button
                onClick={() => pause()}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Pause
              </button>
            )}
            {campaign.status === CampaignStatus.PAUSED && (
              <button
                onClick={() => resume()}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Resume
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Budget</h3>
          <p className="text-2xl font-bold">{formatMoney(campaign.budget.total)}</p>
          <p className="text-sm text-gray-600 mt-1">
            {formatBudgetUtilization(campaign.budget.allocated.amount, campaign.budget.total.amount)} allocated
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Recruitment Period</h3>
          <p className="text-sm">
            {formatCampaignDate(campaign.period.recruitStart)} - {formatCampaignDate(campaign.period.recruitEnd)}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {getTimeRemaining(campaign.period.recruitEnd)}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Participants</h3>
          <CampaignProgress
            recruited={campaign.participants.filter(p => p.status === 'approved').length}
            target={20} // Example target
          />
        </div>
      </div>

      {/* Applicants */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Applicants</h2>
        </div>
        <div className="divide-y">
          {applicants.map(applicant => (
            <div key={applicant.id} className="p-6 flex justify-between items-center">
              <div>
                <p className="font-medium">Influencer #{applicant.influencerId}</p>
                <p className="text-sm text-gray-600">Applied {formatCampaignDate(applicant.appliedAt)}</p>
              </div>
              
              {applicant.status === 'applied' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => approveApplicant(applicant.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => rejectApplicant(applicant.id, 'Does not meet requirements')}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              )}
              
              {applicant.status !== 'applied' && (
                <span className="text-sm text-gray-600">{applicant.status}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 4. Create Campaign Form Example
export function CreateCampaignExample() {
  const { createCampaign, loading, error } = useCampaign();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: [''],
    budget: 10000,
    minFollowers: 10000,
    platforms: [Platform.INSTAGRAM],
    contentTypes: [ContentType.POST],
    hashtags: ['']
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const campaign = await createCampaign({
        title: formData.title,
        description: formData.description,
        category: formData.category.filter(c => c),
        budget: {
          total: { amount: formData.budget, currency: 'USD' },
          currency: 'USD'
        },
        period: {
          recruitStart: new Date(),
          recruitEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          campaignStart: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days
          campaignEnd: new Date(Date.now() + 38 * 24 * 60 * 60 * 1000) // 38 days
        },
        requirements: {
          minFollowers: formData.minFollowers,
          platforms: formData.platforms,
          contentType: formData.contentTypes,
          hashtags: formData.hashtags.filter(h => h)
        }
      });
      
      // Redirect to campaign detail
      window.location.href = `/campaigns/${campaign.id}`;
    } catch (err) {
      console.error('Failed to create campaign:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Campaign</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
          {error.message}
        </div>
      )}
      
      {/* Title */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Campaign Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full p-2 border rounded"
          required
          minLength={5}
          maxLength={100}
        />
      </div>
      
      {/* Description */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full p-2 border rounded"
          rows={4}
          required
          minLength={20}
          maxLength={5000}
        />
      </div>
      
      {/* Budget */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Total Budget (USD)</label>
        <input
          type="number"
          value={formData.budget}
          onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
          className="w-full p-2 border rounded"
          min={100}
          required
        />
      </div>
      
      {/* Platforms */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Platforms</label>
        <div className="space-y-2">
          {Object.values(Platform).map(platform => (
            <label key={platform} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.platforms.includes(platform)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({ ...formData, platforms: [...formData.platforms, platform] });
                  } else {
                    setFormData({ ...formData, platforms: formData.platforms.filter(p => p !== platform) });
                  }
                }}
                className="mr-2"
              />
              {platform}
            </label>
          ))}
        </div>
      </div>
      
      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Campaign'}
      </button>
    </form>
  );
}

// Import helper function
import { formatBudgetUtilization } from '@company/campaign-management';