# @repo/campaign-management

Complete campaign lifecycle management module for influencer marketing platforms.

## Features

- **Campaign CRUD Operations**: Create, read, update, and delete campaigns
- **Status Management**: Full lifecycle from draft to settlement
- **Budget Tracking**: Real-time budget allocation and spending
- **Participant Management**: Recruit, approve, and manage influencers
- **Content Workflow**: Review and approve influencer content
- **Analytics & Metrics**: Track campaign performance in real-time
- **Export Capabilities**: Generate reports in PDF and Excel formats

## Installation

```bash
npm install @repo/campaign-management
# or
yarn add @repo/campaign-management
# or
pnpm add @repo/campaign-management
```

## Quick Start

```typescript
import { createCampaignManager, useCampaign } from '@repo/campaign-management';

// Initialize the module
const campaignManager = createCampaignManager({
  apiUrl: 'https://api.yourplatform.com',
  apiKey: 'your-api-key'
});

// Use in React component
function CampaignDashboard() {
  const { campaigns, loading, createCampaign } = useCampaign();
  
  const handleCreateCampaign = async () => {
    await createCampaign({
      title: 'Summer Fashion Campaign',
      description: 'Promote our new summer collection...',
      category: ['fashion', 'summer'],
      budget: {
        total: { amount: 50000, currency: 'USD' },
        currency: 'USD'
      },
      period: {
        recruitStart: new Date('2024-06-01'),
        recruitEnd: new Date('2024-06-07'),
        campaignStart: new Date('2024-06-08'),
        campaignEnd: new Date('2024-07-08')
      },
      requirements: {
        minFollowers: 10000,
        platforms: [Platform.INSTAGRAM, Platform.TIKTOK],
        contentType: [ContentType.POST, ContentType.REEL],
        hashtags: ['#SummerFashion', '#YourBrand']
      }
    });
  };
  
  return (
    <div>
      {/* Your UI */}
    </div>
  );
}
```

## Core Concepts

### Campaign Lifecycle

1. **Draft** → Campaign creation and editing
2. **Pending** → Awaiting approval
3. **Recruiting** → Open for influencer applications
4. **Active** → Campaign is running
5. **Completed** → Campaign has ended
6. **Settled** → Payments processed

### Campaign Structure

```typescript
interface Campaign {
  id: string;
  brandId: string;
  title: string;
  description: string;
  category: string[];
  budget: CampaignBudget;
  period: CampaignPeriod;
  requirements: CampaignRequirements;
  status: CampaignStatus;
  participants: Participant[];
}
```

## API Reference

### Hooks

#### `useCampaign()`
Main hook for campaign management.

```typescript
const {
  campaigns,
  currentCampaign,
  loading,
  error,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  listCampaigns
} = useCampaign();
```

#### `useCampaignDetails(id: string)`
Load and track a specific campaign.

```typescript
const { campaign, loading, error, refresh } = useCampaignDetails(campaignId);
```

#### `useCampaignActions(campaignId: string)`
Campaign-specific actions.

```typescript
const { publish, pause, resume, cancel, complete } = useCampaignActions(campaignId);
```

#### `useCampaignParticipants(campaignId: string)`
Manage campaign participants.

```typescript
const {
  applicants,
  approveApplicant,
  rejectApplicant,
  removeParticipant
} = useCampaignParticipants(campaignId);
```

### Services

#### `CampaignService`
Core service for API interactions.

```typescript
const service = new CampaignService({
  apiUrl: 'https://api.example.com',
  apiKey: 'your-api-key'
});

// Create campaign
const campaign = await service.createCampaign(data);

// Update status
await service.updateCampaignStatus(id, CampaignStatus.RECRUITING);

// Manage participants
await service.approveApplicant(campaignId, applicantId);
```

### Utilities

#### Validation Functions

```typescript
// Validate campaign data
const { isValid, errors } = validateCampaignData(data);

// Check status transitions
const canTransition = validateCampaignStatus(currentStatus, newStatus);

// Validate budget
const { isValid, allocated, remaining } = validateBudgetAllocation(total, allocations);
```

#### Helper Functions

```typescript
// Format money
formatMoney({ amount: 1000, currency: 'USD' }); // "$1,000"

// Calculate progress
const { recruitmentProgress, campaignProgress } = calculateCampaignProgress(campaign);

// Check permissions
canEditCampaign(campaign); // true/false
canPublishCampaign(campaign); // true/false
```

## Advanced Usage

### Custom Configuration

```typescript
const campaignManager = createCampaignManager({
  apiUrl: process.env.API_URL,
  apiKey: process.env.API_KEY,
  defaults: {
    validation: {
      title: { min: 10, max: 200 },
      budget: { min: 1000 }
    },
    defaults: {
      currency: 'EUR',
      platforms: [Platform.INSTAGRAM, Platform.YOUTUBE],
      minFollowers: 5000
    }
  }
});
```

### Event Handling

```typescript
import { EventBus } from '@repo/core';
import { CampaignEventType } from '@repo/campaign-management';

const eventBus = EventBus.getInstance();

// Listen for campaign events
eventBus.on(CampaignEventType.CREATED, (event) => {
  console.log('New campaign created:', event.data);
});

eventBus.on(CampaignEventType.PARTICIPANT_APPROVED, (event) => {
  console.log('Participant approved:', event.data);
});
```

### Export Functionality

```typescript
// Export campaign data
const csvData = exportCampaignToCSV(campaign, participants);

// Export full report
const reportBlob = await service.exportCampaignReport(campaignId, 'pdf');
```

## Best Practices

1. **Status Management**: Always use the provided status transition functions
2. **Budget Tracking**: Update budget allocations when approving participants
3. **Content Review**: Implement a clear approval workflow
4. **Error Handling**: Use try-catch blocks for all async operations
5. **Performance**: Use pagination for large participant lists

## Error Handling

```typescript
try {
  await createCampaign(data);
} catch (error) {
  if (error.code === 'BUDGET_EXCEEDED') {
    // Handle budget error
  } else if (error.code === 'INVALID_DATES') {
    // Handle date validation error
  }
}
```

## TypeScript Support

This module is written in TypeScript and provides complete type definitions.

```typescript
import type {
  Campaign,
  CampaignStatus,
  Participant,
  CreateCampaignRequest
} from '@repo/campaign-management';
```

## Contributing

See the main repository's contributing guidelines.

## License

MIT

---

For more information, visit the [documentation site](https://docs.yourplatform.com/modules/campaign-management).