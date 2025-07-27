// Temporary patch for missing database columns
// Remove this file after database migration is complete

export const MISSING_CAMPAIGN_FIELDS = [
  'deliverables',
  'detailedRequirements',
  'location',
  'maxApplicants',
  'productImages',
  'productIntro',
  'viewCount',
  'detailImages',
  'platforms',
  'rewardAmount'
];

// Default values for missing fields
export const CAMPAIGN_FIELD_DEFAULTS = {
  deliverables: null,
  detailedRequirements: null,
  location: '전국',
  maxApplicants: 100,
  productImages: null,
  productIntro: null,
  viewCount: 0,
  detailImages: null,
  platforms: null,
  rewardAmount: 0
};

// Helper to exclude missing fields from Prisma select
export function excludeMissingFields(selectObject: Record<string, any>): Record<string, any> {
  const filtered = { ...selectObject };
  MISSING_CAMPAIGN_FIELDS.forEach(field => {
    delete filtered[field];
  });
  return filtered;
}

// Helper to add default values to campaign data
export function addDefaultFields(campaign: any): any {
  return {
    ...campaign,
    ...Object.entries(CAMPAIGN_FIELD_DEFAULTS).reduce((acc, [key, value]) => {
      if (!(key in campaign)) {
        acc[key] = value;
      }
      return acc;
    }, {} as any)
  };
}