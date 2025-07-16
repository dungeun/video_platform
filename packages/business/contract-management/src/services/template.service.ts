import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import Handlebars from 'handlebars';
import {
  Template,
  TemplateCategory,
  CreateTemplateParams,
  TemplateFilters,
  TemplateVariable,
  TemplateError,
  ValidationError
} from '../types';
import { StorageService } from './storage.service';

export class TemplateService extends EventEmitter {
  private templates: Map<string, Template> = new Map();
  private storageService: StorageService;
  private handlebars: typeof Handlebars;

  constructor(storageService: StorageService) {
    super();
    this.storageService = storageService;
    this.handlebars = Handlebars.create();
    
    this.registerHelpers();
    this.loadDefaultTemplates();
  }

  private registerHelpers(): void {
    // Date formatting helper
    this.handlebars.registerHelper('formatDate', (date: Date | string, format: string) => {
      const d = new Date(date);
      if (format === 'short') {
        return d.toLocaleDateString();
      }
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    });

    // Currency helper
    this.handlebars.registerHelper('currency', (amount: number, currency: string = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency
      }).format(amount);
    });

    // List helper
    this.handlebars.registerHelper('list', (items: string[]) => {
      if (!items || items.length === 0) return '';
      return '<ul>' + items.map(item => `<li>${item}</li>`).join('') + '</ul>';
    });

    // Conditional helper
    this.handlebars.registerHelper('ifEquals', function(arg1: any, arg2: any, options: any) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });
  }

  private async loadDefaultTemplates(): Promise<void> {
    // Load default templates
    const defaultTemplates = await this.getDefaultTemplates();
    
    for (const template of defaultTemplates) {
      this.templates.set(template.id, template);
    }
  }

  private async getDefaultTemplates(): Promise<Template[]> {
    return [
      {
        id: 'influencer-agreement',
        name: 'Influencer Marketing Agreement',
        description: 'Standard agreement for influencer marketing campaigns',
        category: TemplateCategory.INFLUENCER,
        content: `
# INFLUENCER MARKETING AGREEMENT

This Agreement is entered into as of {{agreementDate}} between:

**Client:** {{client.name}} ("Brand")
**Influencer:** {{influencer.name}} ("Influencer")

## 1. CAMPAIGN DETAILS

Campaign Name: {{campaignName}}
Campaign Period: {{startDate}} to {{endDate}}

## 2. DELIVERABLES

The Influencer agrees to create and publish the following content:
{{list deliverables}}

## 3. COMPENSATION

Total Compensation: {{compensation}}
Payment Terms: {{paymentTerms}}

## 4. CONTENT REQUIREMENTS

- All content must be original and created by the Influencer
- Content must comply with FTC guidelines and include proper disclosures
- Brand has the right to review content before publication

## 5. USAGE RIGHTS

{{#if unlimitedUsage}}
Brand receives unlimited usage rights to all content created under this agreement.
{{else}}
Brand may use the content for {{usageMonths}} months from the publication date.
{{/if}}

## 6. CONFIDENTIALITY

Both parties agree to keep all confidential information private and not disclose to third parties.

## 7. TERMINATION

Either party may terminate this agreement with {{terminationDays}} days written notice.

**AGREED AND ACCEPTED:**

_______________________
{{client.name}}
Date: _________________

_______________________
{{influencer.name}}
Date: _________________
        `,
        variables: [
          { name: 'agreementDate', type: 'date', label: 'Agreement Date', required: true },
          { name: 'client.name', type: 'string', label: 'Client Name', required: true },
          { name: 'influencer.name', type: 'string', label: 'Influencer Name', required: true },
          { name: 'campaignName', type: 'string', label: 'Campaign Name', required: true },
          { name: 'startDate', type: 'date', label: 'Start Date', required: true },
          { name: 'endDate', type: 'date', label: 'End Date', required: true },
          { name: 'deliverables', type: 'array', label: 'Deliverables', required: true },
          { name: 'compensation', type: 'string', label: 'Total Compensation', required: true },
          { name: 'paymentTerms', type: 'string', label: 'Payment Terms', required: true },
          { name: 'unlimitedUsage', type: 'boolean', label: 'Unlimited Usage Rights', required: false, defaultValue: false },
          { name: 'usageMonths', type: 'number', label: 'Usage Months', required: false, defaultValue: 12 },
          { name: 'terminationDays', type: 'number', label: 'Termination Notice Days', required: false, defaultValue: 30 }
        ],
        signingOrder: ['client', 'contractor'],
        defaultExpiry: 30,
        tags: ['influencer', 'marketing', 'campaign'],
        isActive: true,
        version: 1,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'nda-standard',
        name: 'Non-Disclosure Agreement',
        description: 'Standard NDA for protecting confidential information',
        category: TemplateCategory.NDA,
        content: `
# NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into as of {{effectiveDate}} between:

**Disclosing Party:** {{disclosingParty.name}}
**Receiving Party:** {{receivingParty.name}}

## 1. DEFINITION OF CONFIDENTIAL INFORMATION

"Confidential Information" means any and all information or data that has or could have commercial value or other utility in the business in which Disclosing Party is engaged.

## 2. OBLIGATIONS OF RECEIVING PARTY

Receiving Party agrees to:
- Hold Confidential Information in strict confidence
- Not disclose Confidential Information to third parties
- Use Confidential Information solely for the purpose of {{purpose}}

## 3. TIME PERIODS

This Agreement shall remain in effect for {{duration}} years from the date first written above.

## 4. EXCLUSIONS

This Agreement does not apply to information that:
- Is or becomes publicly known through no breach by Receiving Party
- Is rightfully received by Receiving Party from a third party
- Is independently developed by Receiving Party

**AGREED TO:**

_______________________
{{disclosingParty.name}}
Date: _________________

_______________________
{{receivingParty.name}}
Date: _________________
        `,
        variables: [
          { name: 'effectiveDate', type: 'date', label: 'Effective Date', required: true },
          { name: 'disclosingParty.name', type: 'string', label: 'Disclosing Party Name', required: true },
          { name: 'receivingParty.name', type: 'string', label: 'Receiving Party Name', required: true },
          { name: 'purpose', type: 'string', label: 'Purpose', required: true },
          { name: 'duration', type: 'number', label: 'Duration (years)', required: true, defaultValue: 2 }
        ],
        signingOrder: ['client', 'contractor'],
        defaultExpiry: 14,
        tags: ['nda', 'confidentiality'],
        isActive: true,
        version: 1,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  async create(params: CreateTemplateParams): Promise<Template> {
    // Validate template
    this.validateTemplate(params);

    const template: Template = {
      id: uuidv4(),
      name: params.name,
      description: params.description,
      category: params.category,
      content: params.content,
      contentHtml: this.convertToHtml(params.content),
      variables: params.variables,
      clauses: params.clauses,
      signingOrder: params.signingOrder,
      defaultExpiry: params.defaultExpiry,
      tags: params.tags,
      isActive: true,
      version: 1,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Test compile the template
    try {
      this.handlebars.compile(template.content);
    } catch (error: any) {
      throw new TemplateError(`Invalid template syntax: ${error.message}`);
    }

    // Store template
    this.templates.set(template.id, template);
    await this.storageService.saveTemplate(template);

    this.emit('template:created', template);
    return template;
  }

  async update(templateId: string, updates: Partial<Template>): Promise<Template> {
    const template = await this.get(templateId);

    const updatedTemplate: Template = {
      ...template,
      ...updates,
      updatedAt: new Date(),
      version: template.version + 1
    };

    // Re-validate if content changed
    if (updates.content) {
      try {
        this.handlebars.compile(updatedTemplate.content);
        updatedTemplate.contentHtml = this.convertToHtml(updatedTemplate.content);
      } catch (error: any) {
        throw new TemplateError(`Invalid template syntax: ${error.message}`);
      }
    }

    this.templates.set(templateId, updatedTemplate);
    await this.storageService.saveTemplate(updatedTemplate);

    this.emit('template:updated', updatedTemplate);
    return updatedTemplate;
  }

  async delete(templateId: string): Promise<void> {
    const template = await this.get(templateId);

    // Soft delete - just mark as inactive
    await this.update(templateId, { isActive: false });

    this.emit('template:deleted', { templateId });
  }

  async get(templateId: string): Promise<Template> {
    let template = this.templates.get(templateId);
    
    if (!template) {
      template = await this.storageService.getTemplate(templateId);
      if (!template) {
        throw new TemplateError(`Template ${templateId} not found`);
      }
      this.templates.set(templateId, template);
    }

    return template;
  }

  async list(filters?: TemplateFilters): Promise<Template[]> {
    let templates = Array.from(this.templates.values());

    if (filters) {
      if (filters.category) {
        templates = templates.filter(t => t.category === filters.category);
      }

      if (filters.isActive !== undefined) {
        templates = templates.filter(t => t.isActive === filters.isActive);
      }

      if (filters.tags && filters.tags.length > 0) {
        templates = templates.filter(t => 
          filters.tags!.some(tag => t.tags?.includes(tag))
        );
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        templates = templates.filter(t => 
          t.name.toLowerCase().includes(searchLower) ||
          t.description?.toLowerCase().includes(searchLower) ||
          t.content.toLowerCase().includes(searchLower)
        );
      }
    }

    return templates.sort((a, b) => a.name.localeCompare(b.name));
  }

  async preview(templateId: string, variables: Record<string, any>): Promise<string> {
    const template = await this.get(templateId);
    return this.renderTemplate(template, variables);
  }

  async renderTemplate(template: Template, variables: Record<string, any>): Promise<string> {
    // Validate required variables
    const missing = template.variables
      .filter(v => v.required && !variables[v.name])
      .map(v => v.name);

    if (missing.length > 0) {
      throw new ValidationError(
        `Missing required variables: ${missing.join(', ')}`,
        missing
      );
    }

    // Apply default values
    const finalVariables = { ...variables };
    for (const variable of template.variables) {
      if (variable.defaultValue !== undefined && !finalVariables[variable.name]) {
        finalVariables[variable.name] = variable.defaultValue;
      }
    }

    // Compile and render
    try {
      const compiledTemplate = this.handlebars.compile(template.content);
      return compiledTemplate(finalVariables);
    } catch (error: any) {
      throw new TemplateError(`Failed to render template: ${error.message}`);
    }
  }

  async duplicate(templateId: string, name: string): Promise<Template> {
    const source = await this.get(templateId);
    
    return this.create({
      name,
      description: `Copy of ${source.description}`,
      category: source.category,
      content: source.content,
      variables: source.variables,
      clauses: source.clauses,
      signingOrder: source.signingOrder,
      defaultExpiry: source.defaultExpiry,
      tags: [...(source.tags || []), 'duplicate']
    });
  }

  private validateTemplate(params: CreateTemplateParams): void {
    if (!params.name || params.name.trim().length === 0) {
      throw new ValidationError('Template name is required');
    }

    if (!params.content || params.content.trim().length === 0) {
      throw new ValidationError('Template content is required');
    }

    // Extract variables from content
    const contentVariables = this.extractVariables(params.content);
    const definedVariables = params.variables.map(v => v.name);

    // Check for undefined variables
    const undefinedVars = contentVariables.filter(v => !definedVariables.includes(v));
    if (undefinedVars.length > 0) {
      throw new ValidationError(
        `Template contains undefined variables: ${undefinedVars.join(', ')}`,
        undefinedVars
      );
    }
  }

  private extractVariables(content: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = regex.exec(content)) !== null) {
      const variable = match[1].trim();
      // Skip helpers and complex expressions
      if (!variable.includes('(') && !variable.startsWith('#') && !variable.startsWith('/')) {
        variables.add(variable.split(' ')[0]);
      }
    }

    return Array.from(variables);
  }

  private convertToHtml(content: string): string {
    // Simple markdown to HTML conversion
    return content
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .split('\n\n')
      .map(p => p.trim() ? `<p>${p}</p>` : '')
      .join('\n');
  }
}