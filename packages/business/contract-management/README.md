# Contract Management Module

A comprehensive electronic contract management system for LinkPick platform that handles contract creation, e-signatures, and contract lifecycle management.

## Features

- **Contract Templates**
  - Pre-built templates for common contracts
  - Custom template creation
  - Variable placeholders
  - Multi-language support
  
- **Electronic Signatures**
  - Digital signature collection
  - Multi-party signing workflows
  - Signature verification
  - Audit trail
  
- **Contract Lifecycle**
  - Draft → Review → Sent → Signed → Active → Expired
  - Automatic reminders
  - Expiration alerts
  - Renewal management
  
- **Document Management**
  - PDF generation
  - Version control
  - Secure storage
  - Access control

## Installation

```bash
npm install @modules/contract-management
```

## Usage

### Basic Setup

```typescript
import { ContractManagement } from '@modules/contract-management';

const contractManager = new ContractManagement({
  storage: {
    provider: 's3',
    bucket: 'contracts'
  },
  signing: {
    provider: 'internal', // or 'docusign', 'hellosign'
    certificatePath: '/path/to/certificate.p12'
  },
  notifications: {
    emailProvider: 'sendgrid',
    smsProvider: 'twilio'
  }
});
```

### Creating a Contract from Template

```typescript
// Load a template
const template = await contractManager.templates.getTemplate('influencer-agreement');

// Create contract from template
const contract = await contractManager.contracts.create({
  templateId: template.id,
  parties: [
    {
      type: 'brand',
      name: 'ABC Company',
      email: 'legal@abccompany.com',
      role: 'client'
    },
    {
      type: 'influencer',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'contractor'
    }
  ],
  variables: {
    campaignName: 'Summer Product Launch',
    startDate: '2024-06-01',
    endDate: '2024-08-31',
    compensation: '$5,000',
    deliverables: [
      '3 Instagram posts',
      '2 Instagram stories',
      '1 YouTube video'
    ]
  },
  metadata: {
    campaignId: 'campaign123',
    brandId: 'brand456',
    influencerId: 'influencer789'
  }
});

console.log('Contract created:', contract.id);
```

### Managing Templates

```typescript
// Create a custom template
const customTemplate = await contractManager.templates.create({
  name: 'Custom Service Agreement',
  category: 'service',
  content: `
    <h1>Service Agreement</h1>
    <p>This agreement is between {{client.name}} and {{contractor.name}}.</p>
    <p>Services: {{services}}</p>
    <p>Term: {{startDate}} to {{endDate}}</p>
    <p>Compensation: {{compensation}}</p>
  `,
  variables: [
    { name: 'client.name', type: 'string', required: true },
    { name: 'contractor.name', type: 'string', required: true },
    { name: 'services', type: 'text', required: true },
    { name: 'startDate', type: 'date', required: true },
    { name: 'endDate', type: 'date', required: true },
    { name: 'compensation', type: 'string', required: true }
  ],
  signingOrder: ['client', 'contractor']
});

// List available templates
const templates = await contractManager.templates.list({
  category: 'influencer'
});
```

### Electronic Signature Flow

```typescript
// Send contract for signing
await contractManager.contracts.send(contract.id, {
  message: 'Please review and sign the attached agreement.',
  reminderDays: [3, 7],
  expiresIn: 30 // days
});

// Track signing status
const status = await contractManager.contracts.getSigningStatus(contract.id);
console.log('Signing status:', status);
// Output: { 
//   brand: { signed: false, sentAt: '2024-01-01', viewedAt: null },
//   influencer: { signed: false, sentAt: '2024-01-01', viewedAt: null }
// }

// Sign a contract (from signer's perspective)
const signedContract = await contractManager.contracts.sign({
  contractId: contract.id,
  signerEmail: 'john@example.com',
  signature: {
    type: 'drawn', // or 'typed', 'uploaded'
    data: 'base64-signature-data'
  },
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...'
});
```

### Contract Search and Filtering

```typescript
// Search contracts
const contracts = await contractManager.contracts.search({
  status: ['active', 'signed'],
  parties: {
    email: 'john@example.com'
  },
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31')
  },
  metadata: {
    campaignId: 'campaign123'
  }
});

// Get contracts expiring soon
const expiringContracts = await contractManager.contracts.getExpiring({
  days: 30,
  status: 'active'
});
```

### Webhooks and Events

