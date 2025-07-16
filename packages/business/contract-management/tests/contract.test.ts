import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ContractManagement,
  ContractStatus,
  PartyType,
  PartyRole,
  TemplateCategory
} from '../src';

describe('ContractManagement', () => {
  let contractManager: ContractManagement;

  beforeEach(() => {
    contractManager = new ContractManagement({
      storage: {
        provider: 'local',
        path: './test-contracts'
      }
    });
  });

  describe('Contract Creation', () => {
    it('should create a contract from template', async () => {
      const contract = await contractManager.createContract({
        templateId: 'influencer-agreement',
        parties: [
          {
            type: PartyType.BRAND,
            name: 'Test Brand',
            email: 'brand@example.com',
            role: PartyRole.CLIENT
          },
          {
            type: PartyType.INFLUENCER,
            name: 'Test Influencer',
            email: 'influencer@example.com',
            role: PartyRole.CONTRACTOR
          }
        ],
        variables: {
          agreementDate: new Date(),
          'client.name': 'Test Brand',
          'influencer.name': 'Test Influencer',
          campaignName: 'Test Campaign',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          deliverables: ['3 Instagram posts', '2 Stories'],
          compensation: '$5,000',
          paymentTerms: 'Net 30'
        }
      });

      expect(contract.id).toBeDefined();
      expect(contract.status).toBe(ContractStatus.DRAFT);
      expect(contract.parties).toHaveLength(2);
      expect(contract.templateId).toBe('influencer-agreement');
    });

    it('should create a custom contract', async () => {
      const contract = await contractManager.createContract({
        title: 'Custom Service Agreement',
        content: 'This is a custom contract between parties...',
        parties: [
          {
            type: PartyType.BRAND,
            name: 'Client Company',
            email: 'client@example.com',
            role: PartyRole.CLIENT
          },
          {
            type: PartyType.OTHER,
            name: 'Service Provider',
            email: 'provider@example.com',
            role: PartyRole.CONTRACTOR
          }
        ]
      });

      expect(contract.title).toBe('Custom Service Agreement');
      expect(contract.content).toContain('custom contract');
      expect(contract.templateId).toBeUndefined();
    });
  });

  describe('Contract Signing', () => {
    it('should allow parties to sign contract', async () => {
      const contract = await contractManager.createContract({
        title: 'Test Contract',
        content: 'Test content',
        parties: [
          {
            type: PartyType.BRAND,
            name: 'Brand',
            email: 'brand@example.com',
            role: PartyRole.CLIENT
          },
          {
            type: PartyType.INFLUENCER,
            name: 'Influencer',
            email: 'influencer@example.com',
            role: PartyRole.CONTRACTOR
          }
        ]
      });

      // Send contract
      await contractManager.sendContract(contract.id, {
        message: 'Please sign this contract'
      });

      // Sign as first party
      const signedContract = await contractManager.signContract({
        contractId: contract.id,
        signerEmail: 'brand@example.com',
        signature: {
          type: 'typed',
          data: 'Brand Representative'
        },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0'
      });

      expect(signedContract.status).toBe(ContractStatus.PARTIALLY_SIGNED);
      expect(signedContract.signatures).toHaveLength(1);
    });
  });

  describe('Template Management', () => {
    it('should list available templates', async () => {
      const templates = await contractManager.listTemplates();
      
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.some(t => t.id === 'influencer-agreement')).toBe(true);
      expect(templates.some(t => t.id === 'nda-standard')).toBe(true);
    });

    it('should create custom template', async () => {
      const template = await contractManager.createTemplate({
        name: 'Custom Template',
        category: TemplateCategory.CUSTOM,
        content: 'Agreement between {{party1}} and {{party2}}',
        variables: [
          {
            name: 'party1',
            type: 'string',
            label: 'First Party',
            required: true
          },
          {
            name: 'party2',
            type: 'string',
            label: 'Second Party',
            required: true
          }
        ]
      });

      expect(template.name).toBe('Custom Template');
      expect(template.variables).toHaveLength(2);
    });

    it('should preview template with variables', async () => {
      const preview = await contractManager.previewTemplate('influencer-agreement', {
        agreementDate: new Date('2024-01-01'),
        'client.name': 'ABC Company',
        'influencer.name': 'John Doe',
        campaignName: 'Summer Campaign',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-08-31'),
        deliverables: ['5 posts', '10 stories'],
        compensation: '$10,000',
        paymentTerms: 'Net 15'
      });

      expect(preview).toContain('ABC Company');
      expect(preview).toContain('John Doe');
      expect(preview).toContain('Summer Campaign');
    });
  });

  describe('Contract Search', () => {
    it('should search contracts by status', async () => {
      // Create some contracts
      await contractManager.createContract({
        title: 'Draft Contract',
        content: 'Content',
        parties: [
          { type: PartyType.BRAND, name: 'Brand', email: 'brand@example.com', role: PartyRole.CLIENT },
          { type: PartyType.INFLUENCER, name: 'Influencer', email: 'inf@example.com', role: PartyRole.CONTRACTOR }
        ]
      });

      const contracts = await contractManager.searchContracts({
        status: [ContractStatus.DRAFT]
      });

      expect(contracts.length).toBeGreaterThan(0);
      expect(contracts.every(c => c.status === ContractStatus.DRAFT)).toBe(true);
    });

    it('should search contracts by party email', async () => {
      const testEmail = 'specific@example.com';
      
      await contractManager.createContract({
        title: 'Specific Contract',
        content: 'Content',
        parties: [
          { type: PartyType.BRAND, name: 'Brand', email: testEmail, role: PartyRole.CLIENT },
          { type: PartyType.INFLUENCER, name: 'Influencer', email: 'inf@example.com', role: PartyRole.CONTRACTOR }
        ]
      });

      const contracts = await contractManager.searchContracts({
        parties: { email: testEmail }
      });

      expect(contracts.length).toBeGreaterThan(0);
      expect(contracts.some(c => 
        c.parties.some(p => p.email === testEmail)
      )).toBe(true);
    });
  });

  describe('Audit Trail', () => {
    it('should track contract activities', async () => {
      const contract = await contractManager.createContract({
        title: 'Audited Contract',
        content: 'Content',
        parties: [
          { type: PartyType.BRAND, name: 'Brand', email: 'brand@example.com', role: PartyRole.CLIENT },
          { type: PartyType.INFLUENCER, name: 'Influencer', email: 'inf@example.com', role: PartyRole.CONTRACTOR }
        ]
      });

      const auditTrail = await contractManager.getContractAuditTrail(contract.id);

      expect(auditTrail.length).toBeGreaterThan(0);
      expect(auditTrail[0].action).toBe('created');
      expect(auditTrail[0].contractId).toBe(contract.id);
    });
  });
});