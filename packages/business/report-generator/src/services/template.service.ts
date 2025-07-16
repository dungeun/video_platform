import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  ReportTemplate,
  ReportFormat,
  SectionType,
  TemplateError
} from '../types';

export class TemplateService extends EventEmitter {
  private templates: Map<string, ReportTemplate> = new Map();
  private templatePath?: string;

  constructor(templatePath?: string) {
    super();
    this.templatePath = templatePath;
    this.loadBuiltInTemplates();
  }

  private async loadBuiltInTemplates(): Promise<void> {
    // Campaign Performance Report Template
    this.templates.set('campaign-performance', {
      id: 'campaign-performance',
      name: 'Campaign Performance Report',
      description: 'Comprehensive campaign performance analysis',
      format: ReportFormat.PDF,
      category: 'campaign',
      layout: {
        orientation: 'portrait',
        pageSize: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      },
      sections: [
        {
          id: 'header',
          type: SectionType.HEADER,
          content: {
            title: 'Campaign Performance Report',
            subtitle: '{{campaign.name}}',
            logo: '{{company.logo}}'
          }
        },
        {
          id: 'summary',
          type: SectionType.SUMMARY,
          title: 'Executive Summary',
          content: {
            metrics: [
              { label: 'Total Reach', value: '{{metrics.totalReach}}', change: '{{metrics.reachChange}}' },
              { label: 'Engagement Rate', value: '{{metrics.engagementRate}}%', change: '{{metrics.engagementChange}}' },
              { label: 'Conversions', value: '{{metrics.conversions}}', change: '{{metrics.conversionChange}}' },
              { label: 'ROI', value: '{{metrics.roi}}%', change: '{{metrics.roiChange}}' }
            ]
          }
        },
        {
          id: 'performance-chart',
          type: SectionType.CHART,
          title: 'Performance Over Time',
          content: {
            type: 'line',
            data: '{{charts.performanceOverTime}}'
          }
        },
        {
          id: 'influencer-table',
          type: SectionType.TABLE,
          title: 'Influencer Performance',
          content: {
            columns: ['Influencer', 'Posts', 'Reach', 'Engagement', 'Conversions'],
            data: '{{tables.influencerPerformance}}'
          }
        }
      ],
      isActive: true,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Influencer Analytics Template
    this.templates.set('influencer-analytics', {
      id: 'influencer-analytics',
      name: 'Influencer Analytics Report',
      description: 'Detailed influencer performance analytics',
      format: ReportFormat.EXCEL,
      category: 'influencer',
      sections: [
        {
          id: 'profile-summary',
          type: SectionType.SUMMARY,
          title: 'Profile Overview',
          content: {
            metrics: [
              { label: 'Total Followers', value: '{{profile.totalFollowers}}' },
              { label: 'Avg Engagement', value: '{{profile.avgEngagement}}%' },
              { label: 'Total Campaigns', value: '{{profile.totalCampaigns}}' },
              { label: 'Success Rate', value: '{{profile.successRate}}%' }
            ]
          }
        },
        {
          id: 'campaign-history',
          type: SectionType.TABLE,
          title: 'Campaign History',
          content: {
            columns: ['Campaign', 'Brand', 'Date', 'Performance', 'Earnings'],
            data: '{{tables.campaignHistory}}'
          }
        },
        {
          id: 'audience-chart',
          type: SectionType.CHART,
          title: 'Audience Demographics',
          content: {
            type: 'pie',
            data: '{{charts.audienceDemographics}}'
          }
        }
      ],
      isActive: true,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Financial Report Template
    this.templates.set('financial-report', {
      id: 'financial-report',
      name: 'Financial Report',
      description: 'Revenue and commission breakdown',
      format: ReportFormat.PDF,
      category: 'finance',
      layout: {
        orientation: 'landscape'
      },
      sections: [
        {
          id: 'header',
          type: SectionType.HEADER,
          content: {
            title: 'Financial Report',
            subtitle: '{{period.start}} - {{period.end}}'
          }
        },
        {
          id: 'revenue-summary',
          type: SectionType.SUMMARY,
          title: 'Revenue Summary',
          content: {
            metrics: [
              { label: 'Total Revenue', value: '{{finance.totalRevenue}}' },
              { label: 'Platform Fees', value: '{{finance.platformFees}}' },
              { label: 'Net Revenue', value: '{{finance.netRevenue}}' },
              { label: 'Growth', value: '{{finance.growth}}%' }
            ]
          }
        },
        {
          id: 'revenue-chart',
          type: SectionType.CHART,
          title: 'Revenue Breakdown',
          content: {
            type: 'bar',
            data: '{{charts.revenueBreakdown}}'
          }
        },
        {
          id: 'transaction-table',
          type: SectionType.TABLE,
          title: 'Transaction Details',
          content: {
            columns: ['Date', 'Campaign', 'Brand', 'Influencer', 'Amount', 'Commission', 'Status'],
            data: '{{tables.transactions}}'
          }
        }
      ],
      isActive: true,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  async register(template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReportTemplate> {
    const newTemplate: ReportTemplate = {
      ...template,
      id: template.id || uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.validateTemplate(newTemplate);
    this.templates.set(newTemplate.id, newTemplate);
    
    // Save to file if path configured
    if (this.templatePath) {
      await this.saveTemplateToFile(newTemplate);
    }

    this.emit('template:registered', newTemplate);
    return newTemplate;
  }

  async get(templateId: string): Promise<ReportTemplate> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new TemplateError(`Template ${templateId} not found`);
    }
    return template;
  }

  async list(filters?: {
    format?: ReportFormat;
    category?: string;
    isActive?: boolean;
  }): Promise<ReportTemplate[]> {
    let templates = Array.from(this.templates.values());

    if (filters) {
      if (filters.format) {
        templates = templates.filter(t => t.format === filters.format);
      }
      if (filters.category) {
        templates = templates.filter(t => t.category === filters.category);
      }
      if (filters.isActive !== undefined) {
        templates = templates.filter(t => t.isActive === filters.isActive);
      }
    }

    return templates;
  }

  async update(templateId: string, updates: Partial<ReportTemplate>): Promise<ReportTemplate> {
    const template = await this.get(templateId);
    
    const updatedTemplate: ReportTemplate = {
      ...template,
      ...updates,
      id: template.id, // Preserve ID
      createdAt: template.createdAt, // Preserve creation date
      updatedAt: new Date(),
      version: template.version + 1
    };

    this.validateTemplate(updatedTemplate);
    this.templates.set(templateId, updatedTemplate);

    if (this.templatePath) {
      await this.saveTemplateToFile(updatedTemplate);
    }

    this.emit('template:updated', updatedTemplate);
    return updatedTemplate;
  }

  async delete(templateId: string): Promise<void> {
    const template = await this.get(templateId);
    
    // Soft delete
    await this.update(templateId, { isActive: false });
    
    this.emit('template:deleted', { templateId });
  }

  async getDefaultTemplate(type: string, format: ReportFormat): Promise<ReportTemplate> {
    // Try to find a matching template
    const templates = await this.list({ format });
    const matchingTemplate = templates.find(t => 
      t.id.includes(type) || t.name.toLowerCase().includes(type.toLowerCase())
    );

    if (matchingTemplate) {
      return matchingTemplate;
    }

    // Return a basic template
    return {
      id: 'basic-template',
      name: 'Basic Report',
      format,
      sections: [
        {
          id: 'header',
          type: SectionType.HEADER,
          content: {
            title: 'Report',
            date: true
          }
        },
        {
          id: 'content',
          type: SectionType.TEXT,
          content: {
            text: '{{content}}'
          }
        }
      ],
      isActive: true,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private validateTemplate(template: ReportTemplate): void {
    if (!template.name) {
      throw new TemplateError('Template name is required');
    }

    if (!template.sections || template.sections.length === 0) {
      throw new TemplateError('Template must have at least one section');
    }

    // Validate sections
    template.sections.forEach((section, index) => {
      if (!section.type) {
        throw new TemplateError(`Section ${index} must have a type`);
      }
      if (!section.content) {
        throw new TemplateError(`Section ${index} must have content`);
      }
    });
  }

  private async saveTemplateToFile(template: ReportTemplate): Promise<void> {
    if (!this.templatePath) return;

    const filename = `${template.id}.json`;
    const filepath = path.join(this.templatePath, filename);
    
    await fs.writeFile(filepath, JSON.stringify(template, null, 2));
  }

  async loadTemplatesFromDisk(): Promise<void> {
    if (!this.templatePath) return;

    try {
      const files = await fs.readdir(this.templatePath);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      for (const file of jsonFiles) {
        const filepath = path.join(this.templatePath, file);
        const content = await fs.readFile(filepath, 'utf-8');
        const template = JSON.parse(content) as ReportTemplate;
        
        this.templates.set(template.id, template);
      }
    } catch (error) {
      console.error('Failed to load templates from disk:', error);
    }
  }
}