```typescript
// Listen for contract events
contractManager.on('contract:created', (contract) => {
  console.log('New contract created:', contract.id);
});

contractManager.on('contract:signed', (data) => {
  console.log(`Contract ${data.contractId} signed by ${data.signerEmail}`);
});

contractManager.on('contract:completed', (contract) => {
  console.log('All parties have signed:', contract.id);
});

contractManager.on('contract:expired', (contract) => {
  console.log('Contract expired:', contract.id);
});
```

## API Reference

### Contract Service

```typescript
interface ContractService {
  create(params: CreateContractParams): Promise<Contract>;
  get(contractId: string): Promise<Contract>;
  update(contractId: string, updates: Partial<Contract>): Promise<Contract>;
  delete(contractId: string): Promise<void>;
  send(contractId: string, options: SendOptions): Promise<void>;
  sign(params: SignContractParams): Promise<Contract>;
  search(filters: SearchFilters): Promise<Contract[]>;
  getExpiring(params: ExpiringParams): Promise<Contract[]>;
  getSigningStatus(contractId: string): Promise<SigningStatus>;
  downloadPDF(contractId: string): Promise<Buffer>;
  getAuditTrail(contractId: string): Promise<AuditEntry[]>;
}
```

### Template Service

```typescript
interface TemplateService {
  create(template: CreateTemplateParams): Promise<Template>;
  update(templateId: string, updates: Partial<Template>): Promise<Template>;
  delete(templateId: string): Promise<void>;
  get(templateId: string): Promise<Template>;
  list(filters?: TemplateFilters): Promise<Template[]>;
  preview(templateId: string, variables: Record<string, any>): Promise<string>;
  duplicate(templateId: string, name: string): Promise<Template>;
}
```

### Types

```typescript
interface Contract {
  id: string;
  templateId?: string;
  title: string;
  content: string;
  parties: Party[];
  status: ContractStatus;
  signatures: Signature[];
  variables: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  completedAt?: Date;
  expiresAt?: Date;
  version: number;
}

interface Party {
  id: string;
  type: 'brand' | 'influencer' | 'agency' | 'other';
  name: string;
  email: string;
  phone?: string;
  role: string;
  signingOrder?: number;
}

interface Signature {
  partyId: string;
  type: 'drawn' | 'typed' | 'uploaded';
  data: string;
  signedAt: Date;
  ipAddress: string;
  userAgent: string;
  verified: boolean;
}

enum ContractStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  SENT = 'sent',
  PARTIALLY_SIGNED = 'partially_signed',
  SIGNED = 'signed',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}
```

## Configuration

### Environment Variables

```env
# Storage
CONTRACT_STORAGE_PROVIDER=s3
CONTRACT_STORAGE_BUCKET=linkpick-contracts
CONTRACT_STORAGE_REGION=us-east-1

# Signing
CONTRACT_SIGNING_PROVIDER=internal
CONTRACT_CERTIFICATE_PATH=/path/to/certificate.p12
CONTRACT_CERTIFICATE_PASSWORD=your-password

# Encryption
CONTRACT_ENCRYPTION_KEY=your-encryption-key

# Notifications
CONTRACT_EMAIL_PROVIDER=sendgrid
CONTRACT_SMS_PROVIDER=twilio
```

### Security Features

- End-to-end encryption for sensitive data
- Digital signature verification
- Access control and permissions
- Comprehensive audit trail
- GDPR compliant data handling

## Examples

### Complete Contract Flow

```typescript
// 1. Create contract
const contract = await contractManager.contracts.create({
  templateId: 'influencer-agreement',
  parties: [...],
  variables: {...}
});

// 2. Review and modify if needed
await contractManager.contracts.update(contract.id, {
  variables: {
    ...contract.variables,
    additionalTerms: 'Special conditions...'
  }
});

// 3. Send for signatures
await contractManager.contracts.send(contract.id, {
  message: 'Please sign the agreement',
  reminderDays: [3, 7]
});

// 4. Monitor signing progress
contractManager.on('contract:viewed', ({ contractId, viewerEmail }) => {
  console.log(`${viewerEmail} viewed contract ${contractId}`);
});

contractManager.on('contract:signed', ({ contractId, signerEmail }) => {
  console.log(`${signerEmail} signed contract ${contractId}`);
});

// 5. Handle completion
contractManager.on('contract:completed', async (contract) => {
  // All parties have signed
  const pdf = await contractManager.contracts.downloadPDF(contract.id);
  // Store or send the final PDF
});
```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## License

MIT